import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthScreen from '../screens/AuthScreen';
import MealPlanScreen from '../screens/MealPlanScreen';

// Import auth context
import { useAuth } from '../contexts/AuthContext';

// Define the stack navigator param list
export type RootStackParamList = {
  Home: undefined;
  Onboarding: undefined;
  Profile: undefined;
  Auth: { initialMode?: 'login' | 'register' };
  MealPlan: { id?: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export const Navigation: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Show loading screen while checking auth state
  if (isLoading) {
    return null; // Will be replaced with a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          // Conditional styling for web
          ...(Platform.OS === 'web' && {
            headerStyle: {
              backgroundColor: '#007AFF',
              height: 60,
            },
          }),
        }}
      >
        {user ? (
          // Authenticated user routes
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ title: 'AI Meal Planner' }} 
            />
            <Stack.Screen 
              name="MealPlan" 
              component={MealPlanScreen} 
              options={{ title: 'Weekly Meal Plan' }} 
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={{ title: 'Your Profile' }} 
            />
          </>
        ) : (
          // Unauthenticated user routes
          <>
            <Stack.Screen 
              name="Auth" 
              component={AuthScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Onboarding" 
              component={OnboardingScreen} 
              options={{ headerShown: false }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;