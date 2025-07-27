import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { householdMemberService } from '../services/householdMembers';
import { HouseholdMember } from '../types';
import toast from 'react-hot-toast';
import {
  UserIcon,
  HomeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  UsersIcon,
  MapPinIcon,
  PlusIcon,
  SparklesIcon,
  HeartIcon,
  PencilIcon,
  StarIcon,
  BanknotesIcon,
  BoltIcon,
  FaceSmileIcon,
  ShieldCheckIcon,
  ScaleIcon,
  LightBulbIcon as LightBulbIconOutline,
  ShoppingCartIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import HouseholdMemberCard from '../components/HouseholdMemberCard';
import AddEditMemberModal from '../components/AddEditMemberModal';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

interface SimpleMember {
  id: string;
  name: string;
  relationship: 'self' | 'spouse' | 'partner' | 'child' | 'parent' | 'roommate' | 'other';
  isComplete: boolean;
}

const OnboardingPage: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    householdSize: 1,
    weeklyBudget: 100,
    cookingTimeWeekday: 30,
    cookingTimeWeekend: 60,
    goals: [] as string[]
  });

  // Simple member management for onboarding
  const [simpleMembers, setSimpleMembers] = useState<SimpleMember[]>([]);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'basic',
      title: 'Welcome! Let\'s get to know you',
      description: 'Tell us your name so we can personalize your experience',
      icon: UserIcon
    },
    {
      id: 'goals',
      title: 'What are your goals?',
      description: 'Select up to 3 that are most important to you',
      icon: StarIcon
    },
    {
      id: 'address',
      title: 'Where do you shop for groceries?',
      description: 'We\'ll use this to show accurate prices and nearby stores',
      icon: MapPinIcon
    },
    {
      id: 'household',
      title: 'Tell us about your household',
      description: 'How many people are you planning meals for?',
      icon: HomeIcon
    },
    {
      id: 'members',
      title: 'Add your household members',
      description: 'Tell us about the people you cook for',
      icon: UsersIcon
    },
    {
      id: 'budget',
      title: 'Set your weekly grocery budget',
      description: 'We\'ll help you stay within budget with smart recommendations',
      icon: CurrencyDollarIcon
    },
    {
      id: 'cooking',
      title: 'How much time do you have to cook?',
      description: 'We\'ll suggest recipes that fit your schedule',
      icon: ClockIcon
    }
  ];

  // Initialize simple members when household size changes
  useEffect(() => {
    if (currentStep === 2 && formData.householdSize > 0) {
      const currentMemberCount = simpleMembers.length;
      
      if (formData.householdSize > currentMemberCount) {
        // Add new members
        const newMembers = [...simpleMembers];
        for (let i = currentMemberCount; i < formData.householdSize; i++) {
          newMembers.push({
            id: `member-${i}`,
            name: i === 0 ? formData.firstName || 'You' : '',
            relationship: i === 0 ? 'self' : i === 1 ? 'spouse' : 'child',
            isComplete: i === 0 && formData.firstName !== ''
          });
        }
        setSimpleMembers(newMembers);
      } else if (formData.householdSize < currentMemberCount) {
        // Remove extra members
        setSimpleMembers(simpleMembers.slice(0, formData.householdSize));
      }
    }
  }, [formData.householdSize, formData.firstName, currentStep]);

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save profile and complete onboarding
      await saveProfile();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      
      // Prepare profile data
      const profileData = {
        userId: user!.uid,
        email: user!.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        householdSize: formData.householdSize,
        weeklyBudget: formData.weeklyBudget,
        cookingTimePreference: {
          weekday: formData.cookingTimeWeekday,
          weekend: formData.cookingTimeWeekend
        },
        goals: formData.goals,
        dietaryRestrictions: [],
        cuisinePreferences: [],
        cookingSkillLevel: 'intermediate',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Save to Firestore
      await setDoc(doc(db, 'users', user!.uid), profileData);
      
      // Update auth display name
      if (user && (formData.firstName || formData.lastName)) {
        const displayName = `${formData.firstName} ${formData.lastName}`.trim();
        await updateProfile(user, { displayName });
      }
      
      // Save household members
      for (const member of simpleMembers) {
        if (member.name && member.isComplete) {
          try {
            await householdMemberService.createHouseholdMember({
              userId: user!.uid,
              name: member.name,
              relationship: member.relationship,
              dietaryRestrictions: [],
              cuisinePreferences: [],
              allergens: [],
              dislikedIngredients: [],
              favoriteIngredients: [],
              mealPreferences: {
                breakfast: true,
                lunch: true,
                dinner: true,
                snacks: false
              },
              portionSize: 'regular',
              spicePreference: 'medium'
            });
          } catch (error) {
            console.error('Error creating household member:', error);
          }
        }
      }
      
      // Refresh user profile in context
      await refreshUserProfile();
      
      toast.success('Welcome aboard! Your profile is all set up.');
      
      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
      
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditMember = (memberId: string) => {
    setEditingMemberId(memberId);
    setShowAddMemberModal(true);
  };

  const handleSaveMember = async (memberData: Omit<HouseholdMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingMemberId) {
      const updatedMembers = simpleMembers.map(m => 
        m.id === editingMemberId 
          ? { ...m, name: memberData.name, relationship: memberData.relationship, isComplete: true }
          : m
      );
      setSimpleMembers(updatedMembers);
      
      // Update first member name in form data if it's self
      if (simpleMembers.find(m => m.id === editingMemberId)?.relationship === 'self') {
        setFormData({ ...formData, firstName: memberData.name });
      }
    }
    
    setShowAddMemberModal(false);
    setEditingMemberId(null);
  };

  const renderStepContent = () => {
    const stepId = steps[currentStep].id;
    
    switch (stepId) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mb-2">
                <SparklesIcon className="h-7 w-7 text-white" />
              </div>
              <p className="text-base text-gray-600">Let's make meal planning magical for you! ✨</p>
            </div>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => {
                  setFormData({ ...formData, firstName: e.target.value });
                  // Update self member if it exists
                  if (simpleMembers.length > 0 && simpleMembers[0].relationship === 'self') {
                    const updated = [...simpleMembers];
                    updated[0] = { ...updated[0], name: e.target.value, isComplete: e.target.value !== '' };
                    setSimpleMembers(updated);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-base"
                placeholder="John"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name (optional)
              </label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-base"
                placeholder="Doe"
              />
            </div>
          </div>
        );

      case 'goals':
        const goalOptions = [
          { id: 'save-money', label: 'Save money', icon: BanknotesIcon },
          { id: 'save-time', label: 'Save time', icon: BoltIcon },
          { id: 'lower-stress', label: 'Lower stress', icon: FaceSmileIcon },
          { id: 'improve-health', label: 'Improve health', icon: ShieldCheckIcon },
          { id: 'lose-weight', label: 'Lose weight', icon: ScaleIcon },
          { id: 'simplify-cooking', label: 'Simplify cooking', icon: LightBulbIconOutline },
          { id: 'shop-less', label: 'Grocery shop less', icon: ShoppingCartIcon },
          { id: 'waste-less', label: 'Waste less food', icon: TrashIcon }
        ];

        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">What are your goals?</h3>
              <p className="mt-2 text-gray-600">Select up to 3 that are most important to you</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {goalOptions.map(goal => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => {
                    const newGoals = formData.goals.includes(goal.id)
                      ? formData.goals.filter(g => g !== goal.id)
                      : formData.goals.length < 3
                      ? [...formData.goals, goal.id]
                      : formData.goals;
                    setFormData({ ...formData, goals: newGoals });
                  }}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-200 ${
                    formData.goals.includes(goal.id)
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                  } ${formData.goals.length >= 3 && !formData.goals.includes(goal.id) ? 'opacity-40 cursor-not-allowed' : ''}`}
                  disabled={formData.goals.length >= 3 && !formData.goals.includes(goal.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${
                      formData.goals.includes(goal.id)
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                    }`}>
                      <goal.icon className={`h-6 w-6 ${
                        formData.goals.includes(goal.id) ? 'text-green-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <span className={`text-base font-medium ${
                      formData.goals.includes(goal.id) ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {goal.label}
                    </span>
                  </div>
                  {formData.goals.includes(goal.id) && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckIconSolid className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                {formData.goals.length === 0 && 'Select what matters most to you'}
                {formData.goals.length > 0 && formData.goals.length < 3 && `${formData.goals.length} selected • Choose ${3 - formData.goals.length} more`}
                {formData.goals.length === 3 && 'Perfect! You\'ve selected 3 goals'}
              </p>
            </div>
          </div>
        );

      case 'address':
        return (
          <div className="space-y-3">
            <div className="text-center mb-3">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mb-2">
                <MapPinIcon className="h-7 w-7 text-white" />
              </div>
              <p className="text-base text-gray-600">Let's find the best deals near you! 🛒</p>
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address (optional)
              </label>
              <input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-base"
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-base"
                  placeholder="San Francisco"
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  id="state"
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-base"
                  placeholder="CA"
                  maxLength={2}
                />
              </div>
            </div>
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code
              </label>
              <input
                id="zipCode"
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-base"
                placeholder="94105"
                maxLength={5}
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-lg flex items-start">
              <LightBulbIconOutline className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">We use your location to show accurate grocery prices</p>
            </div>
          </div>
        );

      case 'household':
        return (
          <div className="space-y-4">
            <div className="text-center mb-3">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mb-2">
                <HomeIcon className="h-7 w-7 text-white" />
              </div>
              <p className="text-base text-gray-600">Every family is unique! Tell us about yours 👨‍👩‍👧‍👦</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many people are in your household?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                  <button
                    key={size}
                    onClick={() => setFormData({ ...formData, householdSize: size })}
                    className={`py-3 px-2 rounded-lg border-2 font-medium transition-all transform hover:scale-105 ${
                      formData.householdSize === size
                        ? 'border-green-500 bg-green-50 text-green-700 shadow-lg scale-105'
                        : 'border-gray-300 hover:border-gray-400 bg-white'
                    }`}
                  >
                    <div className="text-lg mb-0.5">{size === 1 ? '👤' : size === 2 ? '👥' : '👨‍👩‍👧‍👦'}</div>
                    <div className="text-sm">{size}{size === 8 ? '+' : ''}</div>
                  </button>
                ))}
              </div>
              <div className="mt-3 bg-purple-50 p-3 rounded-lg flex items-start">
                <LightBulbIconOutline className="h-4 w-4 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-purple-700">Include everyone you'll be cooking for regularly</p>
              </div>
            </div>
          </div>
        );

      case 'members':
        return (
          <div className="space-y-3">
            <div className="text-center mb-3">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-pink-400 to-red-500 rounded-full mb-2">
                <UsersIcon className="h-7 w-7 text-white" />
              </div>
              <p className="text-base text-gray-600">Let's personalize meals for everyone</p>
            </div>
            
            <div className="space-y-2">
              {simpleMembers.map((member, index) => (
                <div key={member.id} className="bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-green-400 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {member.name || `Member ${index + 1}`}
                        {member.relationship === 'self' && (
                          <span className="ml-2 text-xs text-green-600 font-normal">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{member.relationship}</p>
                    </div>
                    <button
                      onClick={() => handleEditMember(member.id)}
                      className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-all"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {!member.isComplete && (
                    <p className="text-xs text-orange-600 mt-1">Please complete this member's details</p>
                  )}
                </div>
              ))}
            </div>
            
            {simpleMembers.length === 0 && (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-sm">Please select your household size first</p>
              </div>
            )}
            
            <div className="bg-orange-50 p-3 rounded-lg flex items-center justify-center">
              <LightBulbIconOutline className="h-4 w-4 text-orange-600 mr-2 flex-shrink-0" />
              <p className="text-xs text-orange-700">You can add more detailed preferences later</p>
            </div>
          </div>
        );

      case 'budget':
        return (
          <div className="space-y-4">
            <div className="text-center mb-3">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-2">
                <CurrencyDollarIcon className="h-7 w-7 text-white" />
              </div>
              <p className="text-base text-gray-600">Let's set your budget target</p>
            </div>
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                Weekly grocery budget
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                <input
                  id="budget"
                  type="number"
                  value={formData.weeklyBudget}
                  onChange={(e) => setFormData({ ...formData, weeklyBudget: parseInt(e.target.value) || 0 })}
                  className="w-full pl-10 pr-3 py-2 text-lg rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="150"
                  min="0"
                  step="10"
                />
              </div>
              <div className="mt-3">
                <p className="text-xs text-gray-600 mb-2">Quick select:</p>
                <div className="grid grid-cols-3 gap-2">
                  {[50, 100, 150, 200, 250, 300].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setFormData({ ...formData, weeklyBudget: amount })}
                      className={`py-2 px-3 rounded-lg border-2 font-medium transition-all transform hover:scale-105 text-sm ${
                        formData.weeklyBudget === amount
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400 bg-white'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-3 rounded-lg mt-3">
                <p className="text-xs text-gray-700">
                  <LightBulbIconOutline className="h-4 w-4 text-gray-700 mr-1.5 inline" />
                <span className="font-semibold">Average family of {formData.householdSize}</span> spends ${formData.householdSize * 50}-${formData.householdSize * 75} per week
                </p>
              </div>
            </div>
          </div>
        );

      case 'cooking':
        return (
          <div className="space-y-4">
            <div className="text-center mb-3">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-2">
                <ClockIcon className="h-7 w-7 text-white" />
              </div>
              <p className="text-base text-gray-600">How much time can you spend cooking?</p>
            </div>
            <div>
              <label htmlFor="weekdayTime" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <ClockIcon className="h-4 w-4 text-gray-500 mr-1.5" />
                Time to cook on weekdays
              </label>
              <select
                id="weekdayTime"
                value={formData.cookingTimeWeekday}
                onChange={(e) => setFormData({ ...formData, cookingTimeWeekday: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none bg-white text-sm"
              >
                <option value={15}>15 minutes (Quick meals)</option>
                <option value={30}>30 minutes (Standard)</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
            <div>
              <label htmlFor="weekendTime" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <ClockIcon className="h-4 w-4 text-gray-500 mr-1.5" />
                Time to cook on weekends
              </label>
              <select
                id="weekendTime"
                value={formData.cookingTimeWeekend}
                onChange={(e) => setFormData({ ...formData, cookingTimeWeekend: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none bg-white text-sm"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes (Standard)</option>
                <option value={90}>90 minutes (Elaborate meals)</option>
              </select>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-3 rounded-lg">
              <p className="text-xs text-gray-700">
                <LightBulbIconOutline className="h-4 w-4 text-gray-700 mr-1.5 inline" />
                <span className="font-semibold">Pro tip:</span> We'll mix quick weekday meals with more elaborate weekend recipes
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    const stepId = steps[currentStep].id;
    
    switch (stepId) {
      case 'basic':
        return formData.firstName.trim().length > 0;
      case 'goals':
        return formData.goals.length > 0 && formData.goals.length <= 3;
      case 'address':
        return true; // Address is optional
      case 'household':
        return formData.householdSize > 0;
      case 'members':
        // All members must be complete
        return simpleMembers.length > 0 && simpleMembers.every(m => m.isComplete);
      case 'budget':
        return formData.weeklyBudget > 0;
      case 'cooking':
        return formData.cookingTimeWeekday > 0 && formData.cookingTimeWeekend > 0;
      default:
        return true;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        {/* Fixed header with progress - more compact */}
        <div className="bg-gradient-to-br from-green-50/95 via-blue-50/95 to-purple-50/95 backdrop-blur-sm px-4 py-4 shadow-sm">
          <div className="max-w-2xl mx-auto">
            {/* Fun Progress indicator */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className="relative">
                      <div
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                          isCompleted
                            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg scale-100'
                            : isCurrent
                            ? 'bg-gradient-to-br from-green-400 to-green-500 text-white ring-4 ring-green-200 shadow-xl scale-110'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckIconSolid className="h-4 w-4 md:h-5 md:w-5" />
                        ) : (
                          <span className="text-xs md:text-sm">{index + 1}</span>
                        )}
                      </div>
                      {isCurrent && (
                        <div className="absolute -inset-1 bg-green-400 rounded-full opacity-25 animate-pulse" />
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-full mx-1 md:mx-2">
                        <div className="h-0.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500 ${
                              index < currentStep ? 'w-full' : 'w-0'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-1">
              <p className="text-xs text-gray-600">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="px-4 py-4">
          <div className="max-w-2xl mx-auto">
            {/* Card with gradient border */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-2xl blur-xl opacity-30" />
              <div className="relative bg-white rounded-2xl shadow-2xl">
                {/* Step header */}
                <div className="text-center p-6 pb-3">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                    {steps[currentStep].title}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {steps[currentStep].description}
                  </p>
                </div>

                {/* Step content */}
                <div className="px-6 pb-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {renderStepContent()}
                </div>

                {/* Fixed navigation buttons */}
                <div className="flex justify-between p-6 pt-3 border-t border-gray-100">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                      currentStep === 0
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                    }`}
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                    Back
                  </button>
                  
                  <button
                    onClick={handleNext}
                    disabled={!isStepValid() || saving}
                    className={`flex items-center px-6 py-2 rounded-lg font-medium transition-all text-sm ${
                      isStepValid() && !saving
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transform hover:scale-105 shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1.5" />
                        Saving...
                      </>
                    ) : currentStep === steps.length - 1 ? (
                      <>
                        <HeartIcon className="h-4 w-4 mr-1.5" />
                        Complete Setup
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRightIcon className="h-4 w-4 ml-1.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Skip link (only for testing) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-center mt-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Skip for now (dev only)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simplified Add/Edit Member Modal */}
      {showAddMemberModal && editingMemberId && (
        <AddEditMemberModal
          isOpen={showAddMemberModal}
          onClose={() => {
            setShowAddMemberModal(false);
            setEditingMemberId(null);
          }}
          onSave={handleSaveMember}
          member={editingMemberId ? {
            id: editingMemberId,
            userId: user!.uid,
            name: simpleMembers.find(m => m.id === editingMemberId)?.name || '',
            relationship: simpleMembers.find(m => m.id === editingMemberId)?.relationship || 'spouse',
            dietaryRestrictions: [],
            cuisinePreferences: [],
            allergens: [],
            dislikedIngredients: [],
            favoriteIngredients: [],
            mealPreferences: {
              breakfast: true,
              lunch: true,
              dinner: true,
              snacks: false
            },
            portionSize: 'regular',
            spicePreference: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          } : null}
          userId={user!.uid}
        />
      )}
    </>
  );
};

export default OnboardingPage; 