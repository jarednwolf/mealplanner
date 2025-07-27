import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { UserProfile } from '../types';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();

  const handleOnboardingComplete = (profile: UserProfile) => {
    // Navigate to home screen after onboarding is complete
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <OnboardingFlow onComplete={handleOnboardingComplete} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default OnboardingScreen;