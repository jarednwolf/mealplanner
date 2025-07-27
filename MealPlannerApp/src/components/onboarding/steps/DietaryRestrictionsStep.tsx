import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { UserProfile } from '../../../types';
import { DIETARY_RESTRICTIONS } from '../../../utils/constants';

interface DietaryRestrictionsStepProps {
  profile: Partial<UserProfile>;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const DietaryRestrictionsStep: React.FC<DietaryRestrictionsStepProps> = ({ profile, updateProfile }) => {
  const toggleDietaryRestriction = (restriction: string) => {
    const currentRestrictions = profile.dietaryRestrictions || [];
    const updatedRestrictions = currentRestrictions.includes(restriction)
      ? currentRestrictions.filter(r => r !== restriction)
      : [...currentRestrictions, restriction];
    
    updateProfile({ dietaryRestrictions: updatedRestrictions });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.stepTitle}>Dietary Restrictions</Text>
      <Text style={styles.stepDescription}>
        Select any dietary restrictions or preferences. This helps us filter out recipes that don't match your needs.
      </Text>
      
      <View style={styles.restrictionsContainer}>
        {DIETARY_RESTRICTIONS.map((restriction) => (
          <TouchableOpacity
            key={restriction}
            style={styles.restrictionItem}
            onPress={() => toggleDietaryRestriction(restriction)}
            testID={`restriction-${restriction}`}
          >
            <View style={[
              styles.checkbox,
              (profile.dietaryRestrictions || []).includes(restriction) && styles.checkboxChecked
            ]} />
            <View style={styles.restrictionTextContainer}>
              <Text style={styles.restrictionText}>
                {restriction.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </Text>
              <Text style={styles.restrictionDescription}>
                {getRestrictionDescription(restriction)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.noteText}>
        Note: You can always update these preferences later in your profile settings.
      </Text>
    </ScrollView>
  );
};

// Helper function to get descriptions for dietary restrictions
const getRestrictionDescription = (restriction: string): string => {
  switch (restriction) {
    case 'vegetarian':
      return 'No meat, but may include dairy and eggs';
    case 'vegan':
      return 'No animal products of any kind';
    case 'gluten-free':
      return 'No wheat, barley, rye, or related grains';
    case 'dairy-free':
      return 'No milk, cheese, or dairy products';
    case 'nut-free':
      return 'No peanuts, tree nuts, or nut products';
    case 'soy-free':
      return 'No soybeans or soy-derived ingredients';
    case 'egg-free':
      return 'No eggs or egg-derived ingredients';
    case 'keto':
      return 'Low carb, high fat diet';
    case 'paleo':
      return 'Based on foods presumed to be available to paleolithic humans';
    case 'low-carb':
      return 'Reduced carbohydrate consumption';
    case 'low-sodium':
      return 'Reduced salt and sodium content';
    default:
      return '';
  }
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
  restrictionsContainer: {
    marginBottom: 20,
  },
  restrictionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 15,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  restrictionTextContainer: {
    flex: 1,
  },
  restrictionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  restrictionDescription: {
    fontSize: 14,
    color: '#666',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
    marginBottom: 20,
  },
});

export default DietaryRestrictionsStep;