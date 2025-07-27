import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  Image
} from 'react-native';
import { UserProfile } from '../../../types';
import { CUISINE_TYPES } from '../../../utils/constants';

interface CuisinePreferencesStepProps {
  profile: Partial<UserProfile>;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const CuisinePreferencesStep: React.FC<CuisinePreferencesStepProps> = ({ profile, updateProfile }) => {
  const toggleCuisinePreference = (cuisine: string) => {
    const currentPreferences = profile.cuisinePreferences || [];
    const updatedPreferences = currentPreferences.includes(cuisine)
      ? currentPreferences.filter(c => c !== cuisine)
      : [...currentPreferences, cuisine];
    
    updateProfile({ cuisinePreferences: updatedPreferences });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.stepTitle}>Cuisine Preferences</Text>
      <Text style={styles.stepDescription}>
        Select the types of cuisine you enjoy. This helps us suggest recipes that match your taste preferences.
      </Text>
      
      <View style={styles.cuisineGrid}>
        {CUISINE_TYPES.map((cuisine) => {
          const isSelected = (profile.cuisinePreferences || []).includes(cuisine);
          return (
            <TouchableOpacity
              key={cuisine}
              style={[
                styles.cuisineCard,
                isSelected && styles.cuisineCardSelected
              ]}
              onPress={() => toggleCuisinePreference(cuisine)}
              testID={`cuisine-${cuisine}`}
            >
              <View style={styles.cuisineContent}>
                <Text style={[
                  styles.cuisineName,
                  isSelected && styles.cuisineNameSelected
                ]}>
                  {cuisine}
                </Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      
      <Text style={styles.noteText}>
        Select as many cuisines as you like. The more you select, the more variety we can offer in your meal plans.
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
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cuisineCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cuisineCardSelected: {
    backgroundColor: '#e6f2ff',
    borderColor: '#007AFF',
  },
  cuisineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cuisineName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  cuisineNameSelected: {
    color: '#007AFF',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
    marginBottom: 20,
  },
});

export default CuisinePreferencesStep;