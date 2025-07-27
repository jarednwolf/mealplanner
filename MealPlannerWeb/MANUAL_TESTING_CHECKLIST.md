# Manual Testing Checklist - AI Meal Planner

## 🚀 Quick Start

1. **Verify Server is Running**: http://localhost:3001
2. **Test Credentials**: test@test.com / test123
3. **Browser Console**: Keep open to monitor for errors (F12)

## ✅ Test Checklist

### 1. Landing Page (/)
- [ ] Page loads without errors
- [ ] "Start Free" buttons are visible and clickable
- [ ] Login link works (top right)
- [ ] "Try It Free" demo link is present
- [ ] No console errors

### 2. Authentication Flow

#### Existing User Login
- [ ] Click "Login" link
- [ ] Enter test@test.com / test123
- [ ] Successfully redirected to dashboard
- [ ] User name appears in navigation

#### New User Signup
- [ ] Click one of the "Start Free" buttons
- [ ] Complete signup form with:
  - Email: testuser_[timestamp]@test.com
  - Password: test123456
  - Name: Test User
- [ ] Verify auto-redirect to dashboard or profile
- [ ] Check for profile completion banner

### 3. Profile Setup & Management (/profile)

#### Initial Setup
- [ ] Profile onboarding banner appears on dashboard (if incomplete)
- [ ] Navigate to Profile page
- [ ] Name field auto-populated from signup
- [ ] Required field indicators visible (red * or similar)
- [ ] Complete all sections:
  - [ ] Basic Info (household size, budget, cooking time, zip)
  - [ ] Dietary Restrictions
  - [ ] Food Preferences
  - [ ] Household Members

#### Household Members Tab
- [ ] "You" member automatically created with "(You)" badge
- [ ] Cannot delete yourself (no delete button)
- [ ] Can add family members
- [ ] Member preferences saved correctly

### 4. Meal Plan Generation (/meal-plan)
- [ ] Navigate to Meal Plan page
- [ ] Generate new meal plan button visible
- [ ] Click generate and wait for completion
- [ ] Verify 21 meals generated (7 days × 3 meals)
- [ ] Check meals respect:
  - [ ] Budget constraints
  - [ ] Dietary restrictions
  - [ ] Household preferences

#### Meal Interactions
- [ ] Click on a meal card
- [ ] View meal details
- [ ] Try swapping a meal
- [ ] Rate a meal
- [ ] View nutrition information

### 5. Calendar Integration
- [ ] Calendar component visible on meal plan page
- [ ] Click a date to add event
- [ ] Add different event types:
  - [ ] Eating out
  - [ ] Date night
  - [ ] Travel day
  - [ ] Busy day
- [ ] Set a recurring event (e.g., Pizza Friday)
- [ ] Regenerate meal plan
- [ ] Verify meals adjust for events

### 6. Grocery List (/grocery-list)
- [ ] Navigate to Grocery List
- [ ] Items aggregated from meal plan
- [ ] Categories properly organized
- [ ] Can check/uncheck items
- [ ] Quantities are editable
- [ ] Price estimates displayed
- [ ] Total budget shown

#### Shopping Integration
- [ ] "Order Groceries" or shopping buttons visible
- [ ] Test Instacart integration (if available)
- [ ] Test "Shop with Partners" (if available)

### 7. Pantry Management (/pantry)
- [ ] Navigate to Pantry page
- [ ] Add new pantry items
- [ ] Set expiration dates
- [ ] Delete items
- [ ] Check "Add to Pantry" from grocery list
- [ ] Verify items transfer correctly

### 8. Budget Tracking
- [ ] Budget overview visible (dashboard or meal plan)
- [ ] Weekly spending tracked
- [ ] Cost-saving suggestions appear
- [ ] Budget optimization works

### 9. Performance & Errors
- [ ] All pages load in < 3 seconds
- [ ] No Firebase errors in console
- [ ] No React/JSX warnings
- [ ] Smooth navigation between pages
- [ ] Forms submit without hanging

### 10. Data Validation
- [ ] Prices reasonable ($0.50 - $50 per item)
- [ ] Nutrition values make sense
- [ ] Prep times realistic (5-120 minutes)
- [ ] Serving sizes appropriate (1-8)

## 🐛 Bug Reporting Template

**Bug Found**: [Brief description]
**Page**: [URL where bug occurred]
**Steps to Reproduce**:
1. 
2. 
**Expected**: [What should happen]
**Actual**: [What actually happened]
**Console Errors**: [Copy any errors]
**Screenshot**: [If applicable]

## 📊 Testing Status

| Feature | Status | Notes |
|---------|--------|-------|
| Landing Page | ✅ | Works correctly |
| Login Flow | ✅ | No issues |
| Profile Setup | | |
| Meal Generation | | |
| Calendar | | |
| Grocery List | | |
| Pantry | | |
| Shopping | | |
| Budget | | |

## 🎯 Known Working Features (From Automated Tests)
- ✅ App loads without errors
- ✅ Login with test@test.com works
- ✅ Navigation menu complete
- ✅ No Firebase/JSX errors
- ✅ Performance acceptable

## 📝 Notes Section
_Add any observations, suggestions, or issues here_

---

**Testing Date**: _____________
**Tester**: _____________
**Browser**: Chrome / Safari / Firefox / Edge
**Overall Status**: Pass / Fail / Partial 