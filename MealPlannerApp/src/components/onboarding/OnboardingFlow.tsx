import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { UserProfile } from '../../types';

// Import step components
import HouseholdInfoStep from './steps/HouseholdInfoStep';
import DietaryRestrictionsStep from './steps/DietaryRestrictionsStep';
import CuisinePreferencesStep from './steps/CuisinePreferencesStep';
import BudgetTimeStep from './steps/BudgetTimeStep';

export interface OnboardingFlowProps {
  onComplete: (profile: UserProfile) => void;
}

type OnboardingNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const { user, updateUserProfile } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    userId: user?.uid || '',
    householdSize: 4,
    dietaryRestrictions: [],
    cuisinePreferences: [],
    cookingSkillLevel: 'intermediate',
    weeklyBudget: 150,
    cookingTimePreference: {
      weekday: 30,
      weekend: 60,
    },
  });
  
  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await updateUserProfile(profile as UserProfile);
      onComplete(profile as UserProfile);
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <HouseholdInfoStep 
            profile={profile} 
            updateProfile={updateProfile} 
          />
        );
      case 2:
        return (
          <DietaryRestrictionsStep 
            profile={profile} 
            updateProfile={updateProfile} 
          />
        );
      case 3:
        return (
          <CuisinePreferencesStep 
            profile={profile} 
            updateProfile={updateProfile} 
          />
        );
      case 4:
        return (
          <BudgetTimeStep 
            profile={profile} 
            updateProfile={updateProfile} 
          />
        );
      default:
        return null;
    }
  };

  if (isSubmitting) {
    return <LoadingSpinner message="Setting up your profile..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Set Up Your Profile</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(currentStep / totalSteps) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {renderStep()}
      </View>

      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[
            styles.nextButton,
            currentStep === 1 && styles.fullWidthButton
          ]} 
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentStep < totalSteps ? 'Next' : 'Complete Setup'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 5,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  fullWidthButton: {
    flex: 1,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default OnboardingFlow;