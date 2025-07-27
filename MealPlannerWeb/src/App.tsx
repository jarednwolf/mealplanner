import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import LandingPage from './pages/LandingPage'
import DemoPage from './pages/DemoPage'
import DashboardPage from './pages/DashboardPage'
import OnboardingPage from './pages/OnboardingPage'
import MealPlanPage from './pages/MealPlanPage'
import GroceryListPage from './pages/GroceryListPage'
import ProfilePage from './pages/ProfilePage'
import GenerateMealPlanPage from './pages/GenerateMealPlanPage'
import PantryPage from './pages/PantryPage'
import FeedbackInsightsPage from './pages/FeedbackInsightsPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/demo" element={<DemoPage />} />
          
          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/meal-plan" element={<MealPlanPage />} />
              <Route path="/meal-plan/generate" element={<GenerateMealPlanPage />} />
              <Route path="/grocery-list" element={<GroceryListPage />} />
              <Route path="/pantry" element={<PantryPage />} />
              <Route path="/preferences" element={<FeedbackInsightsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App 