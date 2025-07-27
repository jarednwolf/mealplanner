// Export all components from this central location
export { LoadingSpinner } from './common/LoadingSpinner';
export { default as OnboardingFlow } from './onboarding/OnboardingFlow';
export { MealSwapModal } from './MealSwapModal';
export { BudgetTracker } from './BudgetTracker';
export { CostSavingsModal } from './CostSavingsModal';
export { BudgetAlert } from './BudgetAlert';
export { ErrorBoundary, MealPlanErrorBoundary } from './ErrorBoundary';

// Component interfaces that will be implemented
export interface OnboardingFlowProps {
  onComplete: (profile: any) => void;
}

export interface MealPlanViewProps {
  mealPlan: any;
  onSwapMeal: (mealId: string) => void;
}

export interface GroceryListViewProps {
  groceryList: any;
  onItemToggle: (itemId: string) => void;
}
