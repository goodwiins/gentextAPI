# Educational Question Generator

## Project Overview

This application generates educational questions based on text input, designed to help users create quiz-style flashcards for learning purposes. The system uses NLP and AI to analyze text content and generate relevant quiz questions by creating factual and false statements based on the original text.

## System Architecture

The application consists of two main components:

1. **Backend (Flask API)**: 
   - Processes text input and generates questions
   - Handles user authentication and data storage
   - Tracks user interactions

2. **Frontend (Next.js)**: 
   - Provides a user interface for text submission
   - Displays generated questions in a quiz format
   - Manages user authentication and history

### Technology Stack

- **Backend**:
  - Python FastAPI
  - SQLAlchemy ORM
  - JWT Authentication
  - Hugging Face Transformers
  - GPT-2 Medium model for text generation
  - Claude API integration

- **Frontend**:
  - Next.js with TypeScript
  - Tailwind CSS
  - ShadCN UI components
  - React hooks for state management

## Setup Instructions

### Backend Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   cd server
   pip install -r requirements.txt
   ```
3. Set up the environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
4. Download required NLP models:
   ```bash
   python setup_models.py
   ```
5. Start the server:
   ```bash
   python fastapi_app.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Appwrite Setup

This application uses Appwrite as its database and authentication service. Follow these steps to set up Appwrite:

1. Create an account on [Appwrite](https://appwrite.io/) if you don't have one
2. Create a new project in the Appwrite console
3. Set up your environment variables:
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local with your Appwrite credentials
   ```
4. Add your Appwrite API key to the .env.local file:
   ```
   APPWRITE_API_KEY=your-api-key-here
   ```
5. Run the setup page to configure your database:
   - Start your frontend server (`npm run dev`)
   - Navigate to the `/setup` page in your browser
   - Follow the instructions to set up the collection schema
   - Create a test document to verify everything is working

If you encounter field name errors in your Appwrite database, make sure the field names match exactly:
- `userId` (not `user_id`)
- `createdAt` (not `created_at`)
- `title`
- `text`
- `questions`

## Features

### Core Functionality

- **Text Processing**: Submit text to generate educational quiz questions
- **Question Generation**: System analyzes text to identify key sentences and transforms them into quiz questions
- **Answer Options**: Each question includes the correct answer and plausible false statements
- **Smart Context Recognition**: Replaces pronouns in questions with proper nouns from original text

### User Features

- **User Authentication**: Register and login system
- **Interaction History**: Track and review past question generations
- **Data Management**: View, edit, and delete history entries
- **User Settings**: Manage account preferences and personal details

## Component Breakdown

### Backend Components

- **fastapi_app.py**: Main application file with FastAPI routes and server configuration
- **improved_generator.py**: Core logic for generating false statements
- **model.py**: Database models for users and interactions
- **text_process.py**: Text processing utilities for candidate sentence extraction
- **config.py**: Application configuration settings

### Frontend Components

- **index.tsx**: Main page with text submission and quiz display
- **QuizDisplay.tsx**: Component for rendering quiz questions
- **Submission.tsx**: Text input component with character counting
- **history.tsx**: Page for viewing past interactions
- **auth.ts**: Authentication utilities
- **UI Components**: Button, Card, Input and other reusable interface elements

## API Documentation

### Authentication Endpoints

- `POST /auth/login`: Authenticates user and returns JWT token
- `POST /auth/signup`: Registers a new user
- `POST /api/logout`: Invalidates user tokens

### Text Processing Endpoints

- `POST /api/v2/process_text`: Processes submitted text and generates questions
  - Request Body: `{ "text": "Text content to process" }`
  - Response: Array of question objects with format:
    ```json
    [
      {
        "original_sentence": "Complete sentence from text",
        "partial_sentence": "First part of sentence",
        "false_sentences": ["False option 1", "False option 2", "False option 3"]
      }
    ]
    ```

### User Data Endpoints

- `GET /api/user/{user_id}/interactions`: Returns user's interaction history
- `POST /api/interaction`: Creates a new interaction record
- `GET /api/user/{user_id}/data`: Returns user profile data
- `PUT /api/user/update`: Updates user profile information
- `PUT /api/user/update_password`: Updates user password

## Usage Guide

### Generating Questions

1. **Log in** to your account
2. On the home page, **paste your text** into the submission field
3. Click **Submit** to process the text
4. The system will generate quiz questions based on your text
5. Each question will have multiple options - one correct answer and several false options
6. You can **select answers** and submit the quiz for evaluation

### Viewing History

1. Navigate to the **History** page in the navigation menu
2. View a list of all your past interactions
3. Filter or search for specific interactions
4. Click **Edit** to modify an interaction
5. Click **Delete** to remove an interaction

### Managing Account

1. Go to the **Settings** page
2. Update your profile information (name, email)
3. Change your password
4. Manage appearance preferences

## Development Guidelines

### Adding New Features

1. Backend changes:
   - Add new endpoints in `fastapi_app.py`
   - Update database models in `model.py` if needed
   - Run tests to ensure existing functionality is not affected

2. Frontend changes:
   - Add new components in the `components` directory
   - Update pages in the `pages` directory
   - Maintain TypeScript typing for all new functions and components

### Code Style

- **Backend**: Follow PEP 8 for Python code
- **Frontend**: Use ESLint and Prettier for consistent formatting
- **Commit Messages**: Use conventional commit format

## Troubleshooting

### Common Issues

#### Authentication Problems
- Check that your token is valid and not expired
- Ensure you're including the Authorization header in your requests

#### API Connection Issues
- Verify the backend server is running
- Check that your frontend is connecting to the correct API URL
- Ensure CORS is properly configured

#### Question Generation Issues
- Ensure your input text is sufficiently long and contains complete sentences
- Check that your text contains factual statements that can be transformed into questions

## Future Enhancements

- **Enhanced AI Models**: Integrate more advanced language models
- **Multi-Language Support**: Process and generate questions in multiple languages
- **Custom Question Types**: Support for various question formats (multiple choice, true/false, fill-in-blank)
- **Export Functionality**: Export questions to popular learning platforms
- **Real-time Collaboration**: Allow multiple users to work on the same set of questions