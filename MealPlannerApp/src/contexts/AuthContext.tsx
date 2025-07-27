import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { AuthService } from '../services/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  userProfile: UserProfile | null;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (authUser) => {
      setUser(authUser);
      
      if (authUser) {
        try {
          // Fetch user profile from Firestore
          const userProfileDoc = await getDoc(doc(firestore, 'userProfiles', authUser.uid));
          if (userProfileDoc.exists()) {
            setUserProfile(userProfileDoc.data() as UserProfile);
          } else {
            setUserProfile(null);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setError('Failed to load user profile');
        }
      } else {
        setUserProfile(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      await AuthService.signIn(email, password);
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Failed to sign in. Please check your credentials.');
      throw err;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      const credential = await AuthService.signUp(email, password);
      
      // Create empty user profile in Firestore
      await setDoc(doc(firestore, 'userProfiles', credential.user.uid), {
        userId: credential.user.uid,
        email: credential.user.email,
        createdAt: new Date(),
      });
    } catch (err) {
      console.error('Sign up error:', err);
      setError('Failed to create account. Please try again.');
      throw err;
    }
  };

  const signOutUser = async () => {
    try {
      setError(null);
      await AuthService.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out');
      throw err;
    }
  };

  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    if (!user) {
      setError('You must be logged in to update your profile');
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      const userRef = doc(firestore, 'userProfiles', user.uid);
      await setDoc(userRef, { ...userProfile, ...profile }, { merge: true });
      
      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...profile } : null);
    } catch (err) {
      console.error('Profile update error:', err);
      setError('Failed to update profile');
      throw err;
    }
  };

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut: signOutUser,
    userProfile,
    updateUserProfile,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};