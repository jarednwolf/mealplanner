import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, firestore } from '../config/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { UserProfile } from '../types'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (userId: string) => {
    try {
      const docRef = doc(firestore, 'users', userId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        console.log('Fetched user profile from Firestore:', data)
        
        // Handle timestamp conversion safely
        const profile: any = {
          userId,
          ...data,
        }
        
        // Only convert timestamps if they exist and are Firestore Timestamp objects
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          profile.createdAt = data.createdAt.toDate()
        }
        
        if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
          profile.updatedAt = data.updatedAt.toDate()
        }
        
        setUserProfile(profile as UserProfile)
      } else {
        console.log('No user profile found in Firestore for userId:', userId)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      
      if (user) {
        await fetchUserProfile(user.uid)
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      setUser(null)
      setUserProfile(null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const refreshUserProfile = async () => {
    if (user) {
      await fetchUserProfile(user.uid)
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    signOut: handleSignOut,
    refreshUserProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 