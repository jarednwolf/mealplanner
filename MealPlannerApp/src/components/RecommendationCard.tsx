import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { recommendationService } from '../services/recommendation';
import { Meal } from '../types';

export const RecommendationCard: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [recommendations, setRecommendations] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [user]);

  const loadRecommendations = async () => {
    if (!user || !userProfile) return;
    
    try {
      setLoading(true);
      // Using the SAME service as the web app!
      const meals = await recommendationService.getPersonalizedRecommendations(
        user.uid,
        userProfile,
        5
      );
      setRecommendations(meals);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recommended for You</Text>
      {/* React Native specific UI */}
      <FlatList
        data={recommendations}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.mealCard}>
            <Text style={styles.mealName}>{item.recipeName}</Text>
            <Text style={styles.mealTime}>{item.prepTime + item.cookTime} min</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  mealCard: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    marginRight: 12,
    borderRadius: 8,
    width: 150,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
}); 