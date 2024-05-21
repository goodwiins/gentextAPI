import os
import json
import re
import string

from flask import Flask, request, jsonify, url_for, send_from_directory, current_app
from flask_bcrypt import Bcrypt
from flask_session import Session
from config import ApplicationConfig
from flask_cors import CORS, cross_origin
from model import db, User, Interaction

from transformers import GPT2LMHeadModel, GPT2Tokenizer
from sentence_transformers import SentenceTransformer
import torch
from nltk.tokenize import sent_tokenize
import summa.summarizer
import benepar

from flask_jwt_extended import (
    JWTManager, jwt_required, create_access_token,
    create_refresh_token,
    get_jwt_identity, set_access_cookies,
    set_refresh_cookies, unset_jwt_cookies
)

from routes import *

app = Flask(__name__)

tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
model = GPT2LMHeadModel.from_pretrained("gpt2", pad_token_id=tokenizer.eos_token_id)
model_BERT = SentenceTransformer('bert-base-nli-mean-tokens')
benepar_parser = benepar.Parser("benepar_en3")

app.config.from_object(ApplicationConfig)

jwt = JWTManager(app)
bcrypt = Bcrypt(app)
CORS(app, origins=['http://localhost:3000'], supports_credentials=True)

db.init_app(app)

with app.app_context():
    db.create_all()

def preprocess(sentences):
    output = []
    for sent in sentences:
        if any(re.findall(r'[\'"][\w\s.:;,!?\\-]+[\'"]', sent)) or '?' in sent:
            continue
        output.append(sent.strip(string.punctuation))
    return output

def get_candidate_sents(r_text, ratio=0.3):
    candidate_sents = summa.summarizer.summarize(r_text, ratio)
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
    return results

@app.route('/process', methods=['POST'])
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

@app.route('/auth/login', methods=["POST"])
@cross_origin(origin='http://localhost:3000', supports_credentials=True)
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

@app.route('/api/user/<user_id>/data', methods=['GET'])
@jwt_required()
@cross_origin(origin='http://localhost:3000', supports_credentials=True)
def user_data(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        data = user.to_dict()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'message': 'Error fetching user data', 'error': str(e)}), 500

@app.route('/api/logout', methods=["POST"])
@cross_origin(origin='http://localhost:3000', supports_credentials=True)
def logout():
    resp = jsonify({'logout': True})
    unset_jwt_cookies(resp)
    return resp, 200

@app.route('/api/user/<user_id>/interactions', methods=['GET'])
@jwt_required()
@cross_origin(origin='http://localhost:3000', supports_credentials=True)
def get_user_interactions(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    interactions = Interaction.query.filter_by(user_id=user_id).all()
    interactions_json = [interaction.to_dict() for interaction in interactions]
    return jsonify(interactions_json), 200

@app.route('/api/user', methods=['GET'])
@jwt_required()
@cross_origin(origin='http://localhost:3000', supports_credentials=True)
def get_user_id():
    current_user = get_jwt_identity()
    return jsonify({"user_id": current_user}), 200

@app.route('/api/user/<user_id>/session', methods=['GET'])
@jwt_required()
@cross_origin(origin='http://localhost:3000', supports_credentials=True)
def get_user_session(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    current_user = get_jwt_identity()
    if current_user != user.email:
        return jsonify({"msg": "Unauthorized"}), 401

    session_data = user.session_data
    return jsonify(session_data), 200

@app.route('/api/interaction', methods=['POST'])
@jwt_required()
@cross_origin(origin='http://localhost:3000', supports_credentials=True)
def create_interaction():
    body = request.get_json()
    user_id = body["user_id"]
    input_text = body["input_text"]
    response_text = body["response_text"]

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
@cross_origin(origin='http://localhost:3000', supports_credentials=True)
def signup_user():
    body = request.get_json()
    pw_hash = bcrypt.generate_password_hash(body["password"]).decode('utf-8')

    new_user = User(
        email=body["email"],
        password=pw_hash,
        first_name=body.get("first_name", ""),
        last_name=body.get("last_name", "")
    )
    db.session.add(new_user)
    db.session.commit()

    response_body = {
        "message": "Usuario creado correctamente"
    }

    return jsonify(response_body), 200

@app.route('/protected', methods=['GET'])
@jwt_required()
@cross_origin(origin='http://localhost:3000', supports_credentials=True)
def protected():
    current_user = get_jwt_identity()
    return jsonify({"user_id": current_user['user_id']}), 200

if __name__ == '__main__':
    app.run(debug=True, port=8000)
if __name__ == '__main__':
    app.run(debug=True)
