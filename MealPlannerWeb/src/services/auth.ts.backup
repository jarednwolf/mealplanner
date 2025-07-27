import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  AuthError
} from 'firebase/auth';
import { auth, firestore } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

export interface AuthErrorResponse {
  code: string;
  message: string;
}

export class AuthService {
  /**
   * Sign up a new user with email and password
   */
  static async signUp(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile document in Firestore
      await setDoc(doc(firestore, 'userProfiles', userCredential.user.uid), {
        userId: userCredential.user.uid,
        email: userCredential.user.email,
        createdAt: new Date(),
      });
      
      return userCredential;
    } catch (error) {
      console.error('Sign up error:', error);
      throw this.formatAuthError(error as AuthError);
    }
  }

  /**
   * Sign in an existing user with email and password
   */
  static async signIn(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw this.formatAuthError(error as AuthError);
    }
  }

  /**
   * Sign in with Google (for web platform)
   */
  static async signInWithGoogle(): Promise<UserCredential> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Check if user profile exists, if not create one
      const userProfileRef = doc(firestore, 'userProfiles', userCredential.user.uid);
      const userProfileSnap = await getDoc(userProfileRef);
      
      if (!userProfileSnap.exists()) {
        await setDoc(userProfileRef, {
          userId: userCredential.user.uid,
          email: userCredential.user.email,
          firstName: userCredential.user.displayName?.split(' ')[0] || '',
          lastName: userCredential.user.displayName?.split(' ').slice(1).join(' ') || '',
          createdAt: new Date(),
        });
      }
      
      return userCredential;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw this.formatAuthError(error as AuthError);
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<void> {
    try {
      return await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw this.formatAuthError(error as AuthError);
    }
  }

  /**
   * Get the current authenticated user
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Listen for authentication state changes
   */
  static onAuthStateChanged(callback: (user: User | null) => void) {
    return auth.onAuthStateChanged(callback);
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      return await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw this.formatAuthError(error as AuthError);
    }
  }

  /**
   * Update user profile information
   */
  static async updateUserProfile(displayName: string, photoURL?: string): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    try {
      await updateProfile(user, {
        displayName,
        photoURL: photoURL || user.photoURL,
      });
    } catch (error) {
      console.error('Update profile error:', error);
      throw this.formatAuthError(error as AuthError);
    }
  }

  /**
   * Update user email address (requires recent authentication)
   */
  static async updateUserEmail(newEmail: string): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    try {
      await updateEmail(user, newEmail);
      
      // Update email in Firestore profile
      const userProfileRef = doc(firestore, 'userProfiles', user.uid);
      await updateDoc(userProfileRef, { email: newEmail });
    } catch (error) {
      console.error('Update email error:', error);
      throw this.formatAuthError(error as AuthError);
    }
  }

  /**
   * Update user password (requires recent authentication)
   */
  static async updateUserPassword(newPassword: string): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    try {
      await updatePassword(user, newPassword);
    } catch (error) {
      console.error('Update password error:', error);
      throw this.formatAuthError(error as AuthError);
    }
  }

  /**
   * Re-authenticate user with email and password
   */
  static async reauthenticateUser(email: string, password: string): Promise<UserCredential> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    try {
      const credential = EmailAuthProvider.credential(email, password);
      return await reauthenticateWithCredential(user, credential);
    } catch (error) {
      console.error('Reauthentication error:', error);
      throw this.formatAuthError(error as AuthError);
    }
  }

  /**
   * Get user profile from Firestore
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userProfileDoc = await getDoc(doc(firestore, 'userProfiles', userId));
      if (userProfileDoc.exists()) {
        return userProfileDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile in Firestore
   */
  static async updateUserProfileData(userId: string, profileData: Partial<UserProfile>): Promise<void> {
    try {
      const userProfileRef = doc(firestore, 'userProfiles', userId);
      await updateDoc(userProfileRef, { ...profileData, updatedAt: new Date() });
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  /**
   * Format Firebase auth errors into a consistent format
   */
  private static formatAuthError(error: AuthError): AuthErrorResponse {
    const errorCode = error.code || 'auth/unknown';
    let errorMessage = 'An unknown error occurred';
    
    switch (errorCode) {
      case 'auth/email-already-in-use':
        errorMessage = 'This email is already in use. Please try a different email or sign in.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'The email address is not valid.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled. Please contact support.';
        break;
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email. Please check your email or sign up.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password. Please try again or reset your password.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password is too weak. Please use a stronger password.';
        break;
      case 'auth/requires-recent-login':
        errorMessage = 'This operation requires recent authentication. Please log in again.';
        break;
      case 'auth/popup-closed-by-user':
        errorMessage = 'Sign in popup was closed before completing the sign in process.';
        break;
      default:
        errorMessage = error.message || 'An error occurred during authentication.';
    }
    
    return {
      code: errorCode,
      message: errorMessage,
    };
  }
}