import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput,
  TouchableOpacity
} from 'react-native';
import { UserProfile } from '../../../types';
import { COOKING_SKILL_LEVELS } from '../../../utils/constants';
import { isValidHouseholdSize } from '../../../utils';

interface HouseholdInfoStepProps {
  profile: Partial<UserProfile>;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const HouseholdInfoStep: React.FC<HouseholdInfoStepProps> = ({ profile, updateProfile }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateHouseholdSize = (size: number): boolean => {
    if (!isValidHouseholdSize(size)) {
      setErrors(prev => ({
        ...prev,
        householdSize: 'Please enter a valid household size (1-20)'
      }));
      return false;
    }
    
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.householdSize;
      return newErrors;
    });
    
    return true;
  };

  const handleHouseholdSizeChange = (value: string) => {
    const size = parseInt(value) || 0;
    updateProfile({ householdSize: size });
    validateHouseholdSize(size);
  };

  const handleSkillLevelChange = (skillLevel: 'beginner' | 'intermediate' | 'advanced') => {
    updateProfile({ cookingSkillLevel: skillLevel });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepTitle}>Household Information</Text>
      <Text style={styles.stepDescription}>
        Tell us about your household to help us personalize your meal plans.
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>How many people are you cooking for?</Text>
        <TextInput
          style={[styles.input, errors.householdSize && styles.inputError]}
          value={profile.householdSize?.toString() || ''}
          onChangeText={handleHouseholdSizeChange}
          keyboardType="number-pad"
          placeholder="Enter household size"
          testID="household-size-input"
        />
        {errors.householdSize && (
          <Text style={styles.errorText}>{errors.householdSize}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>What's your cooking skill level?</Text>
        <Text style={styles.helperText}>
          This helps us suggest recipes that match your experience.
        </Text>
        
        <View style={styles.skillLevelContainer}>
          {Object.entries(COOKING_SKILL_LEVELS).map(([key, value]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.skillLevelButton,
                profile.cookingSkillLevel === value && styles.skillLevelButtonSelected
              ]}
              onPress={() => handleSkillLevelChange(value as any)}
              testID={`skill-level-${value}`}
            >
              <Text style={[
                styles.skillLevelText,
                profile.cookingSkillLevel === value && styles.skillLevelTextSelected
              ]}>
                {key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: 5,
  },
  skillLevelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  skillLevelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  skillLevelButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  skillLevelText: {
    fontSize: 16,
    color: '#333',
  },
  skillLevelTextSelected: {
    color: '#fff',
  },
});

export default HouseholdInfoStep;