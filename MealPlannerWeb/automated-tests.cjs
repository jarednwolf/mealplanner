const puppeteer = require('puppeteer');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = `test${Date.now()}@test.com`;
const TEST_PASSWORD = 'test123456';
const TEST_NAME = 'Test User';
const EXISTING_EMAIL = 'test@test.com';
const EXISTING_PASSWORD = 'test123';

// Color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

// Helper functions
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  switch(type) {
    case 'success':
      console.log(`${colors.green}✓ [${timestamp}] ${message}${colors.reset}`);
      break;
    case 'error':
      console.log(`${colors.red}✗ [${timestamp}] ${message}${colors.reset}`);
      break;
    case 'warning':
      console.log(`${colors.yellow}⚠ [${timestamp}] ${message}${colors.reset}`);
      break;
    case 'info':
      console.log(`${colors.cyan}ℹ [${timestamp}] ${message}${colors.reset}`);
      break;
    case 'section':
      console.log(`\n${colors.cyan}${'='.repeat(60)}\n${message}\n${'='.repeat(60)}${colors.reset}`);
      break;
  }
}

async function runTest(testName, testFn) {
  try {
    await testFn();
    testResults.passed++;
    log(`${testName} - PASSED`, 'success');
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    log(`${testName} - FAILED: ${error.message}`, 'error');
    if (error.stack) {
      console.log(error.stack);
    }
  }
}

async function waitAndClick(page, selector, timeout = 5000) {
  await page.waitForSelector(selector, { timeout });
  await page.click(selector);
}

async function waitAndType(page, selector, text, timeout = 5000) {
  await page.waitForSelector(selector, { timeout });
  await page.type(selector, text);
}

async function checkElementExists(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

async function checkElementText(page, selector, expectedText, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    const text = await page.$eval(selector, el => el.textContent);
    return text.includes(expectedText);
  } catch {
    return false;
  }
}

async function getConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', error => {
    errors.push(error.toString());
  });
  return errors;
}

