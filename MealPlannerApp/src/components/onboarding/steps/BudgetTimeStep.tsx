import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput,
  ScrollView
} from 'react-native';
import { UserProfile } from '../../../types';
import { isValidBudget } from '../../../utils';

interface BudgetTimeStepProps {
  profile: Partial<UserProfile>;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const BudgetTimeStep: React.FC<BudgetTimeStepProps> = ({ profile, updateProfile }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateBudget = (budget: number): boolean => {
    if (!isValidBudget(budget)) {
      setErrors(prev => ({
        ...prev,
        weeklyBudget: 'Please enter a valid budget (greater than 0)'
      }));
      return false;
    }
    
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.weeklyBudget;
      return newErrors;
    });
    
    return true;
  };

  const handleBudgetChange = (value: string) => {
    const budget = parseFloat(value) || 0;
    updateProfile({ weeklyBudget: budget });
    validateBudget(budget);
  };

  const handleWeekdayTimeChange = (value: string) => {
    const time = parseInt(value) || 0;
    updateProfile({ 
      cookingTimePreference: {
        ...(profile.cookingTimePreference || {}),
        weekday: time
      }
    });
  };

  const handleWeekendTimeChange = (value: string) => {
    const time = parseInt(value) || 0;
    updateProfile({ 
      cookingTimePreference: {
        ...(profile.cookingTimePreference || {}),
        weekend: time
      }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.stepTitle}>Budget & Time</Text>
      <Text style={styles.stepDescription}>
        Set your weekly grocery budget and how much time you have for cooking.
      </Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weekly Grocery Budget</Text>
        <Text style={styles.cardDescription}>
          How much do you want to spend on groceries each week? This helps us suggest recipes that fit your budget.
        </Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={[styles.budgetInput, errors.weeklyBudget && styles.inputError]}
            value={profile.weeklyBudget?.toString() || ''}
            onChangeText={handleBudgetChange}
            keyboardType="decimal-pad"
            placeholder="0.00"
            testID="budget-input"
          />
        </View>
        
        {errors.weeklyBudget && (
          <Text style={styles.errorText}>{errors.weeklyBudget}</Text>
        )}
        
        <Text style={styles.helperText}>
          This is an estimate for your entire household's weekly groceries.
        </Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cooking Time</Text>
        <Text style={styles.cardDescription}>
          How much time do you have available for cooking on weekdays and weekends?
        </Text>
        
        <View style={styles.timeInputGroup}>
          <Text style={styles.label}>Weekdays</Text>
          <View style={styles.timeInputContainer}>
            <TextInput
              style={styles.timeInput}
              value={profile.cookingTimePreference?.weekday?.toString() || ''}
              onChangeText={handleWeekdayTimeChange}
              keyboardType="number-pad"
              placeholder="30"
              testID="weekday-time-input"
            />
            <Text style={styles.timeUnit}>minutes</Text>
          </View>
        </View>
        
        <View style={styles.timeInputGroup}>
          <Text style={styles.label}>Weekends</Text>
          <View style={styles.timeInputContainer}>
            <TextInput
              style={styles.timeInput}
              value={profile.cookingTimePreference?.weekend?.toString() || ''}
              onChangeText={handleWeekendTimeChange}
              keyboardType="number-pad"
              placeholder="60"
              testID="weekend-time-input"
            />
            <Text style={styles.timeUnit}>minutes</Text>
          </View>
        </View>
        
        <Text style={styles.helperText}>
          We'll suggest quick recipes for busy weekdays and more elaborate options for weekends.
        </Text>
      </View>
      
      <Text style={styles.finalNote}>
        You're almost done! After this step, we'll generate your first personalized meal plan.
      </Text>
    </ScrollView>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '500',
    color: '#333',
    marginRight: 5,
  },
  budgetInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: 5,
    marginBottom: 5,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  timeInputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    width: 80,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    marginRight: 10,
  },
  timeUnit: {
    fontSize: 16,
    color: '#666',
  },
  finalNote: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
    marginVertical: 20,
    fontWeight: '500',
  },
});

export default BudgetTimeStep;