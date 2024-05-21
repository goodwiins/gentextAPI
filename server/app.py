import os
from flask import Flask, request, jsonify, url_for, send_from_directory,current_app


from flask_bcrypt import Bcrypt
from flask_session import Session
from config import ApplicationConfig
from flask_cors import CORS, cross_origin # type: ignore
from model import db, User, Interaction




from transformers import GPT2LMHeadModel, GPT2Tokenizer
from sentence_transformers import SentenceTransformer
import torch
from nltk.tokenize import sent_tokenize
import re
import summa.summarizer
import benepar

from flask_jwt_extended import (
    JWTManager, jwt_required, create_access_token,
 create_refresh_token,
    get_jwt_identity, set_access_cookies,
    set_refresh_cookies, unset_jwt_cookies
)

from routes import *



# @app.route("/api/text",methods=['POST'])
# def saving_text():
#     text = request.json["text"]
#     if text is None:
#         return jsonify({''})
#     return jsonify({'text': text})

# @app.route("/api")
# def hello_world():
#     return jsonify({
#         'message': "you are here in the api"

#     })



app = Flask(__name__)





tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
model = GPT2LMHeadModel.from_pretrained("gpt2", pad_token_id=tokenizer.eos_token_id)
model_BERT = SentenceTransformer('bert-base-nli-mean-tokens')
benepar_parser = benepar.Parser("benepar_en3")

app.config.from_object(ApplicationConfig)
# Change this!

jwt = JWTManager(app)
bcrypt = Bcrypt(app)
CORS(app)

# server_session = Session(app)
db.init_app(app)


with app.app_context():
    db.create_all()







@app.route('/process', methods=['POST'])


def preprocess(sentences):
    output = []
    for sent in sentences:
        if any(re.findall(r'[\'"][\w\s.:;,!?\\-]+[\'"]', sent)) or '?' in sent:
            continue
        output.append(sent.strip(string.punctuation))
    return output

def get_candidate_sents(r_text, ratio=0.3):
    candidate_sents = summarize(r_text, ratio)
    candidate_sents_list = sent_tokenize(candidate_sents)
    candidate_sents_list = [re.split(r'[:;]+', x)[0] for x in candidate_sents_list]
    filtered_list = [sent for sent in candidate_sents_list if 30 < len(sent) < 150]
    return filtered_list

def get_sentence_completions(sentences):
    completions = {}
    for sentence in sentences:
        tree = benepar_parser.parse(sentence)
        last_nounphrase, last_verbphrase = get_right_most_VP_or_NP(tree)
        completions[sentence] = [last_nounphrase, last_verbphrase]
    return completions

def get_right_most_VP_or_NP(parse_tree, last_NP=None, last_VP=None):
    for subtree in reversed(parse_tree):
        if type(subtree) is not str and subtree.label() in ["NP", "VP"]:
            if subtree.label() == "NP":
                last_NP = subtree
            else:
                last_VP = subtree
    return last_NP, last_VP

def store(completions):
    results = []
    for sentence, phrases in completions.items():
        result = {"sentence": sentence, "phrases": [p.flatten() for p in phrases if p]}
        results.append(result)

