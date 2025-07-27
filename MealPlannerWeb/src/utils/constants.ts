// App constants and configuration values

export const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
} as const;

export const COOKING_SKILL_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

export const BUDGET_STATUS = {
  UNDER: 'under',
  AT: 'at',
  OVER: 'over',
} as const;

export const FEEDBACK_RATINGS = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
} as const;

export const GROCERY_CATEGORIES = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Pantry',
  'Frozen',
  'Bakery',
  'Beverages',
  'Snacks',
  'Other',
] as const;

export const DIETARY_RESTRICTIONS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'nut-free',
  'soy-free',
  'egg-free',
  'keto',
  'paleo',
  'low-carb',
  'low-sodium',
] as const;

export const CUISINE_TYPES = [
  'American',
  'Italian',
  'Mexican',
  'Asian',
  'Mediterranean',
  'Indian',
  'Thai',
  'Chinese',
  'Japanese',
  'French',
  'Greek',
  'Middle Eastern',
] as const;

export const FEEDBACK_REASONS = [
  'too-spicy',
  'too-bland',
  'too-expensive',
  'took-too-long',
  'kids-didnt-like',
  'not-enough-flavor',
  'too-complicated',
  'missing-ingredients',
  'didnt-match-description',
] as const;

// Default values
export const DEFAULT_WEEKLY_BUDGET = 150;
export const DEFAULT_HOUSEHOLD_SIZE = 4;
export const DEFAULT_COOKING_TIME = {
  weekday: 30,
  weekend: 60,
};

// API endpoints and limits
export const API_LIMITS = {
  MAX_MEAL_SWAPS_PER_WEEK: 5,
  MAX_GROCERY_LIST_ITEMS: 100,
  MAX_PANTRY_ITEMS: 200,
} as const;