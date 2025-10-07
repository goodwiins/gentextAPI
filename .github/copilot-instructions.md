# GitHub Copilot Instructions

This document provides guidance for AI coding agents, such as GitHub Copilot, to work effectively within this repository. It outlines the architecture, workflows, and conventions specific to this project.

## Project Overview

This repository contains an educational quiz generator application with two main components:

- **Frontend**: Built with Next.js, TypeScript, TailwindCSS, and Radix UI components. It uses Appwrite for authentication and data storage.
- **Backend**: A FastAPI server written in Python, responsible for generating quiz questions using various NLP models.

## Key Files and Directories

### Frontend
- `frontend/src/pages/`: File-based routing for Next.js pages.
- `frontend/src/components/`: Reusable UI components.
- `frontend/src/hooks/`: Custom React hooks.
- `frontend/src/context/`: React Context providers for authentication and app state.
- `frontend/src/lib/`: API integration logic.

### Backend
- `server/src/api/fastapi_app.py`: FastAPI routes.
- `server/src/generators/`: Text generation logic, including AI model integrations.
- `server/src/services/`: Business logic.
- `server/src/config/`: Configuration and database models.
- `server/src/tests/`: Test files for backend functionality.

## Development Workflows

### Frontend
- Start development server: `npm run dev` (http://localhost:3000)
- Build for production: `npm run build`
- Run tests: `npm test`

### Backend
- Start development server: `python main.py`
- Run tests: `python -m pytest src/tests/`
- Deploy to production: `./src/scripts/deploy.sh`

### Common Commands
- **Frontend Linting**: `npm run lint`
- **Backend Logs**: `sudo journalctl -u gentext-api.service -f`

## Project-Specific Conventions

### Frontend
- Use React Context and custom hooks for state management.
- Centralize API calls in `frontend/src/lib/`.
- Follow TypeScript interfaces for type-safe development.
- Use TailwindCSS for responsive design.

### Backend
- Implement new endpoints in `fastapi_app.py` and corresponding services.
- Use the factory pattern for AI model generators.
- Store environment variables in `server/src/scripts/set_env.sh`.

## Integration Points

- **Appwrite**: Handles authentication and data storage.
- **AI Models**: Supports GPT-2, Claude API, xAI Grok, and transformers for text generation.
- **Deployment**: Backend uses NGINX and systemd for production; frontend deploys to platforms like Vercel.

## Testing

- **Frontend**: Uses Vitest with React Testing Library.
- **Backend**: Uses pytest with test files in `server/src/tests/`.
- Mock files and setup scripts are available in respective test directories.

## Examples

### Adding a Frontend Feature
1. Create a new component in `frontend/src/components/`.
2. Add the component to a page in `frontend/src/pages/`.
3. Use hooks from `frontend/src/hooks/` for state management.

### Adding a Backend Endpoint
1. Define the route in `server/src/api/fastapi_app.py`.
2. Implement the logic in `server/src/services/`.
3. Write tests in `server/src/tests/`.

---

For further details, refer to the `README.md` files in the `frontend` and `server` directories.