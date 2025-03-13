from typing import Optional, Dict, Any, Union  # Ensure this is at the very top
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, constr
from datetime import timedelta, datetime
import uvicorn
# from generator_factory import StatementGeneratorFactory
# from improved_generator import ImprovedFalseStatementGenerator
import nltk
from nltk.tokenize import word_tokenize
from fastapi.middleware.cors import CORSMiddleware  # Add CORS middleware

# ...import and setup for JWT, database and password hashing (to be implemented)...
# For example, use fastapi_jwt_auth or equivalent for authentication

app = FastAPI(
    title="GenText API (FastAPI)",
    description="Converted from Flask to FastAPI",
    version="1.0.0"
)

# Add CORSMiddleware to allow requests from your frontend app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextRequest(BaseModel):
    text: str
    num_statements: Optional[int] = 3

class GenerateRequest(BaseModel):
    full_sentence: str
    num_statements: Optional[int] = 3
    partial_sentence: Optional[str] = None  # Make partial_sentence optional

class GenerateResponse(BaseModel):
    success: bool
    data: Dict[str, Any]

class QAResponse(BaseModel):
    success: bool
    data: Union[Dict[str, Any], str]  # Allow either dict or string

class HealthResponse(BaseModel):
    status: str
    message: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    email: EmailStr
    access_token: str
    user_id: str
    expires_in: float

class SignupRequest(BaseModel):
    email: EmailStr
    password: constr(min_length=8)
    first_name: str = ""
    last_name: str = ""

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str

# Initialize the generator factory
# generator_factory = StatementGeneratorFactory()

# Example requests for documentation
example_generate_request = {
    "partial_sentence": "Musk has shown again he can",
    "full_sentence": "Musk has shown again he can influence the digital currency market with just his tweets.",
    "num_statements": 3
}

example_qa_request = {
    "text": """Musk has shown again he can influence the digital currency market with just his tweets. 
            After saying that his electric vehicle-making company Tesla will not accept payments in Bitcoin 
            because of environmental concerns, he tweeted that he was working with developers of Dogecoin 
            to improve system transaction efficiency.""",
    "num_statements": 3
}

# Dummy dependency for protected routes (replace with actual JWT dependency)
def jwt_dependency(request: Request):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    # ...verify token and return user identity...
    return {"user_id": "dummy_user", "email": "dummy@example.com"}

@app.post("/generate/statements", response_model=GenerateResponse)
async def generate_statements(request: GenerateRequest):
    """
    Generate false statements from a sentence. If partial_sentence is not provided,
    it will be automatically generated from the full sentence.
    
    Example request:
    ```json
    {
        "full_sentence": "Musk has shown again he can influence the digital currency market with just his tweets.",
        "num_statements": 3
    }
    ```
    """
    try:
        # If partial_sentence not provided, generate it automatically
        if not request.partial_sentence:
            words = word_tokenize(request.full_sentence)
            partial_idx = len(words) // 2  # Take first half of words
            request.partial_sentence = ' '.join(words[:partial_idx])
        
        statements = generator_factory.generate_false_statements(
            'gpt2',
            request.partial_sentence,
            request.full_sentence,
            request.num_statements
        )
        return {
            "success": True,
            "data": {
                "original_sentence": request.full_sentence,
                "partial_sentence": request.partial_sentence,
                "false_sentences": statements,
                "generator_used": "gpt2"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# @app.post("/generate/qa", response_model=QAResponse)
# async def generate_qa(request: TextRequest):
#     """
#     Generate Q&A format from input text.
    
#     Example request:
#     ```json
#     {
#         "text": "Musk has shown again he can influence the digital currency market...",
#         "num_statements": 3
#     }
#     ```
#     """
#     try:
#         generator = generator_factory.get_generator('gpt2')
#         qa_output = generator.generate_qa_from_text(request.text)
        
#         # Format the response properly
#         if isinstance(qa_output, str):
#             # If the output is a string, wrap it in a dict with metadata
#             formatted_output = {
#                 "format": "qa",
#                 "content": qa_output,
#                 "generated_at": str(datetime.datetime.now())
#             }
#         else:
#             formatted_output = qa_output
            
#         return {
#             "success": True,
#             "data": formatted_output
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return {"status": "ok", "message": "Service is running"}

@app.post("/auth/login", response_model=LoginResponse)
@app.post("/api/auth/login", response_model=LoginResponse)
async def login_token(login_req: LoginRequest):
    # ...lookup user in the database...
    # Dummy check; replace with actual user lookup and password verification
    if login_req.email != "test@example.com" or login_req.password != "secret123":
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    expires = timedelta(days=1)
    # Create token logic (replace with your JWT library)
    access_token = "dummy.jwt.token"
    return {
        "email": login_req.email,
        "access_token": access_token,
        "user_id": "dummy_user",
        "expires_in": expires.total_seconds()
    }

@app.post("/auth/signup")
@app.post("/api/auth/signup")
async def signup_user(signup_req: SignupRequest):
    # ...check for existing user and create new user...
    # Dummy response; replace with actual database insert and error handling
    if signup_req.email == "exists@example.com":
        raise HTTPException(status_code=409, detail="Email already registered")
    
    new_user_id = "new_dummy_user"
    return JSONResponse(status_code=201, content={"message": "User created successfully", "user_id": new_user_id})

@app.post("/api/logout")
async def logout():
    # In FastAPI, client must remove token; you might blacklist tokens instead.
    
    return {"logout": True}

@app.get("/api/protected")
async def protected(user=Depends(jwt_dependency)):
    return {"authenticated": True, "user_id": user["user_id"]}

@app.put("/api/user/update", response_model=UserResponse)
async def update_user(user_data: UserResponse, user=Depends(jwt_dependency)):
    # ...update user profile in the database...
    # Dummy response; replace with actual update logic
    return user_data

@app.put("/api/user/update_password")
async def update_password(new_password: constr(min_length=8), current_password: str = None, user=Depends(jwt_dependency)):
    # ...verify current_password and update with new password...
    return {"message": "Password updated successfully"}

@app.get("/api/user/{user_id}/data", response_model=UserResponse)
async def user_data(user_id: str, user=Depends(jwt_dependency)):
    if user["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to user data")
    # ...fetch user data from the database...
    return {"id": user_id, "email": user["email"], "first_name": "John", "last_name": "Doe"}

if __name__ == "__main__":
    uvicorn.run("fastapi_app:app", host="127.0.0.1", port=8000, reload=True)
