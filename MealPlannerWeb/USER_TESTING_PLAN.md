# User Testing Plan - AI Meal Planner Web App

## Overview
This document outlines a systematic approach to testing all features of the AI Meal Planner web application, including newly implemented calendar integration and shopping features.

## Testing Phases

### Phase 1: Systematic Checks (Automated)
- [ ] TypeScript compilation
- [ ] Linter checks
- [ ] Dependency verification
- [ ] Environment variable setup
- [ ] Firebase configuration
- [ ] Build process

### Phase 2: Core User Journey Testing (Manual)
- [ ] Authentication flow
- [ ] Profile creation and setup
- [ ] Meal plan generation
- [ ] Calendar integration
- [ ] Grocery list management
- [ ] Shopping integration
- [ ] Budget tracking

### Phase 3: Edge Cases & Error Handling
- [ ] Network failures
- [ ] Invalid inputs
- [ ] Missing data scenarios
- [ ] Permission errors

## Detailed Test Cases

### 1. Authentication & Onboarding
**Test ID: AUTH-001**
- **Objective**: Verify user can sign up and complete profile
- **Steps**:
  1. Navigate to landing page
  2. Click "Get Started"
  3. Sign up with email/password
  4. Complete profile setup:
     - Household size
     - Dietary restrictions
     - Budget
     - Food preferences
     - Zip code
- **Expected**: Smooth flow to dashboard
- **Check for**: Form validation, error messages, data persistence

### 2. Meal Plan Generation
**Test ID: MEAL-001**
- **Objective**: Generate AI-powered meal plan
- **Steps**:
  1. Navigate to Meal Plan page
  2. Click "Generate New Plan"
  3. Wait for AI generation
  4. Review generated meals
- **Expected**: 21 meals (7 days × 3 meals)
- **Check for**: 
  - Budget compliance
  - Dietary restriction adherence
  - Variety in meals
  - Reasonable prep times

### 3. Calendar Integration
**Test ID: CAL-001**
- **Objective**: Add calendar events and verify meal plan adjustments
- **Steps**:
  1. Click any date in calendar
  2. Add "Eating Out" event for dinner
  3. Add "Date Night" for another day
  4. Add recurring "Pizza Friday"
  5. Regenerate meal plan
- **Expected**: Meals skipped/adjusted accordingly
- **Check for**:
  - Event persistence
  - Correct meal filtering
  - Recurring event generation

**Test ID: CAL-002**
- **Objective**: Test freshness optimization
- **Steps**:
  1. Add multiple events throughout week
  2. Generate new meal plan
  3. Check meal ordering
- **Expected**: Seafood/fresh items early, frozen/pantry later
- **Check for**: Logical meal scheduling

### 4. Meal Management
**Test ID: MEAL-002**
- **Objective**: Test meal interactions
- **Steps**:
  1. Click on a meal card
  2. View details
  3. Swap a meal
  4. Rate a meal
  5. View nutrition info
- **Expected**: All interactions work smoothly
- **Check for**: Data updates, UI responsiveness

### 5. Grocery List Generation
**Test ID: GROC-001**
- **Objective**: Generate and manage grocery list
- **Steps**:
  1. Navigate to Grocery List
  2. Review aggregated ingredients
  3. Check/uncheck items
  4. Adjust quantities
  5. View category totals
- **Expected**: Accurate aggregation, price estimates
- **Check for**: 
  - Correct quantities
  - Reasonable prices
  - Category organization

### 6. Pantry Management
**Test ID: PANT-001**
- **Objective**: Add and manage pantry items
- **Steps**:
  1. Navigate to Pantry
  2. Add new items
  3. Set expiration dates
  4. Delete expired items
  5. Mark checked items as "Add to Pantry"
- **Expected**: Items tracked with expiration alerts
- **Check for**: Date handling, category assignment

### 7. Shopping Integration
**Test ID: SHOP-001**
- **Objective**: Test shopping partner integration
- **Steps**:
  1. Click "Order Groceries"
  2. Select "Shop with Partners"
  3. Choose a store
  4. Review cart mapping
  5. Test checkout flow
- **Expected**: Items mapped to store products
- **Check for**: Price accuracy, availability

**Test ID: SHOP-002**
- **Objective**: Test Instacart integration
- **Steps**:
  1. Click "Order Groceries"
  2. Select "Order on Instacart"
  3. Verify redirect to Instacart
- **Expected**: Shopping list created on Instacart
- **Check for**: Correct item transfer

### 8. Budget Tracking
**Test ID: BUDG-001**
- **Objective**: Verify budget features
- **Steps**:
  1. Check budget overview
  2. Review cost-saving suggestions
  3. Try budget optimization
  4. Update weekly budget in profile
- **Expected**: Accurate calculations, helpful suggestions
- **Check for**: Math accuracy, suggestion relevance

### 9. Profile Management
**Test ID: PROF-001**
- **Objective**: Update user preferences
- **Steps**:
  1. Navigate to Profile
  2. Update dietary restrictions
  3. Change budget
  4. Add household members
  5. Update zip code
- **Expected**: Changes reflected in next meal plan
- **Check for**: Data persistence, UI updates

### 10. Household Members
**Test ID: HOUS-001**
- **Objective**: Manage household preferences
- **Steps**:
  1. Add family members
  2. Set individual preferences
  3. Mark food dislikes
  4. Generate new meal plan
- **Expected**: Meals avoid disliked ingredients
- **Check for**: Preference application

## Error Scenarios to Test

### Network Errors
- Turn off internet during:
  - Meal plan generation
  - Grocery list save
  - Profile update
- **Expected**: Graceful error messages, no data loss

### Invalid Inputs
- Empty required fields
- Invalid email formats
- Negative budget values
- Past dates for meal plans
- **Expected**: Clear validation messages

### Permission Errors
- Try accessing other user's data
- Modify read-only content
- **Expected**: Proper access control

## Performance Testing

### Load Times
- [ ] Landing page: < 2 seconds
- [ ] Dashboard: < 3 seconds
- [ ] Meal plan generation: < 10 seconds
- [ ] Grocery list load: < 2 seconds

### Responsiveness
- [ ] Test on mobile (375px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1440px width)

## Browser Compatibility
Test on:
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Accessibility Testing
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast
- [ ] Focus indicators
- [ ] Alt text for images

## Data Validation
- [ ] Prices are reasonable ($0.50 - $50 per item)
- [ ] Nutritional values make sense
- [ ] Prep times are realistic
- [ ] Serving sizes are appropriate

## Integration Testing
- [ ] Firebase Auth works
- [ ] Firestore saves/retrieves data
- [ ] External APIs respond (if configured):
  - OpenAI
  - Spoonacular
  - Instacart
  - Pricing services

## User Experience Feedback
Rate 1-5:
- [ ] Onboarding clarity
- [ ] Navigation intuitiveness
- [ ] Visual appeal
- [ ] Loading feedback
- [ ] Error message helpfulness
- [ ] Overall satisfaction

## Bug Report Template
```
**Bug ID**: [CATEGORY-###]
**Severity**: Critical/High/Medium/Low
**Description**: 
**Steps to Reproduce**:
1. 
2. 
**Expected Result**:
**Actual Result**:
**Environment**: Browser, OS
**Screenshots**: 
```

## Post-Testing Checklist
- [ ] All critical paths tested
- [ ] Bugs documented
- [ ] Performance acceptable
- [ ] Accessibility verified
- [ ] Security validated
- [ ] User feedback collected 