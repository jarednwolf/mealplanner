# AI-Powered Family Meal Planner 🍽️

An intelligent meal planning platform that learns your family's unique preferences, schedules, and dietary needs to create personalized meal plans that everyone will love.

## 🚀 Features

### Deep Family Personalization
- **Individual Family Profiles**: Track preferences for each family member
- **Context-Aware Planning**: Adapts to busy schedules, sports practices, and special events
- **Behavioral Learning**: Learns from what you actually cook, not just what you plan
- **Smart Compromises**: Finds meals that make everyone happy

### Intelligent Meal Planning
- **AI-Powered Suggestions**: Uses GPT-4 for creative, personalized meal ideas
- **Budget Optimization**: Stays within your budget while maximizing nutrition
- **Weather-Aware**: Suggests comfort foods on cold days, grilling on nice days
- **Predictive Planning**: Anticipates busy weeks and suggests meal prep

### Seamless Shopping Integration
- **Multi-Store Optimization**: Finds the best prices across all your local stores
- **One-Click Shopping**: Integrates with Instacart, Walmart, and more
- **Smart Grocery Lists**: Organized by store layout, excludes pantry items
- **Coupon Integration**: Automatically applies available deals

## 🛠️ Tech Stack

- **Frontend**: React Native (Mobile) + React/Vite (Web)
- **Backend**: Firebase (Auth, Firestore, Functions)
- **AI**: OpenAI GPT-4
- **APIs**: Spoonacular (Recipes), Various grocery partners
- **Languages**: TypeScript throughout

## 📁 Project Structure

```
meal-plan/
├── MealPlannerApp/        # React Native mobile app
│   ├── src/
│   │   ├── screens/       # App screens
│   │   ├── components/    # Reusable components
│   │   ├── services/      # Business logic (shared)
│   │   └── types/         # TypeScript interfaces
│   └── functions/         # Firebase Functions
├── MealPlannerWeb/        # React web app
│   ├── src/
│   │   ├── pages/         # Web pages
│   │   ├── components/    # Web components
│   │   └── services/      # Same business logic
│   └── functions/         # Same Firebase Functions
└── .kiro/specs/          # Project documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase CLI
- React Native development environment (for mobile)

### Setup

1. **Clone the repository**
   ```bash
   git clone git@github.com:jarednwolf/mealplanner.git
   cd mealplanner
   ```

2. **Install dependencies**
   ```bash
   # Root dependencies
   npm install
   
   # Web app
   cd MealPlannerWeb
   npm install
   
   # Mobile app
   cd ../MealPlannerApp
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy example files
   cp MealPlannerWeb/.env.example MealPlannerWeb/.env
   cp MealPlannerApp/env.example MealPlannerApp/.env
   ```

4. **Set up Firebase**
   - Create a Firebase project
   - Enable Authentication and Firestore
   - Add your Firebase config to the `.env` files

5. **Start development**
   ```bash
   # Web app
   cd MealPlannerWeb
   npm run dev
   
   # Mobile app (in another terminal)
   cd MealPlannerApp
   npm run ios  # or npm run android
   ```

## 🎯 Development Timeline

With AI-powered development, we're shipping in **2 weeks**:

- **Days 1-2**: Core infrastructure & quick value
- **Days 3-4**: Engaging family profiles
- **Days 5-7**: Deep personalization
- **Days 8-10**: Predictive intelligence
- **Days 11-14**: Polish & launch

## 🤝 Contributing

This is currently a private project, but we welcome feedback and suggestions!

## 📄 License

Private and confidential.

## 🙏 Acknowledgments

Built with ❤️ using Cursor AI and modern web technologies. 