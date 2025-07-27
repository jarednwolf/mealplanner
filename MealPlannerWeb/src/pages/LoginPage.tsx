import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      setLoading(true);
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created!');
      }
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to sign in');
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const createAndUseTestAccount = async () => {
    const testEmail = 'test@test.com';
    const testPassword = 'test123';
    
    try {
      setLoading(true);
      
      // First try to sign in
      try {
        await signInWithEmailAndPassword(auth, testEmail, testPassword);
        toast.success('Logged in with test account!');
        navigate(from, { replace: true });
        return;
      } catch (signInError: any) {
        // If sign in fails, try to create the account
        if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
          const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
          const user = userCredential.user;
          
          // Create user profile in Firestore
          await setDoc(doc(db, 'users', user.uid), {
            email: testEmail,
            displayName: 'Test User',
            preferences: {
              dietaryRestrictions: [],
              cuisinePreferences: [],
              allergies: [],
              avoidIngredients: []
            },
            household: {
              size: 2,
              weeklyBudget: 100
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          toast.success('Test account created and logged in!');
          navigate(from, { replace: true });
        } else {
          throw signInError;
        }
      }
    } catch (error: any) {
      console.error('Test account error:', error);
      toast.error(error.message || 'Failed to use test account');
    } finally {
      setLoading(false);
    }
  };

  const fillTestCredentials = () => {
    setEmail('test@test.com');
    setPassword('test123');
    toast.success('Test credentials filled!');
  };

  const testFirebaseConnection = async () => {
    try {
      setLoading(true);
      
      // Test 1: Check if Firebase is initialized
      toast('Testing Firebase connection...', { icon: '🔍' });
      
      // Test 2: Try to create user without Firestore
      const testEmail = 'test@test.com';
      const testPassword = 'test123';
      
      try {
        // First try to sign in
        await signInWithEmailAndPassword(auth, testEmail, testPassword);
        toast.success('✅ Signed in successfully!');
        navigate(from, { replace: true });
      } catch (signInError: any) {
        if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
          // Create user without Firestore document
          await createUserWithEmailAndPassword(auth, testEmail, testPassword);
          toast.success('✅ User created! Try signing in now.');
          setEmail(testEmail);
          setPassword(testPassword);
        } else {
          throw signInError;
        }
      }
    } catch (error: any) {
      console.error('Firebase test error:', error);
      toast.error(`Error: ${error.code || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      // This would require a Google Auth provider setup in Firebase
      // For now, we'll just show a toast message
      toast('Google sign-in is not yet implemented.', { icon: '🔗' });
      // Example: await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <ShoppingCartIcon className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              {isLogin ? 'Sign in to your account' : 'Create your account to get started'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-green-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white text-gray-700 px-6 py-3 rounded-lg text-base font-medium border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 