import os
import json
import re
import string
import logging
from logging.handlers import RotatingFileHandler
from datetime import timedelta

from flask import Flask, request, jsonify, url_for, send_from_directory, current_app, g
from flask_bcrypt import Bcrypt
from flask_session import Session
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, jwt_required, create_access_token,
    create_refresh_token, get_jwt_identity, set_access_cookies,
    set_refresh_cookies, unset_jwt_cookies
)

# Internal imports
from config import ApplicationConfig
from model import db, User, Interaction
from improved_generator import ImprovedFalseStatementGenerator
import text_process

# Initialize the improved generator
generator = ImprovedFalseStatementGenerator(model_name="gpt2-medium")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app(config_object=ApplicationConfig):
    """Create and configure the Flask application"""
    app = Flask(__name__)
    app.config.from_object(config_object)
    
    # Ensure instance folder exists
    os.makedirs(app.instance_path, exist_ok=True)
    
    # Configure file logging
    if not app.debug:
        file_handler = RotatingFileHandler(
            os.path.join(app.instance_path, 'app.log'),
            maxBytes=10240, 
            backupCount=10
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levellevelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Educational Question Generator startup')
    
    # Initialize extensions
    jwt = JWTManager(app)
    bcrypt = Bcrypt(app)
    CORS(app, origins=['http://localhost:3000'], supports_credentials=True)
    db.init_app(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register routes and blueprints
    register_routes(app, bcrypt)
    
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
    
    return app

def register_error_handlers(app):
    """Register error handlers for the application"""
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "Bad request", "message": str(error)}), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({"error": "Unauthorized", "message": "Authentication required"}), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({"error": "Forbidden", "message": "You don't have permission to access this resource"}), 403
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found", "message": "The requested resource was not found"}), 404
    
    @app.errorhandler(500)
    def server_error(error):
        app.logger.error(f"Server error: {error}")
        return jsonify({"error": "Internal server error", "message": "An unexpected error occurred"}), 500

