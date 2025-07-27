import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert,
  Image
} from 'react-native';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../contexts/AuthContext';
import { isValidEmail, isValidPassword } from '../utils';
import { LoadingSpinner } from '../components';

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;
type AuthScreenRouteProp = RouteProp<RootStackParamList, 'Auth'>;

const AuthScreen: React.FC = () => {
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const route = useRoute<AuthScreenRouteProp>();
  const { signIn, signUp, error: authError } = useAuth();
  
  const [isLogin, setIsLogin] = useState(route.params?.initialMode !== 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
  }>({});

  const validate = (): boolean => {
    const errors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
      firstName?: string;
      lastName?: string;
    } = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!forgotPassword) {
      if (!password) {
        errors.password = 'Password is required';
      } else if (!isValidPassword(password)) {
        errors.password = 'Password must be at least 6 characters';
      }

      if (!isLogin) {
        if (!firstName) {
          errors.firstName = 'First name is required';
        }
        
        if (!lastName) {
          errors.lastName = 'Last name is required';
        }
        
        if (password !== confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (forgotPassword) {
        // Handle password reset
        await handlePasswordReset();
      } else if (isLogin) {
        // Handle login
        await signIn(email, password);
      } else {
        // Handle registration
        await handleRegistration();
      }
    } catch (err) {
      setError(authError || 'An error occurred during authentication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegistration = async () => {
    try {
      // Register the user
      await signUp(email, password);
      
      // Navigate to onboarding
      navigation.navigate('Onboarding');
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    }
  };

  const handlePasswordReset = async () => {
    try {
      // Import the service directly here to avoid circular dependencies
      const { AuthService } = require('../services/auth');
      await AuthService.sendPasswordResetEmail(email);
      Alert.alert(
        'Password Reset Email Sent',
        'Check your email for instructions to reset your password.',
        [{ text: 'OK', onPress: () => setForgotPassword(false) }]
      );
    } catch (err) {
      console.error('Password reset error:', err);
      throw err;
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setForgotPassword(false);
    setValidationErrors({});
    setError(null);
  };

  const toggleForgotPassword = () => {
    setForgotPassword(!forgotPassword);
    setValidationErrors({});
    setError(null);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      // Import the service directly here to avoid circular dependencies
      const { AuthService } = require('../services/auth');
      await AuthService.signInWithGoogle();
      // Navigation will be handled by the auth state listener
    } catch (err) {
      setError(authError || 'An error occurred during Google sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return <LoadingSpinner message={forgotPassword ? "Sending reset email..." : isLogin ? "Signing in..." : "Creating account..."} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>AI Meal Planner</Text>
          <Text style={styles.subtitle}>
            {forgotPassword 
              ? 'Reset your password'
              : isLogin 
                ? 'Sign in to your account' 
                : 'Create a new account'}
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorMessage}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, validationErrors.email && styles.inputError]}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              testID="email-input"
            />
            {validationErrors.email && (
              <Text style={styles.errorText}>{validationErrors.email}</Text>
            )}
          </View>

          {!forgotPassword && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, validationErrors.password && styles.inputError]}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                testID="password-input"
              />
              {validationErrors.password && (
                <Text style={styles.errorText}>{validationErrors.password}</Text>
              )}
            </View>
          )}

          {!isLogin && !forgotPassword && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={[styles.input, validationErrors.confirmPassword && styles.inputError]}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  testID="confirm-password-input"
                />
                {validationErrors.confirmPassword && (
                  <Text style={styles.errorText}>{validationErrors.confirmPassword}</Text>
                )}
              </View>

              <View style={styles.nameContainer}>
                <View style={[styles.inputContainer, styles.nameInput]}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput
                    style={[styles.input, validationErrors.firstName && styles.inputError]}
                    placeholder="First name"
                    value={firstName}
                    onChangeText={setFirstName}
                    testID="first-name-input"
                  />
                  {validationErrors.firstName && (
                    <Text style={styles.errorText}>{validationErrors.firstName}</Text>
                  )}
                </View>

                <View style={[styles.inputContainer, styles.nameInput]}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput
                    style={[styles.input, validationErrors.lastName && styles.inputError]}
                    placeholder="Last name"
                    value={lastName}
                    onChangeText={setLastName}
                    testID="last-name-input"
                  />
                  {validationErrors.lastName && (
                    <Text style={styles.errorText}>{validationErrors.lastName}</Text>
                  )}
                </View>
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            testID="auth-button"
          >
            <Text style={styles.buttonText}>
              {forgotPassword
                ? 'Send Reset Email'
                : isLogin
                ? 'Sign In'
                : 'Create Account'}
            </Text>
          </TouchableOpacity>

          {isLogin && !forgotPassword && (
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={toggleForgotPassword}
              testID="forgot-password-button"
            >
              <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
            </TouchableOpacity>
          )}

          {forgotPassword && (
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={toggleForgotPassword}
              testID="back-to-login-button"
            >
              <Text style={styles.forgotPasswordText}>Back to login</Text>
            </TouchableOpacity>
          )}

          {!forgotPassword && (
            <TouchableOpacity
              style={styles.switchButton}
              onPress={toggleAuthMode}
              testID="toggle-auth-mode"
            >
              <Text style={styles.switchButtonText}>
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Sign In'}
              </Text>
            </TouchableOpacity>
          )}

          {Platform.OS === 'web' && !forgotPassword && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGoogleSignIn}
                testID="google-sign-in-button"
              >
                <View style={styles.socialButtonContent}>
                  <Text style={styles.socialButtonText}>
                    {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  errorContainer: {
    backgroundColor: '#ffeeee',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  errorMessage: {
    color: '#cc0000',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameInput: {
    flex: 1,
    marginRight: 10,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
    fontSize: 14,
  },
  socialButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  socialButtonText: {
    color: '#333',
    fontSize: 16,
  },
});

export default AuthScreen;