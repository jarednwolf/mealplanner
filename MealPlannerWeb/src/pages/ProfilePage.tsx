import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, HouseholdMember } from '../types';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signOut, updateProfile } from 'firebase/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  UserCircleIcon,
  CogIcon,
  HeartIcon,
  HomeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  UserGroupIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { householdMemberService } from '../services/householdMembers';
import HouseholdMemberCard from '../components/HouseholdMemberCard';
import AddEditMemberModal from '../components/AddEditMemberModal';
import MemberPreferencesModal from '../components/MemberPreferencesModal';
import ProfileCompletionStatus from '../components/ProfileCompletionStatus';

const ProfilePage: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'preferences' | 'dietary' | 'cooking' | 'household'>('general');
  
  const [profile, setProfile] = useState<UserProfile>({
    userId: user?.uid || '',
    email: user?.email || '',
    firstName: '',
    lastName: '',
    householdSize: 0,
    dietaryRestrictions: [],
    cuisinePreferences: [],
    cookingSkillLevel: 'intermediate',
    weeklyBudget: 0,
    cookingTimePreference: {
      weekday: 0,
      weekend: 0
    },
    goals: []
  });
  
  const [profileLoadedFromDb, setProfileLoadedFromDb] = useState(false);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<HouseholdMember | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [viewingMember, setViewingMember] = useState<HouseholdMember | null>(null);

  const dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Nut-Free',
    'Keto',
    'Paleo',
    'Low-Carb',
    'Halal',
    'Kosher'
  ];

  const cuisineOptions = [
    'Italian',
    'Mexican',
    'Chinese',
    'Japanese',
    'Indian',
    'Thai',
    'Mediterranean',
    'American',
    'French',
    'Korean',
    'Vietnamese',
    'Greek'
  ];

  useEffect(() => {
    if (user) {
      loadProfile();
      loadHouseholdMembers();
    }
  }, [user]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      const validTabs = ['general', 'preferences', 'dietary', 'cooking', 'household'];
      if (validTabs.includes(tab)) {
        setActiveTab(tab as typeof activeTab);
      }
    }
    
    const from = searchParams.get('from');
    if (from === 'meal-plan-incomplete' && profileLoadedFromDb) {
      setTimeout(() => {
        toast.error('You must complete your profile before generating meal plans!', {
          duration: 6000,
          icon: '⚠️',
          style: {
            background: '#FEE2E2',
            color: '#991B1B',
            fontWeight: 'bold'
          }
        });
      }, 500);
    }
  }, [searchParams, profileLoadedFromDb]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'users', user!.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(prev => ({
          ...prev,
          userId: user!.uid,
          email: user!.email || '',
          firstName: data.firstName || user?.displayName?.split(' ')[0] || '',
          lastName: data.lastName || user?.displayName?.split(' ').slice(1).join(' ') || '',
          householdSize: data.householdSize ?? 0,
          dietaryRestrictions: data.dietaryRestrictions || [],
          cuisinePreferences: data.cuisinePreferences || [],
          cookingSkillLevel: data.cookingSkillLevel || 'intermediate',
          weeklyBudget: data.weeklyBudget ?? 0,
          cookingTimePreference: {
            weekday: data.cookingTimePreference?.weekday ?? 0,
            weekend: data.cookingTimePreference?.weekend ?? 0
          }
        }));
        setProfileLoadedFromDb(true);
      } else {
        setProfile(prev => ({
          ...prev,
          firstName: user?.displayName?.split(' ')[0] || '',
          lastName: user?.displayName?.split(' ').slice(1).join(' ') || ''
        }));
        setProfileLoadedFromDb(true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const createSelfMember = async () => {
    if (!user?.uid || !profile.firstName) return;
    
    try {
      const selfMember: Omit<HouseholdMember, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        name: `${profile.firstName} ${profile.lastName || ''}`.trim(),
        relationship: 'self',
        dietaryRestrictions: profile.dietaryRestrictions || [],
        cuisinePreferences: profile.cuisinePreferences || [],
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
        notes: 'Primary account holder'
      };
      
      await householdMemberService.createHouseholdMember(selfMember);
      await loadHouseholdMembers();
    } catch (error) {
      console.error('Error creating self member:', error);
      // Don't show error toast - this is a background operation
    }
  };

  const loadHouseholdMembers = async () => {
    try {
      setLoadingMembers(true);
      const members = await householdMemberService.getHouseholdMembers(user!.uid);
      setHouseholdMembers(members);
      
      // Check if user has a 'self' member, if not create one automatically
      const hasSelfMember = members.some(m => m.relationship === 'self');
      if (!hasSelfMember && profileLoadedFromDb && profile.firstName) {
        await createSelfMember();
      }
    } catch (error) {
      console.error('Error loading household members:', error);
      toast.error('Failed to load household members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      
      // Log the profile being saved for debugging
      console.log('Saving profile:', profile);
      
      // Add timestamps
      const profileData = {
        ...profile,
        updatedAt: serverTimestamp(),
        // Only add createdAt if this is a new profile
        ...(profileLoadedFromDb ? {} : { createdAt: serverTimestamp() })
      };
      
      const docRef = doc(db, 'users', user!.uid);
      await setDoc(docRef, profileData, { merge: true });
      
      if (auth.currentUser && (profile.firstName || profile.lastName)) {
        const displayName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
        await updateProfile(auth.currentUser, { displayName });
      }
      
      // Small delay to ensure Firestore has propagated the changes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh the user profile in AuthContext
      await refreshUserProfile();
      
      // Check if we need to create a self member
      const members = await householdMemberService.getHouseholdMembers(user!.uid);
      const hasSelfMember = members.some(m => m.relationship === 'self');
      if (!hasSelfMember && profile.firstName) {
        await createSelfMember();
      }
      
      toast.success('Profile updated successfully!');
      
      // If coming from meal plan generation, navigate back
      const from = searchParams.get('from');
      if (from === 'meal-plan-incomplete') {
        setTimeout(() => {
          navigate('/meal-plan');
        }, 1000);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const updateField = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const toggleDietaryRestriction = (restriction: string) => {
    setProfile(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
  };

  const toggleCuisinePreference = (cuisine: string) => {
    setProfile(prev => ({
      ...prev,
      cuisinePreferences: prev.cuisinePreferences.includes(cuisine)
        ? prev.cuisinePreferences.filter(c => c !== cuisine)
        : [...prev.cuisinePreferences, cuisine]
    }));
  };

  const handleAddMember = async (memberData: Omit<HouseholdMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.uid) {
      toast.error('User not authenticated');
      return;
    }
    
    try {
      const memberWithUserId = {
        ...memberData,
        userId: user.uid
      };
      
      console.log('Adding household member:', memberWithUserId);
      
      const memberId = await householdMemberService.createHouseholdMember(memberWithUserId);
      await loadHouseholdMembers();
      toast.success('Household member added successfully!');
      setShowAddMemberModal(false);
    } catch (error) {
      console.error('Error adding household member:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add household member';
      toast.error(errorMessage);
    }
  };

  const handleUpdateMember = async (memberData: Omit<HouseholdMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingMember?.id) return;
    
    try {
      await householdMemberService.updateHouseholdMember(editingMember.id, memberData);
      await loadHouseholdMembers();
      toast.success('Household member updated successfully!');
      setShowAddMemberModal(false);
      setEditingMember(null);
    } catch (error) {
      console.error('Error updating household member:', error);
      toast.error('Failed to update household member');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to delete this household member?')) return;
    
    try {
      await householdMemberService.deleteHouseholdMember(memberId);
      await loadHouseholdMembers();
      toast.success('Household member deleted successfully!');
    } catch (error) {
      console.error('Error deleting household member:', error);
      toast.error('Failed to delete household member');
    }
  };

  // Tab configuration
  const tabs = [
    { 
      id: 'general', 
      label: 'General', 
      icon: UserCircleIcon,
      hasRequired: !profile.householdSize || profile.householdSize === 0,
      requiredText: 'Required: Household Size'
    },
    { 
      id: 'preferences', 
      label: 'Preferences', 
      icon: CogIcon,
      hasRequired: !profile.weeklyBudget || profile.weeklyBudget === 0,
      requiredText: 'Required: Weekly Budget'
    },
    { 
      id: 'dietary', 
      label: 'Dietary', 
      icon: HeartIcon,
      hasRequired: false
    },
    { 
      id: 'cooking', 
      label: 'Cooking', 
      icon: ClockIcon,
      hasRequired: !profile.cookingTimePreference?.weekday || !profile.cookingTimePreference?.weekend,
      requiredText: 'Required: Cooking Time'
    },
    { 
      id: 'household', 
      label: 'Members', 
      icon: UserGroupIcon,
      hasRequired: false
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // IMPORTANT: Everything must be wrapped in a single parent element or Fragment
  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Simplified Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-lg text-gray-600 mt-2">
              Manage your account and meal planning preferences
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="space-y-8">
              {/* Show profile completion status ONLY if incomplete and coming from meal plan */}
              {profileLoadedFromDb && searchParams.get('from') === 'meal-plan-incomplete' && 
               ((!profile.weeklyBudget || profile.weeklyBudget === 0) || 
                (!profile.cookingTimePreference.weekday || !profile.cookingTimePreference.weekend) ||
                (!profile.householdSize || profile.householdSize === 0)) && (
                <div className="mb-6 animate-pulse-once">
                  <ProfileCompletionStatus 
                    userProfile={profile}
                    onComplete={() => {
                      if (!profile.householdSize || profile.householdSize === 0) {
                        setActiveTab('general');
                      } else if (!profile.weeklyBudget || profile.weeklyBudget === 0) {
                        setActiveTab('preferences');
                      } else if (!profile.cookingTimePreference.weekday || !profile.cookingTimePreference.weekend) {
                        setActiveTab('cooking');
                      }
                    }}
                    variant="detailed"  // Only show detailed view when incomplete
                  />
                </div>
              )}

              {/* Main Content */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200 bg-gray-50/50">
                  <nav className="flex -mb-px">
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`relative flex-1 py-4 px-4 text-center border-b-2 font-medium text-sm transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'border-green-500 text-green-600 bg-white'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <div className="flex items-center space-x-2">
                            <tab.icon className={`h-5 w-5 ${
                              activeTab === tab.id ? 'text-green-600' : 'text-gray-400'
                            }`} />
                            <span>{tab.label}</span>
                            {tab.hasRequired && (
                              <div className="flex items-center">
                                <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                              </div>
                            )}
                          </div>
                          {tab.hasRequired && tab.requiredText && (
                            <span className="text-xs text-red-500 mt-1 hidden md:group-hover:block">
                              {tab.requiredText}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6 md:p-8">
                  {/* General Tab */}
                  {activeTab === 'general' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={profile.firstName || ''}
                            onChange={(e) => updateField('firstName', e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            placeholder="John"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={profile.lastName || ''}
                            onChange={(e) => updateField('lastName', e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={profile.email || user?.email || ''}
                          disabled
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <HomeIcon className="h-4 w-4 inline mr-1" />
                          Household Size
                          {(!profile.householdSize || profile.householdSize === 0) && (
                            <span className="ml-2 text-red-500 text-xs">(Required)</span>
                          )}
                        </label>
                        <select
                          value={profile.householdSize}
                          onChange={(e) => updateField('householdSize', parseInt(e.target.value))}
                          className={`w-full px-4 py-3 rounded-lg border ${
                            !profile.householdSize || profile.householdSize === 0
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-300'
                          } focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200`}
                        >
                          <option value={0}>Select household size...</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(size => (
                            <option key={size} value={size}>
                              {size} {size === 1 ? 'person' : 'people'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Preferences Tab */}
                  {activeTab === 'preferences' && (
                    <div className="space-y-6">
                      {/* Info Box */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> These are your account-wide defaults. You can also set specific preferences for each household member in the Members tab.
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                          Weekly Budget
                          {(!profile.weeklyBudget || profile.weeklyBudget === 0) && (
                            <span className="ml-2 text-red-500 text-xs">(Required)</span>
                          )}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            value={profile.weeklyBudget}
                            onChange={(e) => updateField('weeklyBudget', parseInt(e.target.value) || 0)}
                            className={`w-full pl-8 pr-4 py-3 rounded-lg border ${
                              !profile.weeklyBudget || profile.weeklyBudget === 0
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-300'
                            } focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200`}
                            placeholder="100"
                          />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Your target weekly grocery budget
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          Preferred Cuisines
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {cuisineOptions.map(cuisine => (
                            <button
                              key={cuisine}
                              onClick={() => toggleCuisinePreference(cuisine)}
                              className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                profile.cuisinePreferences.includes(cuisine)
                                  ? 'bg-green-100 text-green-700 border-2 border-green-500 shadow-md'
                                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                              }`}
                            >
                              {profile.cuisinePreferences.includes(cuisine) && (
                                <CheckIcon className="h-4 w-4 inline mr-1" />
                              )}
                              {cuisine}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          Your Goals
                        </label>
                        <p className="text-sm text-gray-500 mb-4">What matters most when planning meals?</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[
                            { id: 'save-money', label: 'Save money', description: 'Stay within budget' },
                            { id: 'save-time', label: 'Save time', description: 'Quick & easy meals' },
                            { id: 'lower-stress', label: 'Lower stress', description: 'Simple planning' },
                            { id: 'improve-health', label: 'Improve health', description: 'Nutritious choices' },
                            { id: 'lose-weight', label: 'Lose weight', description: 'Calorie conscious' },
                            { id: 'simplify-cooking', label: 'Simplify cooking', description: 'Easy recipes' },
                            { id: 'shop-less', label: 'Shop less', description: 'Fewer store trips' },
                            { id: 'waste-less', label: 'Waste less', description: 'Use everything' }
                          ].map(goal => (
                            <button
                              key={goal.id}
                              onClick={() => {
                                const currentGoals = profile.goals || [];
                                const newGoals = currentGoals.includes(goal.id as any)
                                  ? currentGoals.filter(g => g !== goal.id)
                                  : currentGoals.length < 3
                                  ? [...currentGoals, goal.id as any]
                                  : currentGoals;
                                updateField('goals', newGoals);
                              }}
                              disabled={profile.goals && profile.goals.length >= 3 && !profile.goals.includes(goal.id as any)}
                              className={`relative p-4 rounded-xl border transition-all duration-200 text-left ${
                                profile.goals?.includes(goal.id as any)
                                  ? 'bg-green-50 border-green-300 shadow-sm'
                                  : profile.goals && profile.goals.length >= 3
                                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                              }`}
                            >
                              <div className="pr-8">
                                <div className={`font-medium text-sm ${
                                  profile.goals?.includes(goal.id as any) ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {goal.label}
                                </div>
                                <div className={`text-xs mt-0.5 ${
                                  profile.goals?.includes(goal.id as any) ? 'text-gray-600' : 'text-gray-500'
                                }`}>
                                  {goal.description}
                                </div>
                              </div>
                              {profile.goals?.includes(goal.id as any) && (
                                <div className="absolute top-4 right-3">
                                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <CheckIcon className="h-3 w-3 text-white" />
                                  </div>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="mt-4 text-center">
                          <p className="text-sm text-gray-500">
                            {profile.goals && profile.goals.length === 0 && 'Select up to 3 goals'}
                            {profile.goals && profile.goals.length > 0 && profile.goals.length < 3 && `${profile.goals.length} of 3 selected`}
                            {profile.goals && profile.goals.length === 3 && '3 goals selected'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dietary Tab */}
                  {activeTab === 'dietary' && (
                    <div className="space-y-6">
                      {/* Info Box */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> These apply to ALL meal plans. Individual household members can have additional restrictions set in the Members tab.
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          Dietary Restrictions & Preferences
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {dietaryOptions.map(option => (
                            <label key={option} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border-2 border-transparent hover:border-green-200">
                              <input
                                type="checkbox"
                                checked={profile.dietaryRestrictions.includes(option)}
                                onChange={() => toggleDietaryRestriction(option)}
                                className="h-5 w-5 text-green-600 rounded focus:ring-green-500 focus:ring-2"
                              />
                              <span className="ml-3 text-gray-700 font-medium">{option}</span>
                            </label>
                          ))}
                        </div>
                        <p className="mt-4 text-sm text-gray-500">
                          Select all that apply. Meal plans will respect these restrictions.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Household Tab */}
                  {activeTab === 'household' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Household Members</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Each member can have their own dietary needs and preferences. These are combined with your account defaults when creating meal plans.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowAddMemberModal(true)}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <PlusIcon className="h-5 w-5 mr-2" />
                          Add Member
                        </button>
                      </div>

                      {loadingMembers ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        </div>
                      ) : householdMembers.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">Just you for now</h4>
                          <p className="text-gray-600 mb-6">
                            Add family members to create personalized meal plans for everyone
                          </p>
                          <button
                            onClick={() => setShowAddMemberModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add Family Member
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {householdMembers.map(member => (
                            <HouseholdMemberCard
                              key={member.id}
                              member={member}
                              onEdit={(member) => {
                                setEditingMember(member);
                                setShowAddMemberModal(true);
                              }}
                              onDelete={handleDeleteMember}
                              onViewPreferences={(member) => {
                                setViewingMember(member);
                                setShowPreferencesModal(true);
                              }}
                              onCopy={(member) => {
                                const copiedMember = { ...member };
                                delete (copiedMember as any).id;
                                delete (copiedMember as any).createdAt;
                                delete (copiedMember as any).updatedAt;
                                (copiedMember as any)._originalName = member.name;
                                copiedMember.name = '';
                                setEditingMember(copiedMember as HouseholdMember);
                                setShowAddMemberModal(true);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cooking Tab */}
                  {activeTab === 'cooking' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cooking Skill Level
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
                            <button
                              key={level}
                              onClick={() => updateField('cookingSkillLevel', level)}
                              className={`p-4 rounded-lg font-medium capitalize transition-all duration-200 ${
                                profile.cookingSkillLevel === level
                                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          <ClockIcon className="h-4 w-4 inline mr-1" />
                          Maximum Cooking Time
                          {(!profile.cookingTimePreference.weekday || !profile.cookingTimePreference.weekend) && (
                            <span className="ml-2 text-red-500 text-xs">(Required)</span>
                          )}
                        </label>
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm text-gray-600 mb-2">
                              Weekdays ({profile.cookingTimePreference.weekday} minutes)
                              {!profile.cookingTimePreference.weekday && (
                                <span className="ml-2 text-red-500 text-xs">(Set a time)</span>
                              )}
                            </label>
                            <input
                              type="range"
                              min="15"
                              max="120"
                              step="15"
                              value={profile.cookingTimePreference.weekday}
                              onChange={(e) => updateField('cookingTimePreference', {
                                ...profile.cookingTimePreference,
                                weekday: parseInt(e.target.value)
                              })}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>15 min</span>
                              <span>2 hours</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm text-gray-600 mb-2">
                              Weekends ({profile.cookingTimePreference.weekend} minutes)
                              {!profile.cookingTimePreference.weekend && (
                                <span className="ml-2 text-red-500 text-xs">(Set a time)</span>
                              )}
                            </label>
                            <input
                              type="range"
                              min="15"
                              max="180"
                              step="15"
                              value={profile.cookingTimePreference.weekend}
                              onChange={(e) => updateField('cookingTimePreference', {
                                ...profile.cookingTimePreference,
                                weekend: parseInt(e.target.value)
                              })}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>15 min</span>
                              <span>3 hours</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-between gap-4 border-t border-gray-200">
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                  
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Member Modal - Now properly outside the main div */}
      {user?.uid && (
        <AddEditMemberModal
          isOpen={showAddMemberModal}
          onClose={() => {
            setShowAddMemberModal(false);
            setEditingMember(null);
          }}
          onSave={editingMember ? handleUpdateMember : handleAddMember}
          member={editingMember}
          userId={user.uid}
        />
      )}

      {/* Member Preferences Modal - Now properly outside the main div */}
      <MemberPreferencesModal
        isOpen={showPreferencesModal}
        onClose={() => {
          setShowPreferencesModal(false);
          setViewingMember(null);
        }}
        member={viewingMember}
      />
    </>
  );
};

export default ProfilePage; 