def register_routes(app, bcrypt):
    """Register routes for the application"""
    
    # API Health Check
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "ok", "message": "Service is running"}), 200
    
    # Text Processing Endpoints
    @app.route('/api/process_text', methods=['POST'])
    def process_text_endpoint():
        """Process text to generate educational questions"""
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        
        data = request.get_json()
        if 'text' not in data or not data['text'].strip():
            return jsonify({"error": "Text field is required and cannot be empty"}), 400
        
        try:
            # Track start time for performance monitoring
            import time
            start_time = time.time()
            
            # Process the text and generate questions
            result = text_process.process_text(data['text'])
            
            # Log processing time for monitoring
            processing_time = time.time() - start_time
            app.logger.info(f"Text processed in {processing_time:.2f} seconds")
            
            # If authenticated, save the interaction
            jwt_identity = get_jwt_identity() if request.headers.get('Authorization') else None
            if jwt_identity:
                try:
                    interaction = Interaction(
                        user_id=jwt_identity['user_id'],
                        input_text=data['text'][:1000],  # Limit stored text size
                        response_text=result[:1000] if isinstance(result, str) else json.dumps(result)[:1000]
                    )
                    db.session.add(interaction)
                    db.session.commit()
                except Exception as e:
                    app.logger.error(f"Failed to save interaction: {str(e)}")
            
            return jsonify(json.loads(result) if isinstance(result, str) else result)
        
        except Exception as e:
            app.logger.error(f"Error processing text: {str(e)}")
            return jsonify({"error": "Failed to process text", "message": str(e)}), 500
    
    # Enhanced Text Processing with Improved Generator
    @app.route('/api/v2/process_text', methods=['POST'])
    def process_text_improved():
        """Process text using the improved generator"""
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        
        data = request.get_json()
        if 'text' not in data or not data['text'].strip():
            return jsonify({"error": "Text field is required and cannot be empty"}), 400
        
        try:
            # Extract candidate sentences
            cand_sent = text_process.get_candidate_sents(data['text'])
            filtered_sentences = text_process.preprocess(cand_sent)
            
            # Get partial sentences
            sent_completion_dict = text_process.get_sentence_completions(filtered_sentences)
            
            # Generate false statements using the improved generator
            results = []
            for key_sentence in sent_completion_dict:
                partial_sentences = sent_completion_dict[key_sentence]
                false_sentences = []
                
                for partial_sent in partial_sentences:
                    false_sents = generator.generate_false_statements(
                        partial_sent, 
                        key_sentence, 
                        num_statements=3
                    )
                    false_sentences.extend(false_sents)
                
                temp = {
                    "original_sentence": key_sentence,
                    "partial_sentence": partial_sentences[0],
                    "false_sentences": false_sentences
                }
                results.append(temp)
            
            # Save results using the /api/interaction endpoint
            jwt_identity = get_jwt_identity() if request.headers.get('Authorization') else None
            if jwt_identity:
                interaction_data = {
                    "user_id": jwt_identity['user_id'],
                    "input_text": data['text'][:1000],  # Limit stored text size
                    "response_text": json.dumps(results)[:1000]  # Limit stored response size
                }
                response = app.test_client().post('/api/interaction', json=interaction_data)
                if response.status_code != 201:
                    app.logger.error(f"Failed to save interaction: {response.get_json().get('message')}")
            
            print(results)
            return jsonify(results)
        
        except Exception as e:
            app.logger.error(f"Error processing text with improved generator: {str(e)}")
            return jsonify({"error": "Failed to process text", "message": str(e)}), 500
    
    # Authentication Endpoints
    @app.route('/auth/login', methods=["POST"])
    @app.route('/api/auth/login', methods=["POST"])  # Add alias for consistent API routing
    def login_token():
        """Authenticate user and provide access token"""
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        user = User.query.filter_by(email=email).first()
        if user is None:
            app.logger.warning(f"Login attempt with non-existent email: {email}")
            return jsonify({"error": "Invalid credentials"}), 401
        
        if not bcrypt.check_password_hash(user.password, password):
            app.logger.warning(f"Failed login attempt for user: {email}")
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Create token with expiration
        expires = timedelta(days=1)
        access_token = create_access_token(
            identity={"email": email, "user_id": user.id},
            expires_delta=expires
        )
        
        app.logger.info(f"User logged in: {email}")
        return jsonify({
            "email": email,
            "access_token": access_token,
            "user_id": user.id,
            "expires_in": expires.total_seconds()
        }), 200
    
    @app.route('/auth/signup', methods=['POST'])
    @app.route('/api/auth/signup', methods=['POST'])  # Add alias for consistent API routing
    def signup_user():
        """Register a new user"""
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get("email") or not data.get("password"):
            return jsonify({"error": "Email and password are required"}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=data["email"]).first()
        if existing_user:
            return jsonify({"error": "Email already registered"}), 409
        
        # Hash password and create user
        pw_hash = bcrypt.generate_password_hash(data["password"]).decode('utf-8')
        
        new_user = User(
            email=data["email"],
            password=pw_hash,
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", "")
        )
        
        try:
            db.session.add(new_user)
            db.session.commit()
            app.logger.info(f"New user registered: {data['email']}")
            
            return jsonify({
                "message": "User created successfully",
                "user_id": new_user.id
            }), 201
        
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error creating user: {str(e)}")
            return jsonify({"error": "Failed to create user", "message": str(e)}), 500
    
    @app.route('/api/logout', methods=["POST"])
    def logout():
        """Log out user by invalidating tokens"""
        resp = jsonify({'logout': True})
        unset_jwt_cookies(resp)
        return resp, 200
    
    # User Management Endpoints
    @app.route('/api/user/update', methods=['PUT'])
    @jwt_required()
    def update_user():
        """Update user profile information"""
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        
        data = request.get_json()
        identity = get_jwt_identity()
        user_id = identity['user_id']
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Update fields
        if "first_name" in data:
            user.first_name = data["first_name"]
        if "email" in data:
            # Check if email already exists
            if data["email"] != user.email:
                existing_user = User.query.filter_by(email=data["email"]).first()
                if existing_user:
                    return jsonify({"error": "Email already in use"}), 409
            user.email = data["email"]
        
        try:
            db.session.commit()
            app.logger.info(f"User {user_id} updated profile")
            return jsonify(user.to_dict()), 200
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error updating user: {str(e)}")
            return jsonify({"error": "Failed to update user", "message": str(e)}), 500
    
    @app.route('/api/user/update_password', methods=['PUT'])
    @jwt_required()
    def update_password():
        """Update user password"""
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        
        data = request.get_json()
        new_password = data.get('password')
        current_password = data.get('current_password')
        
        if not new_password:
            return jsonify({"error": "New password is required"}), 400
        
        identity = get_jwt_identity()
        user_id = identity['user_id']
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # If current password is provided, verify it
        if current_password and not bcrypt.check_password_hash(user.password, current_password):
            return jsonify({"error": "Current password is incorrect"}), 401
        
        try:
            user.password = bcrypt.generate_password_hash(new_password).decode('utf-8')
            db.session.commit()
            app.logger.info(f"User {user_id} updated password")
            return jsonify({"message": "Password updated successfully"}), 200
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error updating password: {str(e)}")
            return jsonify({"error": "Failed to update password", "message": str(e)}), 500
    
    # User Data Endpoints
    @app.route('/api/user/<user_id>/data', methods=['GET'])
    @jwt_required()
    def user_data(user_id):
        """Get user profile data"""
        identity = get_jwt_identity()
        if identity['user_id'] != user_id:
            return jsonify({"error": "Unauthorized access to user data"}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user.to_dict()), 200
    
    @app.route('/api/user', methods=['GET'])
    @jwt_required()
    def get_user_id():
        """Get current user ID from token"""
        identity = get_jwt_identity()
        return jsonify({"user_id": identity['user_id']}), 200
    
    # Interaction Endpoints
    @app.route('/api/user/<user_id>/interactions', methods=['GET'])
    @jwt_required()
    def get_user_interactions(user_id):
        """Get user's history of interactions"""
        identity = get_jwt_identity()
        if identity['user_id'] != user_id:
            return jsonify({"error": "Unauthorized access to user interactions"}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Add pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        interactions = Interaction.query.filter_by(user_id=user_id).order_by(
            Interaction.timestamp.desc()
        ).paginate(page=page, per_page=per_page)
        
        interactions_json = [interaction.to_dict() for interaction in interactions.items]
        
        return jsonify({
            "interactions": interactions_json,
            "total": interactions.total,
            "pages": interactions.pages,
            "page": page
        }), 200
    
    @app.route('/api/interaction', methods=['POST'])
    @jwt_required()
    def create_interaction():
        """Create a new interaction record"""
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ["user_id", "input_text", "response_text"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Verify user owns this interaction
        identity = get_jwt_identity()
        if identity['user_id'] != data["user_id"]:
            return jsonify({"error": "Cannot create interaction for another user"}), 403
        
        user = User.query.get(data["user_id"])
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Create interaction
        try:
            new_interaction = Interaction(
                user_id=data["user_id"],
                input_text=data["input_text"],
                response_text=data["response_text"]
            )
            db.session.add(new_interaction)
            db.session.commit()
            
            return jsonify({
                "message": "Interaction created successfully",
                "id": new_interaction.id
            }), 201
        
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error creating interaction: {str(e)}")
            return jsonify({"error": "Failed to create interaction", "message": str(e)}), 500
    
    # Additional protected route
    @app.route('/api/protected', methods=['GET'])
    @jwt_required()
    def protected():
        """Protected route to verify JWT authentication"""
        identity = get_jwt_identity()
        return jsonify({
            "authenticated": True,
            "user_id": identity['user_id']
        }), 200

    # Documentation endpoints
    @app.route('/api/docs', methods=['GET'])
    def api_docs():
        """Return API documentation endpoints"""
        return jsonify({
            "endpoints": [
                {"path": "/api/health", "method": "GET", "description": "Health check endpoint"},
                {"path": "/api/process_text", "method": "POST", "description": "Process text to generate questions"},
                {"path": "/api/v2/process_text", "method": "POST", "description": "Process text with improved generator"},
                {"path": "/auth/login", "method": "POST", "description": "User login endpoint"},
                {"path": "/auth/signup", "method": "POST", "description": "User registration endpoint"},
                {"path": "/api/logout", "method": "POST", "description": "User logout endpoint"},
                # Include other endpoints...
            ]
        }), 200

# Create the Flask app
app = create_app()

# Run the app if executed directly
if __name__ == '__main__':
    app.run(debug=app.config.get('DEBUG', False), host='0.0.0.0', port=8000)