def process_text():
    content = request.json.get('text', None)
    if not content:
        return jsonify({"error": "No text provided"}), 400

    try:
        candidate_sents = get_candidate_sents(content)
        filtered_sents = preprocess(candidate_sents)
        sentence_completions = get_sentence_completions(filtered_sents)
        response = store(sentence_completions)
        return jsonify({"result": response}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


    return json.dumps(results, indent=4)


@app.route('/auth/login', methods=["POST"])
def login_token():
    email = request.json.get("email", None)
    password = request.json.get("password", None)

    user = User.query.filter_by(email=email).first()
    if user is None:
        return jsonify({"error": "Wrong email or passwords"}), 401

    if not bcrypt.check_password_hash(user.password, password):
        return jsonify({"error": "Unauthorized"}), 401

    access_token = create_access_token(identity={"email": email, "user_id": user.id})

    return jsonify({
        "email": email,
        "access_token": access_token,
        "user_id": user.id,
    }), 200


@app.route('/api', methods=['POST'])
def create_token():
    email = request.get_json('email', None)
    password = request.get_json('password', None)
    if email is "test" or password is "test":
        return jsonify({"msg": "missing email or password"}), 400
    access_token = create_access_token(identity=email)
    return jsonify(access_token=access_token), 200

@app.route('/api/user/<user_id>/data', methods=['GET'])
def user_data(user_id):
    try:
        data = get_user_data(user_id)
        return jsonify(data)
    except Exception as e:
        return jsonify({'message': 'Error fetching user data', 'error': str(e)}), 500

# @app.route('/api/login', methods=['POST'])
# def login_user():
#     body = json.loads(request.data)
#     user = User.query.filter_by(email=body["email"]).first()

#     if user is None: 
#         return jsonify({"msg": "not found"}), 404
    
#     pw_hash = bcrypt.check_password_hash(user.password, body["password"])
#     if not pw_hash:
#         return jsonify({"msg": "email or password are incorrect"}), 401 
#     access_token = create_access_token(identity=body["email"])
#     return jsonify(access_token=access_token, user_id=user.id), 200



@app.route("/api/logout", methods=["POST"])
def logout():
    resp = jsonify({'logout': True})
    unset_jwt_cookies(resp)
    return resp, 200



@app.route('/api/user/<user_id>/interactions', methods=['GET'])
def get_user_interactions(user_id):
    # Check if the user exists
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    # Get the user's interactions
    interactions = Interaction.query.filter_by(user_id=user_id).all()
    # Convert the interactions to JSON
    interactions_json = [interaction.to_dict() for interaction in interactions]
    return jsonify(interactions_json), 200

@app.route('/api/user', methods=['GET'])
@jwt_required()
def get_user_id():
    # Get the identity of the current user from the JWT
    current_user = get_jwt_identity()

    # Assuming the identity is the user_id
    return jsonify({"user_id": current_user}), 200


@app.route('/api/user/<user_id>/session', methods=['GET'])
@jwt_required()
def get_user_session(user_id):
    # Check if the user exists
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    # Check if the user is the same as the one in the token
    current_user = get_jwt_identity()
    if current_user != user.email:
        return jsonify({"msg": "Unauthorized"}), 401

    # Get the user's session data
    session_data = user.session_data  # Replace with actual method to get session data

    return jsonify(session_data), 200

@app.route('/api/interaction', methods=['POST'])
def create_interaction():
    body = json.loads(request.data)
    user_id = body["user_id"]
    input_text = body["input_text"]
    response_text = body["response_text"]

    # Check if the user exists
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    new_interaction = Interaction(
        user_id=user_id,
        input_text=input_text,
        response_text=response_text
    )
    db.session.add(new_interaction)
    db.session.commit()

    response_body = {
        "message": "Interaction created successfully"
    }

    return jsonify(response_body), 200


@app.route('/auth/signup', methods=['POST'])
def signup_user():
    body = json.loads(request.data)
    pw_hash = bcrypt.generate_password_hash(body["password"]).decode('utf-8')

    new_user = User(
        email=body["email"],
        password=pw_hash,
        first_name=body.get("first_name", ""),  # Get first_name from request body or default to an empty string
        last_name=body.get("last_name", "")    # Get last_name from request body or default to an empty string
    )
    db.session.add(new_user)
    db.session.commit()

    response_body = {
        "message": "Usuario creado correctamente"
    }

    return jsonify(response_body), 200





@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    # Access the identity of the current user with get_jwt_identity
    current_user = get_jwt_identity()
    return jsonify(
        {"user_id": current_user['user_id']}), 200



if __name__ == '__main__':
    app.run(debug=True, port=8000)