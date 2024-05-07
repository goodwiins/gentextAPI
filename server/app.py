import os
from flask import Flask, request, jsonify, url_for, send_from_directory,current_app
from flask_bcrypt import Bcrypt
from flask_session import Session
from config import ApplicationConfig
from flask_cors import CORS, cross_origin # type: ignore
from model import db, User

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

app.config.from_object(ApplicationConfig)
# Change this!

jwt = JWTManager(app)
bcrypt = Bcrypt(app)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# server_session = Session(app)
db.init_app(app)


with app.app_context():
    db.create_all()


@app.route('/api/logintoken', methods=["POST"])
def login_token():
    email = request.json.get("email", None)
    password = request.json.get("password", None)

    user = User.query.filter_by(email=email).first()
    # if email != "test" or password != "test":
    #    return {"msg": "Wrong email or password"}, 401
    if user is None:
        return jsonify({"error": "Wrong email or passwords"}), 401

    if not bcrypt.check_password_hash(user.password, password):
        return jsonify({"error": "Unauthorized"}), 401

    access_token = create_access_token(identity=email)
    # response = {"access_token":access_token}

    return jsonify({
        "email": email,
        "access_token": access_token
    })
    # return response


@app.route('/api', methods=['POST'])
def create_token():
    email = request.get_json('email', None)
    password = request.get_json('password', None)
    if email is "test" or password is "test":
        return jsonify({"msg": "missing email or password"}), 400
    access_token = create_access_token(identity=email)
    return jsonify(access_token=access_token), 200



@app.route('/api/login', methods=['POST'])
def login_user():
    body = json.loads(request.data)
    user = User.query.filter_by(email=body["email"]).first()

    if user is None: 
        return jsonify({"msg": "not found"}), 404
    
    pw_hash = bcrypt.check_password_hash(user.password, body["password"])
    if not pw_hash:
        return jsonify({"msg": "email or password are incorrect"}), 401 
    access_token = create_access_token(identity=body["email"])
    return jsonify(access_token=access_token), 200
@app.route("/api/logout", methods=["POST"])
def logout():
    resp = jsonify({'logout': True})
    unset_jwt_cookies(resp)
    return resp, 200



@app.route('/api/signup', methods=['POST'])
def signup_user():
    body = json.loads(request.data)
    pw_hash = current_app.bcrypt.generate_password_hash(body["password"]).decode('utf-8')

    new_user = User(
        email = body["email"],
        password = pw_hash

    )
    db.session.add(new_user)
    db.session.commit()
    


    response_body = {
        "message": "usuario creado correctamente"
    }

    return jsonify(response_body), 200

if __name__ == '__main__':
    app.run(debug=True, port=8001)