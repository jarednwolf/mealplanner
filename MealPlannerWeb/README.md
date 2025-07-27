# Meal Planner Web Application

An AI-powered meal planning application that helps families create personalized meal plans, save money, and eat healthier together.

## 🎉 Latest Updates (July 23, 2025)

- **✨ New Landing Page**: Redesigned with focus on family personalization
- **🎨 Colorful Onboarding**: Engaging 6-step setup process with validation
- **🔧 Fixed Signup Flow**: Seamless transition from signup to onboarding
- **💚 Better UX**: Gradient designs, friendly emojis, and conversational copy

## 🚀 Features

- **AI-Powered Meal Planning**: Generate personalized weekly meal plans based on dietary preferences and budget
- **Budget Tracking**: Monitor grocery spending and get cost-optimized meal suggestions
- **Smart Grocery Lists**: Automatically generated shopping lists organized by store sections
- **Dietary Customization**: Support for various dietary restrictions and cuisine preferences
- **User Profiles**: Save preferences, household size, and cooking skill level
- **Beautiful UI**: Modern, responsive design with smooth animations

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication & Firestore)
- **Build Tool**: Vite
- **UI Components**: Heroicons, React Hot Toast
- **Routing**: React Router v6

## 📋 Prerequisites

- Node.js 16+ and npm
- Firebase project with Authentication and Firestore enabled
- (Optional) OpenAI API key for real AI features (mock AI available for testing)

## 🔧 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd meal-plan/MealPlannerWeb
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the `MealPlannerWeb` directory:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# For AI meal planning (choose one):
# Option 1: Use mock AI (no setup required)
VITE_USE_MOCK_AI=true

# Option 2: Use real OpenAI (requires API key and Firebase Functions)
# VITE_FUNCTIONS_URL=https://us-central1-your-project.cloudfunctions.net
# See OPENAI_SETUP.md for detailed instructions
```

4. Set up Firebase:
   - Enable Authentication (Email/Password and Google providers)
   - Enable Firestore Database
   - Deploy security rules (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))

## 🚦 Running the Application

### Development Mode
```bash
npm run dev
```
The app will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
npm run preview
```

## 🧪 Testing with Mock AI

To test the app without setting up OpenAI:

1. Add `VITE_USE_MOCK_AI=true` to your `.env.local` file
2. Run the app normally with `npm run dev`
3. The mock AI will generate realistic meal plans based on your preferences

The mock AI provides:
- Dietary restriction-aware meal plans (vegetarian, vegan, etc.)
- Budget-conscious pricing
- Realistic cooking times adjusted for skill level
- Variety across the week

## 🤖 Setting up Real AI (OpenAI)

For production-ready AI meal planning, see [OPENAI_SETUP.md](./OPENAI_SETUP.md) for detailed instructions on:
- Setting up Firebase Functions
- Configuring OpenAI API keys
- Deploying the AI proxy

## 🔥 Firebase Setup

For detailed Firebase setup instructions, including security rules deployment, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).

Quick development setup:
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy security rules
firebase deploy --only firestore:rules
```

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
├── config/          # Configuration files
├── contexts/        # React contexts
├── pages/          # Page components
├── services/       # Business logic and API calls
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## 🎨 Design System

The application follows a consistent design system documented in [STYLE_GUIDE.md](./STYLE_GUIDE.md).

Key design elements:
- **Primary Color**: Green-600 (#16a34a)
- **Typography**: System font stack
- **Spacing**: 8-point grid system
- **Components**: Card-based layouts with consistent shadows

## 📚 Documentation

- [Project Status](./PROJECT_STATUS.md) - Current implementation status and roadmap
- [Style Guide](./STYLE_GUIDE.md) - Design system documentation
- [Firebase Setup](./FIREBASE_SETUP.md) - Detailed Firebase configuration

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test
```

## 🚀 Deployment

The application can be deployed to various platforms:

### Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

### Vercel
Connect your GitHub repository to Vercel and it will auto-deploy on push.

### Netlify
Drop the `dist` folder into Netlify or connect your repository.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Built with React and Tailwind CSS
- Icons from Heroicons
- Authentication by Firebase 