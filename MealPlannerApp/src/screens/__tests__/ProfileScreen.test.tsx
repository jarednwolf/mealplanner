import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import { useAuth } from '../../contexts/AuthContext';

// Mock the navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('ProfileScreen', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
  };

  const mockUserProfile = {
    userId: 'test-user-id',
    firstName: 'Test',
    lastName: 'User',
    householdSize: 4,
    dietaryRestrictions: ['vegetarian'],
    cuisinePreferences: ['Italian', 'Mexican'],
    cookingSkillLevel: 'intermediate',
    weeklyBudget: 150,
    cookingTimePreference: {
      weekday: 30,
      weekend: 60,
    },
  };

  const mockUpdateUserProfile = jest.fn();
  const mockSignOut = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      userProfile: mockUserProfile,
      updateUserProfile: mockUpdateUserProfile,
      signOut: mockSignOut,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders user profile information correctly', () => {
    const { getByText } = render(<ProfileScreen />);
    
    expect(getByText('Your Profile')).toBeTruthy();
    expect(getByText('test@example.com')).toBeTruthy();
    expect(getByText('Test')).toBeTruthy();
    expect(getByText('User')).toBeTruthy();
    expect(getByText('4')).toBeTruthy();
    expect(getByText('$150')).toBeTruthy();
    expect(getByText('Intermediate')).toBeTruthy();
    expect(getByText('30 minutes')).toBeTruthy();
    expect(getByText('60 minutes')).toBeTruthy();
    expect(getByText('vegetarian')).toBeTruthy();
    expect(getByText('Italian, Mexican')).toBeTruthy();
  });

  it('enters edit mode when edit button is pressed', () => {
    const { getByText, getAllByText } = render(<ProfileScreen />);
    
    fireEvent.press(getByText('Edit'));
    
    // Check if we're in edit mode by looking for the Save Changes button
    expect(getByText('Save Changes')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
    
    // Check if input fields are rendered
    expect(getAllByText('First Name')[0]).toBeTruthy();
  });

  it('updates profile when save button is pressed', async () => {
    const { getByText, getByTestId } = render(<ProfileScreen />);
    
    // Enter edit mode
    fireEvent.press(getByText('Edit'));
    
    // Update household size
    const householdSizeInput = getByTestId('household-size-input');
    fireEvent.changeText(householdSizeInput, '5');
    
    // Update budget
    const budgetInput = getByTestId('budget-input');
    fireEvent.changeText(budgetInput, '200');
    
    // Save changes
    fireEvent.press(getByText('Save Changes'));
    
    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          householdSize: 5,
          weeklyBudget: 200,
        })
      );
    });
  });

  it('calls signOut when sign out button is pressed', () => {
    const { getByText } = render(<ProfileScreen />);
    
    fireEvent.press(getByText('Sign Out'));
    
    // In a real app, this would show an alert first
    // For this test, we're just checking if the function was called
    expect(mockSignOut).toHaveBeenCalled();
  });
});