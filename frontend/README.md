# GenText API Frontend

A modern, responsive frontend application for the GenText API quiz generation platform. Built with Next.js, TypeScript, and TailwindCSS.

## 🚀 Features

- Modern, responsive UI with TailwindCSS
- Type-safe development with TypeScript
- Component-based architecture
- State management with React Query
- Authentication with NextAuth.js
- Beautiful UI components with Radix UI
- Form handling and validation
- Real-time updates and notifications
- Responsive design for all devices

## 🛠️ Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: Radix UI
- **State Management**: React Query
- **Authentication**: NextAuth.js
- **HTTP Client**: Axios
- **Testing**: Vitest, React Testing Library
- **Animation**: Framer Motion
- **Notifications**: React Hot Toast

## 📁 Project Structure

```
src/
├── api/          # API integration and endpoints
├── components/   # Reusable UI components
├── constants/    # Application constants
├── context/      # React Context providers
├── features/     # Feature-specific components
├── hooks/        # Custom React hooks
├── lib/          # Utility libraries
├── pages/        # Next.js pages
├── shared/       # Shared components and utilities
├── store/        # State management
├── styles/       # Global styles
├── types/        # TypeScript type definitions
└── utils/        # Utility functions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gentextAPI.git
cd gentextAPI/frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 🧪 Testing

```bash
# Run tests
npm test
# or
yarn test
```

## 🏗️ Building for Production

```bash
# Build the application
npm run build
# or
yarn build

# Start production server
npm start
# or
yarn start
```

## 📝 Development Guidelines

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Write meaningful comments
- Follow the existing code structure

### Component Structure

- Keep components small and focused
- Use TypeScript interfaces for props
- Implement proper error boundaries
- Follow the atomic design principle

### State Management

- Use React Query for server state
- Implement React Context for global state
- Keep component state local when possible
- Follow proper state management patterns

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [React Query](https://tanstack.com/query/latest)
