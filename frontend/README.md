# GenText API - Quiz Generation Platform

A web application that generates quiz questions from text input using AI technology. Built with Next.js (frontend) and Python Flask (backend).

## Features

- Text-based quiz generation
- Interactive quiz interface
- User authentication
- Real-time processing
- Responsive design

## Tech Stack

- **Frontend**: Next.js, TypeScript, TailwindCSS
- **Backend**: Python Flask, SQLAlchemy
- **Database**: SQLite
- **Authentication**: JWT

## Prerequisites

- Node.js 18+ 
- Python 3.8+
- Redis (for session management)

## Installation

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/gentextAPI.git
cd gentextAPI/frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Start development server
npm run dev
```

### Backend Setup

```bash
# Navigate to server directory
cd ../server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env

# Start the server
python app.py
```

## Usage

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. Log in or create an account
3. Paste your text in the input field
4. Click "Generate Quiz" to create questions
5. Answer the generated questions
6. Submit your answers to see results

## Development

```bash
# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

- `POST /api/v2/process_text` - Generate quiz from text
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Flask](https://flask.palletsprojects.com/)
- [TailwindCSS](https://tailwindcss.com/)
