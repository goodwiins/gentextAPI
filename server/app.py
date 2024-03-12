from flask import Flask, abort, session
from flask_bcrypt import Bcrypt
from flask_session import Session
from config import ApplicationConfig
from flask_cors import CORS, cross_origin
from model import db, User
from routes import *

app = Flask(__name__)
app.config.from_object(ApplicationConfig)

bcrypt = Bcrypt(app)
CORS(app, supports_credentials=True)
server_session = Session(app)
db.init_app(app)

with app.app_context():
    db.create_all()

@app.route("/@me")
def get_current_user():
    user_id = session.get('user_id')
    if user_id is None:
        return jsonify({'error': 'Unauthorized'}),401
    user = User.query.filter_by(id=user_id).first()
    return jsonify({'id': user.id,
                    "email": user.email})


@app.route("/logout", methods=["POST"])
def logout_user():
    session.pop("user_id")
    return "200"


@app.route("/login", methods=["POST"])
def login_user():
    email = request.json["email"]
    password = request.json["password"]
    user = User.query(email =email).first()
    if user is None:
        return jsonify({"error": "Unauthorized"}), 401
    if not bcrypt.check_password_hash(user.password, password):
        return jsonify({"error": "Unauthorized"}), 401

    session["user_id"] = user.id
    return jsonify({
        "id": user.id,
        "email": user.email
    })

@app.route("/register", methods=["POST"])
def register():
    email = request.json["email"]
    password = request.json["password"]
    user_exist = User.query.filter_by(email=email).first() is not None
    if user_exist:
        abort(499)
    hashed_password = bcrypt.generate_password_hash(password)
    new_user = User(email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({
        "id": new_user.id,
        "email": new_user.email
        }
    )

if __name__ == '__main__':
    app.run(debug=True)




