# 🔄 Shared Code Sync Guide

## Overview

This project uses a shared codebase architecture where business logic (services, types, utilities) is shared between the mobile (React Native) and web (React) applications. The sync tool helps keep this shared code in sync between both apps.

## Quick Start

### One-Time Setup
```bash
# From the root directory (meal-plan/)
npm install
```

### Common Commands

```bash
# Sync from mobile to web (most common)
npm run sync:mtw

# Sync from web to mobile
npm run sync:wtm

# Watch mobile changes and auto-sync to web
npm run sync:watch
```

## Architecture

```
meal-plan/
├── MealPlannerApp/        # React Native (Mobile)
│   └── src/
│       ├── services/      # Shared ✅
│       ├── types/         # Shared ✅
│       ├── utils/         # Shared ✅
│       ├── config/        # Shared ✅
│       ├── screens/       # Mobile-specific ❌
│       └── components/    # Mobile-specific ❌
│
├── MealPlannerWeb/        # React (Web)
│   └── src/
│       ├── services/      # Shared ✅
│       ├── types/         # Shared ✅
│       ├── utils/         # Shared ✅
│       ├── config/        # Shared ✅
│       ├── pages/         # Web-specific ❌
│       └── components/    # Web-specific ❌
│
├── sync-shared-code.js    # Sync tool
├── sync.config.json       # Sync configuration
└── package.json           # Root scripts
```

## What Gets Synced?

### ✅ Automatically Synced
- **Services** (`/src/services/`): Business logic, API calls, data processing
- **Types** (`/src/types/`): TypeScript interfaces and type definitions
- **Utils** (`/src/utils/`): Helper functions, constants, formatters
- **Config** (`/src/config/`): Environment and Firebase configuration

### ❌ NOT Synced (Platform-Specific)
- **UI Components**: Different for React Native vs React
- **Navigation**: React Navigation vs React Router
- **Styles**: React Native StyleSheet vs CSS/Tailwind
- **Platform APIs**: Device-specific features

## Workflow Examples

### 1. Adding a New Service

```bash
# 1. Create the service in mobile app
# MealPlannerApp/src/services/newFeature.ts

# 2. Test it in mobile
cd MealPlannerApp && npm start

# 3. Sync to web
npm run sync:mtw

# 4. Both apps now have the service!
```

### 2. Updating Business Logic

```bash
# 1. Fix a bug in grocery.ts (mobile)
# Edit: MealPlannerApp/src/services/grocery.ts

# 2. Sync the fix to web
npm run sync:mtw

# Bug is now fixed in both apps!
```

### 3. Auto-Sync During Development

```bash
# Terminal 1: Run mobile app
npm run dev:mobile

# Terminal 2: Run web app
npm run dev:web

# Terminal 3: Auto-sync changes
npm run sync:watch

# Now any service changes auto-sync!
```

## Configuration

Edit `sync.config.json` to customize:

```json
{
  "syncPaths": [
    {
      "path": "src/services",
      "description": "Business logic services",
      "sync": true  // Set to false to skip
    }
  ],
  "excludePatterns": [
    "node_modules",
    ".test.",
    ".backup"
  ]
}
```

## Best Practices

### 1. **Commit Before Syncing**
```bash
git add .
git commit -m "Update recommendation service"
npm run sync:mtw
```

### 2. **Test After Syncing**
Always test both apps after syncing to ensure compatibility.

### 3. **Keep Services Pure**
Services should not import platform-specific code:

```typescript
// ✅ GOOD - Pure business logic
export class RecipeService {
  async searchRecipes(query: string) {
    // API calls, data processing
  }
}

// ❌ BAD - Platform-specific imports
import { Alert } from 'react-native';  // Don't do this!
```

### 4. **Use Type Definitions**
Shared types ensure consistency:

```typescript
// types/index.ts
export interface Meal {
  id: string;
  recipeName: string;
  // ... same structure for both apps
}
```

## Troubleshooting

### "Source directory not found"
Make sure you're running from the root `meal-plan/` directory.

### Sync Conflicts
If you've made different changes in both apps:
1. Decide which version to keep
2. Sync in that direction
3. The tool creates `.backup` files for safety

### Git Warnings
The tool warns about uncommitted changes. This is normal - just be aware of what you're syncing.

## Advanced Usage

### Custom Sync Script
```javascript
// custom-sync.js
const { syncSharedCode } = require('./sync-shared-code');

// Sync with options
syncSharedCode('mobile-to-web', {
  dryRun: false,
  verbose: true
});
```

### Pre-commit Hook
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/sh
npm run sync:mtw
git add MealPlannerWeb/src/services
git add MealPlannerWeb/src/types
```

## All Available Commands

From root directory:

```bash
# Sync commands
npm run sync:mtw          # Mobile → Web
npm run sync:wtm          # Web → Mobile  
npm run sync:watch        # Auto-sync on changes

# Development
npm run dev:web           # Start web app
npm run dev:mobile        # Start mobile app
npm run dev:functions     # Start Firebase Functions

# Installation
npm run install:all       # Install all dependencies
npm run install:mobile    # Install mobile deps
npm run install:web       # Install web deps
npm run install:functions # Install functions deps

# Building
npm run build:web         # Build web for production

# Deployment
npm run deploy:functions  # Deploy Firebase Functions

# Testing & Linting
npm run test:mobile       # Run mobile tests
npm run test:web          # Run web tests
npm run lint:mobile       # Lint mobile code
npm run lint:web          # Lint web code
```

## Summary

The sync tool enables you to:
- 🚀 Write business logic once, use everywhere
- 🐛 Fix bugs in one place, fixed everywhere
- 📱💻 Maintain consistency between mobile and web
- ⚡ Develop faster with less duplication
- 💰 Reduce maintenance costs

Remember: **Sync shared code, build platform-specific UIs!** 