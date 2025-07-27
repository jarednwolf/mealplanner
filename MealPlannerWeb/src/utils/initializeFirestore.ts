/**
 * Utility to help initialize Firestore collections
 * This ensures the collections exist and have the proper structure
 */

import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';

export async function initializeFirestoreCollections(userId: string) {
  console.log('🚀 Initializing Firestore collections for user:', userId);
  
  try {
    // Don't create any default profile - let onboarding handle it
    // This ensures new users are directed to the onboarding flow
    
    // Initialize collections metadata (this helps ensure collections exist)
    const collectionsToInit = ['mealPlans', 'budgets', 'recipes'];
    
    for (const collectionName of collectionsToInit) {
      const metaDoc = doc(firestore, `_metadata/${collectionName}`);
      await setDoc(metaDoc, {
        initialized: true,
        createdAt: new Date(),
        lastUpdated: new Date(),
        userId
      }, { merge: true });
      console.log(`✅ Initialized ${collectionName} collection metadata`);
    }
    
    console.log('🎉 All collections initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing collections:', error);
    return false;
  }
}

// Helper function to verify Firestore is working
export async function verifyFirestoreConnection() {
  try {
    console.log('🔍 Verifying Firestore connection...');
    
    // Try to read from a test collection
    const testRef = doc(firestore, '_test', 'connection');
    await setDoc(testRef, {
      timestamp: new Date(),
      test: true
    });
    
    const testSnap = await getDoc(testRef);
    if (testSnap.exists()) {
      console.log('✅ Firestore connection verified');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Firestore connection verification failed:', error);
    return false;
  }
} 