// Main test suite
async function runTestSuite() {
  const isHeadless = process.env.HEADLESS === 'true';
  const isQuickTest = process.env.QUICK_TEST === 'true';
  
  const browser = await puppeteer.launch({
    headless: isHeadless,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const consoleErrors = await getConsoleErrors(page);
  
  log(`Running in ${isHeadless ? 'headless' : 'browser'} mode`, 'info');
  if (isQuickTest) log('Quick test mode - running essential tests only', 'info');

  try {
    // Test 1: Landing Page
    log('TEST SUITE: Landing Page', 'section');
    
    await runTest('Landing page loads', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      const title = await page.title();
      if (!title) throw new Error('Page title not found');
    });

    await runTest('Landing page has Get Started button', async () => {
      const hasButton = await checkElementExists(page, 'a[href="/signup"], button:has-text("Get Started")');
      if (!hasButton) throw new Error('Get Started button not found');
    });

    await runTest('Landing page has simplified layout (no BudgetCalculator)', async () => {
      const hasBudgetCalc = await checkElementExists(page, '[data-testid="budget-calculator"], .budget-calculator', 1000);
      if (hasBudgetCalc) throw new Error('BudgetCalculator found - should be removed');
    });

    // Test 2: New User Signup Flow
    log('TEST SUITE: New User Signup', 'section');

    await runTest('Navigate to signup page', async () => {
      await waitAndClick(page, 'a[href="/signup"], button:has-text("Get Started")');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      const url = page.url();
      if (!url.includes('/signup')) throw new Error('Not on signup page');
    });

    await runTest('Signup form renders correctly', async () => {
      const hasEmailField = await checkElementExists(page, 'input[type="email"], input[name="email"]');
      const hasPasswordField = await checkElementExists(page, 'input[type="password"], input[name="password"]');
      const hasNameField = await checkElementExists(page, 'input[name="name"], input[placeholder*="name" i]');
      
      if (!hasEmailField) throw new Error('Email field not found');
      if (!hasPasswordField) throw new Error('Password field not found');
      if (!hasNameField) throw new Error('Name field not found');
    });

    await runTest('Create new account', async () => {
      // Fill signup form
      await waitAndType(page, 'input[type="email"], input[name="email"]', TEST_EMAIL);
      await waitAndType(page, 'input[type="password"], input[name="password"]', TEST_PASSWORD);
      await waitAndType(page, 'input[name="name"], input[placeholder*="name" i]', TEST_NAME);
      
      // Submit form
      await waitAndClick(page, 'button[type="submit"], button:has-text("Sign Up"), button:has-text("Create Account")');
      
      // Wait for navigation to dashboard
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      const url = page.url();
      if (!url.includes('/dashboard') && !url.includes('/profile')) {
        throw new Error(`Expected redirect to dashboard or profile, got ${url}`);
      }
    });

    // Test 3: Profile Onboarding
    log('TEST SUITE: Profile Onboarding', 'section');

    await runTest('Profile onboarding banner appears', async () => {
      // Check if we're on dashboard
      if (page.url().includes('/dashboard')) {
        const hasBanner = await checkElementExists(page, '[data-testid="profile-onboarding-banner"], .profile-onboarding-banner, .onboarding-banner');
        if (!hasBanner) throw new Error('Profile onboarding banner not found on dashboard');
      }
    });

    await runTest('Navigate to profile page', async () => {
      // Click profile link or onboarding banner
      const profileLinkSelector = 'a[href="/profile"], button:has-text("Complete Profile"), a:has-text("Profile")';
      await waitAndClick(page, profileLinkSelector);
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      const url = page.url();
      if (!url.includes('/profile')) throw new Error('Not on profile page');
    });

    await runTest('Profile page has required field indicators', async () => {
      const hasIndicators = await checkElementExists(page, '.required-indicator, .text-red-500, span:has-text("*")');
      if (!hasIndicators) log('No required field indicators found', 'warning');
    });

    await runTest('Name auto-populated from Firebase Auth', async () => {
      const nameInput = await page.$('input[name="name"], input[placeholder*="name" i]');
      if (nameInput) {
        const value = await page.evaluate(el => el.value, nameInput);
        if (value !== TEST_NAME) {
          throw new Error(`Name not auto-populated. Expected "${TEST_NAME}", got "${value}"`);
        }
      } else {
        log('Name field not found on profile page', 'warning');
      }
    });

    await runTest('Complete profile setup', async () => {
      // Fill basic info
      const householdSelector = 'select[name="householdSize"], input[name="householdSize"]';
      if (await checkElementExists(page, householdSelector)) {
        await page.select(householdSelector, '2');
      }

      // Set budget
      const budgetSelector = 'input[name="weeklyBudget"], input[placeholder*="budget" i]';
      if (await checkElementExists(page, budgetSelector)) {
        await page.evaluate(selector => {
          document.querySelector(selector).value = '';
        }, budgetSelector);
        await page.type(budgetSelector, '150');
      }

      // Set cooking time
      const cookingTimeSelector = 'select[name="cookingTime"], input[name="cookingTime"]';
      if (await checkElementExists(page, cookingTimeSelector)) {
        await page.select(cookingTimeSelector, '30-45 minutes');
      }

      // Set zip code
      const zipSelector = 'input[name="zipCode"], input[placeholder*="zip" i]';
      if (await checkElementExists(page, zipSelector)) {
        await page.type(zipSelector, '10001');
      }

      // Save profile
      await waitAndClick(page, 'button:has-text("Save"), button[type="submit"]');
      await page.waitForTimeout(2000); // Wait for save
    });

    // Test 4: Household Member Management
    log('TEST SUITE: Household Members', 'section');

    await runTest('Self member automatically created', async () => {
      // Navigate to household members tab
      const tabSelector = 'button:has-text("Household"), a:has-text("Household"), [role="tab"]:has-text("Household")';
      if (await checkElementExists(page, tabSelector)) {
        await waitAndClick(page, tabSelector);
        await page.waitForTimeout(1000);

        // Check for self member with (You) badge
        const hasSelfMember = await checkElementText(page, '.member-card, .household-member', '(You)') ||
                             await checkElementText(page, '.member-card, .household-member', 'Primary Account');
        
        if (!hasSelfMember) throw new Error('Self member with (You) badge not found');
      }
    });

    await runTest('Cannot delete self member', async () => {
      // Look for delete button on self member card
      const selfMemberCard = await page.$('.member-card:has-text("(You)"), .household-member:has-text("(You)")');
      if (selfMemberCard) {
        const deleteButton = await selfMemberCard.$('button:has-text("Delete"), button[aria-label*="delete" i]');
        if (deleteButton) {
          throw new Error('Delete button found on self member - should be hidden');
        }
      }
    });

    // Test 5: Console Errors Check
    log('TEST SUITE: Error Checking', 'section');

    await runTest('No Firebase undefined field errors', async () => {
      const firebaseErrors = consoleErrors.filter(err => 
        err.includes('undefined') && err.includes('Firebase')
      );
      if (firebaseErrors.length > 0) {
        throw new Error(`Firebase errors found: ${firebaseErrors.join(', ')}`);
      }
    });

    await runTest('No JSX structure errors', async () => {
      const jsxErrors = consoleErrors.filter(err => 
        err.includes('JSX') || err.includes('React') || err.includes('Fragment')
      );
      if (jsxErrors.length > 0) {
        throw new Error(`JSX errors found: ${jsxErrors.join(', ')}`);
      }
    });

    // Test 6: Existing User Login
    log('TEST SUITE: Existing User Login', 'section');

    // Logout first
    await runTest('Logout current user', async () => {
      const logoutSelector = 'button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign Out")';
      if (await checkElementExists(page, logoutSelector)) {
        await waitAndClick(page, logoutSelector);
        await page.waitForTimeout(2000);
      }
    });

    await runTest('Login with existing user', async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
      
      await waitAndType(page, 'input[type="email"], input[name="email"]', EXISTING_EMAIL);
      await waitAndType(page, 'input[type="password"], input[name="password"]', EXISTING_PASSWORD);
      
      await waitAndClick(page, 'button[type="submit"], button:has-text("Log In"), button:has-text("Sign In")');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      const url = page.url();
      if (!url.includes('/dashboard')) {
        throw new Error(`Expected redirect to dashboard, got ${url}`);
      }
    });

    // Test 7: Meal Plan Generation
    log('TEST SUITE: Meal Plan Generation', 'section');

    await runTest('Navigate to meal plan page', async () => {
      await waitAndClick(page, 'a[href="/meal-plan"], a:has-text("Meal Plan")');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      const url = page.url();
      if (!url.includes('/meal-plan')) throw new Error('Not on meal plan page');
    });

    await runTest('Generate meal plan button exists', async () => {
      const hasButton = await checkElementExists(page, 'button:has-text("Generate"), button:has-text("Create New Plan")');
      if (!hasButton) throw new Error('Generate meal plan button not found');
    });

    // Test 8: Calendar Integration
    log('TEST SUITE: Calendar Integration', 'section');

    await runTest('Calendar component renders', async () => {
      const hasCalendar = await checkElementExists(page, '.calendar, [data-testid="meal-plan-calendar"]');
      if (!hasCalendar) log('Calendar component not found', 'warning');
    });

    await runTest('Can add calendar event', async () => {
      // Click on a date
      const dateSelector = '.calendar-date, .fc-day, .react-calendar__tile';
      if (await checkElementExists(page, dateSelector, 2000)) {
        await page.click(dateSelector);
        
        // Check if event modal opens
        const hasModal = await checkElementExists(page, '.modal, [role="dialog"]', 2000);
        if (!hasModal) throw new Error('Calendar event modal did not open');
      }
    });

    // Test 9: Grocery List
    log('TEST SUITE: Grocery List', 'section');

    await runTest('Navigate to grocery list', async () => {
      await waitAndClick(page, 'a[href="/grocery-list"], a:has-text("Grocery")');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      const url = page.url();
      if (!url.includes('/grocery')) log('Not on grocery list page', 'warning');
    });

    await runTest('Shopping integration buttons exist', async () => {
      const hasInstacart = await checkElementExists(page, 'button:has-text("Instacart"), a:has-text("Instacart")');
      const hasPartners = await checkElementExists(page, 'button:has-text("Shop with Partners")');
      
      if (!hasInstacart && !hasPartners) {
        throw new Error('No shopping integration buttons found');
      }
    });

    // Test 10: Budget Tracking
    log('TEST SUITE: Budget Tracking', 'section');

    await runTest('Budget information displays', async () => {
      const hasBudget = await checkElementExists(page, '.budget-display, [data-testid="budget-tracker"]', 2000);
      if (!hasBudget) log('Budget display not found', 'warning');
    });

    // Test 11: Performance Metrics
    log('TEST SUITE: Performance', 'section');

    await runTest('Page load times acceptable', async () => {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
      const loadTime = Date.now() - startTime;
      
      if (loadTime > 3000) {
        throw new Error(`Dashboard load time too slow: ${loadTime}ms (expected < 3000ms)`);
      }
    });

    // Test 12: Data Validation
    log('TEST SUITE: Data Validation', 'section');

    await runTest('Price validation', async () => {
      // Navigate to a page with prices
      if (await checkElementExists(page, '.price, [data-testid="price"]', 2000)) {
        const prices = await page.$$eval('.price, [data-testid="price"]', elements => 
          elements.map(el => parseFloat(el.textContent.replace(/[^0-9.-]+/g, "")))
        );
        
        const invalidPrices = prices.filter(p => p < 0.50 || p > 50);
        if (invalidPrices.length > 0) {
          throw new Error(`Invalid prices found: ${invalidPrices.join(', ')}`);
        }
      }
    });

    // Print test results
    log('TEST RESULTS', 'section');
    console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
    console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
    
    if (testResults.errors.length > 0) {
      console.log('\nFailed Tests:');
      testResults.errors.forEach(({ test, error }) => {
        console.log(`${colors.red}- ${test}: ${error}${colors.reset}`);
      });
    }

    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors Detected:');
      consoleErrors.forEach(err => {
        console.log(`${colors.yellow}- ${err}${colors.reset}`);
      });
    }

  } catch (error) {
    log(`Test suite failed: ${error.message}`, 'error');
  } finally {
    await browser.close();
  }

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the test suite
console.log(`${colors.cyan}Starting Automated Test Suite for AI Meal Planner${colors.reset}`);
console.log(`Testing URL: ${BASE_URL}`);
console.log(`Test Email: ${TEST_EMAIL}\n`);

runTestSuite(); 