import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Switch,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components';
import { 
  DIETARY_RESTRICTIONS, 
  CUISINE_TYPES, 
  COOKING_SKILL_LEVELS 
} from '../utils/constants';
import { isValidBudget, isValidHouseholdSize, formatCurrency } from '../utils';
import { UserProfile } from '../types';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, userProfile, updateUserProfile, signOut } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userProfile) {
      setEditedProfile(userProfile);
    }
  }, [userProfile]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile(userProfile || {});
    setErrors({});
  };

  const validateProfile = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!isValidHouseholdSize(editedProfile.householdSize || 0)) {
      newErrors.householdSize = 'Please enter a valid household size (1-20)';
    }
    
    if (!isValidBudget(editedProfile.weeklyBudget || 0)) {
      newErrors.weeklyBudget = 'Please enter a valid budget (greater than 0)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateProfile()) return;
    
    setIsLoading(true);
    try {
      await updateUserProfile(editedProfile as UserProfile);
      setIsEditing(false);
      Alert.alert('Success', 'Your profile has been updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await signOut();
              // Navigation will be handled by the auth state listener
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const formatDietaryRestrictions = (restrictions: string[] | undefined): string => {
    if (!restrictions || restrictions.length === 0) return 'None';
    
    return restrictions.map(restriction => 
      restriction.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    ).join(', ');
  };
  
  const formatCuisinePreferences = (cuisines: string[] | undefined): string => {
    if (!cuisines || cuisines.length === 0) return 'None';
    return cuisines.join(', ');
  };

  const toggleDietaryRestriction = (restriction: string) => {
    setEditedProfile(prev => {
      const current = prev.dietaryRestrictions || [];
      return {
        ...prev,
        dietaryRestrictions: current.includes(restriction)
          ? current.filter(r => r !== restriction)
          : [...current, restriction]
      };
    });
  };

  const toggleCuisinePreference = (cuisine: string) => {
    setEditedProfile(prev => {
      const current = prev.cuisinePreferences || [];
      return {
        ...prev,
        cuisinePreferences: current.includes(cuisine)
          ? current.filter(c => c !== cuisine)
          : [...current, cuisine]
      };
    });
  };

  if (isLoading) {
    return <LoadingSpinner message="Updating profile..." />;
  }

  if (!userProfile) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Profile</Text>
        {!isEditing && (
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>First Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editedProfile.firstName || ''}
              onChangeText={(text) => setEditedProfile({...editedProfile, firstName: text})}
              placeholder="Enter first name"
              testID="first-name-input"
            />
          ) : (
            <Text style={styles.infoValue}>{userProfile.firstName || 'Not set'}</Text>
          )}
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editedProfile.lastName || ''}
              onChangeText={(text) => setEditedProfile({...editedProfile, lastName: text})}
              placeholder="Enter last name"
              testID="last-name-input"
            />
          ) : (
            <Text style={styles.infoValue}>{userProfile.lastName || 'Not set'}</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Household Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Household Size</Text>
          {isEditing ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.householdSize && styles.inputError]}
                value={String(editedProfile.householdSize || '')}
                onChangeText={(text) => setEditedProfile({...editedProfile, householdSize: parseInt(text) || 0})}
                keyboardType="number-pad"
                placeholder="Enter household size"
                testID="household-size-input"
              />
              {errors.householdSize && (
                <Text style={styles.errorText}>{errors.householdSize}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.infoValue}>{userProfile.householdSize || 'Not set'}</Text>
          )}
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Weekly Budget</Text>
          {isEditing ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.weeklyBudget && styles.inputError]}
                value={String(editedProfile.weeklyBudget || '')}
                onChangeText={(text) => setEditedProfile({...editedProfile, weeklyBudget: parseFloat(text) || 0})}
                keyboardType="decimal-pad"
                placeholder="Enter weekly budget"
                testID="budget-input"
              />
              {errors.weeklyBudget && (
                <Text style={styles.errorText}>{errors.weeklyBudget}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.infoValue}>${userProfile.weeklyBudget || 'Not set'}</Text>
          )}
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cooking Skill</Text>
          {isEditing ? (
            <View style={styles.skillLevelContainer}>
              {Object.entries(COOKING_SKILL_LEVELS).map(([key, value]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.skillLevelButton,
                    editedProfile.cookingSkillLevel === value && styles.skillLevelButtonSelected
                  ]}
                  onPress={() => setEditedProfile({...editedProfile, cookingSkillLevel: value as any})}
                >
                  <Text style={[
                    styles.skillLevelText,
                    editedProfile.cookingSkillLevel === value && styles.skillLevelTextSelected
                  ]}>
                    {key.charAt(0) + key.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.infoValue}>
              {userProfile.cookingSkillLevel ? 
                userProfile.cookingSkillLevel.charAt(0).toUpperCase() + userProfile.cookingSkillLevel.slice(1) : 
                'Not set'}
            </Text>
          )}
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cooking Time (Weekday)</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={String(editedProfile.cookingTimePreference?.weekday || '')}
              onChangeText={(text) => setEditedProfile({
                ...editedProfile, 
                cookingTimePreference: {
                  ...(editedProfile.cookingTimePreference || {}),
                  weekday: parseInt(text) || 0
                }
              })}
              keyboardType="number-pad"
              placeholder="Minutes"
              testID="weekday-time-input"
            />
          ) : (
            <Text style={styles.infoValue}>
              {userProfile.cookingTimePreference?.weekday ? 
                `${userProfile.cookingTimePreference.weekday} minutes` : 
                'Not set'}
            </Text>
          )}
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cooking Time (Weekend)</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={String(editedProfile.cookingTimePreference?.weekend || '')}
              onChangeText={(text) => setEditedProfile({
                ...editedProfile, 
                cookingTimePreference: {
                  ...(editedProfile.cookingTimePreference || {}),
                  weekend: parseInt(text) || 0
                }
              })}
              keyboardType="number-pad"
              placeholder="Minutes"
              testID="weekend-time-input"
            />
          ) : (
            <Text style={styles.infoValue}>
              {userProfile.cookingTimePreference?.weekend ? 
                `${userProfile.cookingTimePreference.weekend} minutes` : 
                'Not set'}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
        
        {isEditing ? (
          <View style={styles.checkboxGroup}>
            {DIETARY_RESTRICTIONS.map((restriction) => (
              <TouchableOpacity
                key={restriction}
                style={styles.checkbox}
                onPress={() => toggleDietaryRestriction(restriction)}
                testID={`restriction-${restriction}`}
              >
                <View style={[
                  styles.checkboxBox,
                  (editedProfile.dietaryRestrictions || []).includes(restriction) && styles.checkboxChecked
                ]} />
                <Text style={styles.checkboxLabel}>{restriction}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.infoValue}>
            {formatDietaryRestrictions(userProfile.dietaryRestrictions)}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuisine Preferences</Text>
        
        {isEditing ? (
          <View style={styles.checkboxGroup}>
            {CUISINE_TYPES.map((cuisine) => (
              <TouchableOpacity
                key={cuisine}
                style={styles.checkbox}
                onPress={() => toggleCuisinePreference(cuisine)}
                testID={`cuisine-${cuisine}`}
              >
                <View style={[
                  styles.checkboxBox,
                  (editedProfile.cuisinePreferences || []).includes(cuisine) && styles.checkboxChecked
                ]} />
                <Text style={styles.checkboxLabel}>{cuisine}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.infoValue}>
            {formatCuisinePreferences(userProfile.cuisinePreferences)}
          </Text>
        )}
      </View>

      {isEditing && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#007AFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  editButton: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  editButtonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  inputContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    minWidth: 120,
    textAlign: 'right',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'right',
  },
  skillLevelContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  skillLevelButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 5,
    marginBottom: 5,
  },
  skillLevelButtonSelected: {
    backgroundColor: '#007AFF',
  },
  skillLevelText: {
    color: '#333',
    fontSize: 14,
  },
  skillLevelTextSelected: {
    color: '#fff',
  },
  checkboxGroup: {
    marginTop: 5,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    paddingHorizontal: 15,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  signOutButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 15,
    marginVertical: 20,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProfileScreen;