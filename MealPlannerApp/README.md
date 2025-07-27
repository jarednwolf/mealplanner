# AI Meal Planner App

An intelligent meal planning and grocery assistant powered by AI that helps families save time and money while eating healthier.

## Features

- AI-powered weekly meal plan generation
- Budget-aware grocery list optimization
- Pantry tracking and waste reduction
- Personalized recommendations based on feedback
- Integrated grocery shopping with multiple partners
- Recipe guidance and cooking assistance

## Tech Stack

- **Frontend**: React Native (iOS/Android) + React (Web)
- **Backend**: Node.js serverless functions
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **AI**: OpenAI GPT-4
- **Language**: TypeScript

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- React Native development environment
- Firebase project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your Firebase and API keys in `.env`

### Available Scripts

- `npm start` - Start React Native metro bundler
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Start web development server
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

### Project Structure

```
src/
├── components/     # Reusable UI components
├── config/         # Configuration files
├── services/       # API services and business logic
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── App.tsx         # Main application component
```

## Development Workflow

1. Create feature branches from main
2. Write tests for new functionality
3. Ensure all tests pass: `npm test`
4. Check code quality: `npm run lint && npm run type-check`
5. Format code: `npm run format`
6. Submit pull request

## Environment Variables

See `.env.example` for required environment variables including:
- Firebase configuration
- OpenAI API key
- Recipe database API key
- Grocery partner API keys

## License

MIT