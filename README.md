# Educational Question Generation Application Analysis

After reviewing your code, I see you're building a Flask-based web application that generates educational assessment content from text. Let me break down the main components and functionality of your project.

## Core Features

Your application specializes in generating two types of educational content:

1. **Boolean (Yes/No) Questions** - Referenced in the README but appears to be partially implemented
2. **True/False Statements** - Fully implemented, which:
   - Takes input text
   - Extracts key sentences using text summarization
   - Creates partial sentences
   - Uses GPT-2 to generate false versions of these sentences

## Technical Architecture

- **Backend**: Flask web server with REST API endpoints
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: JWT-based user authentication system
- **NLP Pipeline**:
  - spaCy for general text processing
  - Benepar for constituency parsing
  - Transformers (GPT-2) for generating false statements
  - BERT for sentence similarity to ensure generated false statements are sufficiently different
  - Summa for extractive summarization

## Main Components

1. **Authentication System**:
   - User registration/signup
   - Login with JWT
   - Password update functionality
   - User data retrieval

2. **Text Processing Pipeline**:
   - Text summarization to identify key sentences
   - Sentence parsing to identify noun and verb phrases
   - Partial sentence creation
   - False statement generation with GPT-2
   - Similarity filtering with BERT

3. **API Endpoints**:
   - `/process_text` - Main endpoint for text processing
   - Various auth endpoints (`/auth/login`, `/auth/signup`)
   - User data endpoints (`/api/user/<user_id>/data`, etc.)
   - Interaction tracking endpoints

## Sample Workflow

Based on the example in the README:

1. User inputs educational text (like geological information about tectonic plates)
2. The system:
   - Identifies key sentences from the text
   - Creates partial sentences
   - Generates false variants of these sentences
3. Returns structured data that can be used to create educational assessments

## Potential Improvements

1. **Code Organization**:
   - There's duplication between `text_process.py` and `True_Flase_gen/prep.py`
   - Consider consolidating the NLP functionality

2. **Error Handling**:
   - Add more robust error handling throughout the application
   - Implement proper validation for API inputs

3. **Performance**:
   - The NLP models are computationally expensive
   - Consider adding caching for processed texts
   - Look into batch processing for multiple texts

4. **Security**:
   - The `.env` file contains a hardcoded SECRET_KEY
   - Implement proper environment variable handling
   - Ensure CORS is properly configured for production

## How to Run the Application

Based on the code, you would:

1. Install dependencies: `pip install -r server/requirements.txt`
2. Set up the SQLite database
3. Run the Flask application: `python server/app.py`
4. The server will run on port 8000
5. Connect to the API from your frontend (which appears to be running on localhost:3000)
