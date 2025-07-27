import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth';
import { 
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  ShoppingCartIcon,
  ArrowRightIcon,
  CheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create the account
      const userCredential = await AuthService.signUp(formData.email, formData.password);
      
      // Clear any existing profile data to ensure onboarding flow
      // This handles edge cases where profile data might exist
      try {
        const { deleteDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../config/firebase');
        await deleteDoc(doc(db, 'users', userCredential.user.uid));
      } catch (error) {
        // Ignore errors - profile might not exist
        console.log('No existing profile to clear');
      }
      
      // The auth context will automatically redirect to onboarding
      toast.success('Account created! Let\'s set up your profile.');
      
      // Force navigation to onboarding
      navigate('/onboarding', { replace: true });
      
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered. Please log in.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak. Please use at least 6 characters.');
      } else {
        toast.error(error.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    'AI-powered personalized meal plans',
    'Save $200+ monthly on groceries',
    'Dietary restrictions handled',
    'Real-time grocery prices',
    'One-click shopping integration'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left side - Signup form */}
        <div className="flex flex-col justify-center px-8 lg:px-16 xl:px-24">
          <div className="max-w-md w-full mx-auto">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center space-x-2 mb-8">
              <ShoppingCartIcon className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">MealPlanner</span>
            </Link>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Start Your Free Trial
            </h1>
            <p className="text-gray-600 mb-8">
              Join 1,247 families saving time and money on meal planning
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="At least 6 characters"
                    minLength={6}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Confirm your password"
                    minLength={6}
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  id="terms"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  required
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                  I agree to the{' '}
                  <Link to="/terms" className="text-green-600 hover:text-green-700">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-green-600 hover:text-green-700">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center px-6 py-4 rounded-lg font-semibold text-white transition-all ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 transform hover:scale-105'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Start Free Trial
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
                  Log in
                </Link>
              </p>
            </div>
            
            <div className="mt-6 p-4 bg-green-50 rounded-lg text-center">
              <p className="text-sm text-green-700">
                <span className="font-semibold">14-day free trial</span> • No credit card required
              </p>
            </div>
          </div>
        </div>
        
        {/* Right side - Benefits */}
        <div className="hidden lg:flex bg-gradient-to-br from-green-600 to-green-700 items-center justify-center px-16">
          <div className="max-w-lg">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 mb-8">
              <SparklesIcon className="h-12 w-12 text-white mb-4" />
              <h2 className="text-3xl font-bold text-white mb-4">
                Meal Planning That Knows Your Family
              </h2>
              <p className="text-green-100 text-lg mb-8">
                Tell us your preferences once. Get perfectly personalized meal plans forever.
              </p>
              
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center text-white">
                    <CheckIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur rounded-xl p-6">
              <p className="text-white text-lg font-medium mb-2">
                "MealPlanner saved us $300 last month and my kids actually eat what I cook now!"
              </p>
              <div className="flex items-center">
                <img
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80"
                  alt="Sarah M."
                  className="w-10 h-10 rounded-full mr-3 object-cover"
                />
                <div>
                  <p className="text-white font-medium">Sarah M.</p>
                  <p className="text-green-100 text-sm">Mom of 3</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage; 