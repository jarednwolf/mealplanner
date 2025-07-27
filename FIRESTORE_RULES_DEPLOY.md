# Deploying Firestore Security Rules

## Quick Deploy Instructions

To fix the "Missing or insufficient permissions" error, you need to deploy these security rules to your Firebase project.

### Option 1: Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/project/mealplanner-43c0a/firestore/rules)
2. Replace the existing rules with the contents of `firestore.rules`
3. Click "Publish"

### Option 2: Firebase CLI

1. Install Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init firestore
   ```
   - Select your project: `mealplanner-43c0a`
   - Use existing `firestore.rules` file

4. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## What These Rules Do

- ✅ Allow authenticated users to read/write their own data
- ✅ Prevent users from accessing other users' data
- ✅ Allow all authenticated users to read shared recipes
- ✅ Block anonymous access to all data

## Testing

After deploying, test by:
1. Refreshing your web app
2. The permission errors should be gone
3. Data should load correctly in the dashboard 