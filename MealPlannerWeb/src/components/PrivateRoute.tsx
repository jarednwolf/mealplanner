import React, { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const PrivateRoute: React.FC = () => {
  const { user, userProfile, loading } = useAuth()
  const location = useLocation()
  const [checkingProfile, setCheckingProfile] = useState(true)

  useEffect(() => {
    // Once auth is loaded, check profile
    if (!loading) {
      setCheckingProfile(false)
    }
  }, [loading, userProfile])

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user needs onboarding (no profile or incomplete profile)
  const needsOnboarding = !userProfile || 
    !userProfile.firstName || 
    !userProfile.householdSize || 
    userProfile.householdSize === 0 ||
    !userProfile.weeklyBudget || 
    userProfile.weeklyBudget === 0 ||
    !userProfile.cookingTimePreference?.weekday ||
    !userProfile.cookingTimePreference?.weekend;

  // If on onboarding page, allow access
  if (location.pathname === '/onboarding') {
    return needsOnboarding ? <Outlet /> : <Navigate to="/dashboard" replace />
  }

  // If needs onboarding and not on onboarding page, redirect to onboarding
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  // Otherwise, allow access to protected routes
  return <Outlet />
}

export default PrivateRoute 