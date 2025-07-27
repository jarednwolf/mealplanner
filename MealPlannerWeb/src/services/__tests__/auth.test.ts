import { AuthService } from '../auth';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Mock Firebase modules
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null
    }
  },
  firestore: {}
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should create a new user and user profile', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-user-id',
          email: 'test@example.com'
        }
      };
      
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      (setDoc as jest.Mock).mockResolvedValue(undefined);
      
      const result = await AuthService.signUp('test@example.com', 'password123');
      
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'test-user-id',
          email: 'test@example.com'
        })
      );
      expect(result).toEqual(mockUserCredential);
    });

    it('should handle signup errors', async () => {
      const mockError = { code: 'auth/email-already-in-use', message: 'Email already in use' };
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);
      
      await expect(AuthService.signUp('test@example.com', 'password123')).rejects.toEqual({
        code: 'auth/email-already-in-use',
        message: 'This email is already in use. Please try a different email or sign in.'
      });
    });
  });

  describe('signIn', () => {
    it('should sign in a user with email and password', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-user-id',
          email: 'test@example.com'
        }
      };
      
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      
      const result = await AuthService.signIn('test@example.com', 'password123');
      
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(result).toEqual(mockUserCredential);
    });

    it('should handle signin errors', async () => {
      const mockError = { code: 'auth/wrong-password', message: 'Wrong password' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);
      
      await expect(AuthService.signIn('test@example.com', 'password123')).rejects.toEqual({
        code: 'auth/wrong-password',
        message: 'Incorrect password. Please try again or reset your password.'
      });
    });
  });

  describe('signOut', () => {
    it('should sign out the current user', async () => {
      (signOut as jest.Mock).mockResolvedValue(undefined);
      
      await AuthService.signOut();
      
      expect(signOut).toHaveBeenCalled();
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send a password reset email', async () => {
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);
      
      await AuthService.sendPasswordResetEmail('test@example.com');
      
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com'
      );
    });
  });

  describe('updateUserProfile', () => {
    it('should update the user profile', async () => {
      (updateProfile as jest.Mock).mockResolvedValue(undefined);
      
      await AuthService.updateUserProfile('New Name');
      
      expect(updateProfile).toHaveBeenCalledWith(
        expect.anything(),
        {
          displayName: 'New Name',
          photoURL: null
        }
      );
    });
  });

  describe('getUserProfile', () => {
    it('should get the user profile from Firestore', async () => {
      const mockProfileData = {
        userId: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        householdSize: 4,
        dietaryRestrictions: ['vegetarian'],
        cuisinePreferences: ['Italian', 'Mexican'],
        cookingSkillLevel: 'intermediate',
        weeklyBudget: 150
      };
      
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockProfileData
      });
      
      const result = await AuthService.getUserProfile('test-user-id');
      
      expect(getDoc).toHaveBeenCalled();
      expect(result).toEqual(mockProfileData);
    });

    it('should return null if profile does not exist', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false
      });
      
      const result = await AuthService.getUserProfile('test-user-id');
      
      expect(getDoc).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('updateUserProfileData', () => {
    it('should update user profile data in Firestore', async () => {
      const profileData = {
        firstName: 'Updated',
        lastName: 'Name',
        weeklyBudget: 200
      };
      
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      
      await AuthService.updateUserProfileData('test-user-id', profileData);
      
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          firstName: 'Updated',
          lastName: 'Name',
          weeklyBudget: 200,
          updatedAt: expect.any(Date)
        })
      );
    });
  });
});