# Firebase Setup Guide

## Quick Fix for Permission Errors

You're seeing Firebase permission errors because the Firestore security rules haven't been set up yet. Here's how to fix it:

### Option 1: Quick Development Setup (Recommended for now)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Replace the existing rules with these temporary development rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. Click **Publish**

⚠️ **WARNING**: These rules allow anyone to read/write your database. Only use for development!

### Option 2: Deploy Proper Security Rules

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in the MealPlannerWeb directory:
```bash
cd MealPlannerWeb
firebase init
```
- Select **Firestore**
- Use existing project
- Accept default files

4. Update `.firebaserc` with your project ID:
```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

5. Deploy the security rules:
```bash
firebase deploy --only firestore:rules
```

### Understanding the Security Rules

The production rules in `firestore.rules` ensure:
- Users can only read/write their own data
- Authentication is required for all operations
- Each user's meal plans, budgets, and profiles are private

### Next Steps

After fixing the permissions:
1. Refresh the page
2. You should now be able to use the dashboard without errors
3. Try generating a meal plan
4. Set up your profile preferences

### Troubleshooting

If you still see errors:
- Check the browser console for specific error messages
- Ensure you're logged in (check for user email in top right)
- Verify Firebase project is active
- Check that Firestore is enabled in Firebase Console 