import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { userProfile } = useAuth();

  if (!userProfile) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {userProfile.firstName || 'there'}!</Text>
        <Text style={styles.subtitle}>What would you like to do today?</Text>
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => navigation.navigate('MealPlan', {})}
        >
          <Text style={styles.cardTitle}>Weekly Meal Plan</Text>
          <Text style={styles.cardDescription}>
            Generate a personalized meal plan based on your preferences and budget
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card} 
          onPress={() => {
            // TODO: Navigate to grocery list screen when implemented
            console.log('Grocery list feature coming soon!');
          }}
        >
          <Text style={styles.cardTitle}>Grocery List</Text>
          <Text style={styles.cardDescription}>
            View and manage your shopping list for the week
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card} 
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.cardTitle}>Your Profile</Text>
          <Text style={styles.cardDescription}>
            Update your preferences, dietary restrictions, and budget
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
  cardContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  },
});

export default HomeScreen;