# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is an educational quiz generator application with two main components:

- **Frontend**: Next.js 15 with TypeScript, TailwindCSS, and Radix UI components. Uses Appwrite for authentication and data storage.
- **Backend**: FastAPI server with Python that generates quiz questions using NLP models (GPT-2, Claude API, transformers).

## Development Commands

### Frontend (Next.js)
```bash
cd frontend
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run tests with Vitest
```

### Backend (FastAPI)
```bash
cd server
# Development
python main.py                                    # Start server manually
source src/scripts/set_env.sh && python main.py  # With environment variables

# Production deployment
./src/scripts/deploy.sh                           # General deployment
./src/scripts/deploy_do.sh                       # DigitalOcean deployment
./src/scripts/setup_nginx.sh                     # NGINX setup

# Testing
python -m pytest src/tests/                      # Run tests

# Service management (production)
sudo systemctl start gentext-api.service         # Start service
sudo systemctl status gentext-api.service        # Check status
sudo journalctl -u gentext-api.service -f        # View logs
```

## Project Structure

### Frontend Architecture
- **Pages**: Next.js pages in `frontend/src/pages/` (file-based routing)
- **Components**: Reusable UI components in `frontend/src/components/`
- **Hooks**: Custom React hooks in `frontend/src/hooks/`
- **Context**: React Context providers for auth and app state in `frontend/src/context/`
- **Services**: API integration in `frontend/src/lib/`
- **UI Components**: Radix UI-based components in `frontend/src/components/ui/`

### Backend Architecture
- **API Layer**: FastAPI routes in `server/src/api/fastapi_app.py`
- **Generators**: Text generation logic in `server/src/generators/`
  - `claude_generator.py` - Claude API integration
  - `improved_generator.py` - Core false statement generation
  - `generator_factory.py` - Factory pattern for generators
- **Services**: Business logic in `server/src/services/`
- **Config**: Database models and configuration in `server/src/config/`
- **Tests**: Test files in `server/src/tests/`

### Authentication & Data
- **Appwrite**: Used for user authentication and data storage
- **Configuration**: Environment variables for Appwrite in frontend
- **Models**: User interactions stored in Appwrite collections

## Key Implementation Details

### Frontend
- Uses Appwrite SDK for authentication and database operations
- State management with React Context and custom hooks
- Type-safe API calls with TypeScript interfaces
- Responsive design with TailwindCSS
- Toast notifications with react-hot-toast

### Backend
- Generates quiz questions by creating false statements from true sentences
- Supports multiple AI models (GPT-2, Claude, xAI Grok, transformers)
- Uses NLTK and spaCy for text processing
- Handles batch processing of text
- CORS configured for frontend origins

### AI Models Available
- **GPT-2**: Local model for false statement generation
- **Claude**: Anthropic's Claude API integration
- **xAI Grok**: xAI's Grok 4 Fast model via OpenRoute API (free tier)
- **Transformers**: Various sentence transformer models

### Database Schema (Appwrite)
- Collection fields must use camelCase: `userId`, `createdAt`, `title`, `text`, `questions`
- Field names are case-sensitive and must match exactly

## Environment Setup

### Frontend Environment Variables
```
NEXT_PUBLIC_APPWRITE_ENDPOINT=your-appwrite-endpoint
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
```

### Backend Environment Variables
Set in `server/src/scripts/set_env.sh`:
- API configuration (HOST, PORT, CORS_ORIGINS)
- Model configuration (MODEL_DEVICE)
- AI service keys (Claude API key, etc.)

## Testing

- Frontend: Vitest with React Testing Library
- Backend: pytest with test files in `server/src/tests/`
- Setup files and mocks available in respective test directories

## Common Development Patterns

1. **Adding Frontend Features**: Create components, add to pages, implement hooks for state management
2. **Adding Backend Endpoints**: Add routes in `fastapi_app.py`, implement business logic in services
3. **Authentication Flow**: Uses Appwrite authentication with session management
4. **Error Handling**: Consistent error handling with toast notifications on frontend
5. **API Integration**: Centralized in `frontend/src/lib/api-service.ts` and `quizService.ts`

## Deployment

- Backend deploys to DigitalOcean with NGINX reverse proxy
- Frontend can deploy to Vercel or similar platforms
- Uses systemd service for backend process management
- NGINX configuration handles SSL and domain routing
