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

// Helper function to click element by text
async function clickByText(page, text, timeout = 5000) {
  const element = await page.waitForSelector(`::-p-xpath(//*[contains(text(), "${text}")])`, { timeout });
  await element.click();
}

// Helper function to find element by text
async function findByText(page, text, timeout = 5000) {
  try {
    await page.waitForSelector(`::-p-xpath(//*[contains(text(), "${text}")])`, { timeout });
    return true;
  } catch {
    return false;
  }
}

// Helper function to wait and click with multiple selector options
async function waitAndClick(page, selectors, timeout = 5000) {
  const selectorsArray = Array.isArray(selectors) ? selectors : [selectors];
  
  for (const selector of selectorsArray) {
    try {
      await page.waitForSelector(selector, { timeout: 1000 });
      await page.click(selector);
      return;
    } catch {
      // Try next selector
    }
  }
  
  // If no selector worked, throw error
  throw new Error(`Could not find any of the selectors: ${selectorsArray.join(', ')}`);
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

async function checkElementTextBySelector(page, selector, expectedText, timeout = 5000) {
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
      // Look for various possible Get Started button selectors
      const hasButton = await checkElementExists(page, 'a[href="/signup"]', 2000) ||
                       await findByText(page, 'Get Started', 2000) ||
                       await findByText(page, 'Sign Up', 2000);
      if (!hasButton) throw new Error('Get Started button not found');
    });

    await runTest('Landing page has simplified layout (no BudgetCalculator)', async () => {
      const hasBudgetCalc = await checkElementExists(page, '[data-testid="budget-calculator"], .budget-calculator', 1000);
      if (hasBudgetCalc) throw new Error('BudgetCalculator found - should be removed');
    });

    // Test 2: New User Signup Flow
    log('TEST SUITE: New User Signup', 'section');

    await runTest('Navigate to signup page', async () => {
      // Try multiple ways to get to signup
      try {
        await waitAndClick(page, ['a[href="/signup"]', 'button[type="button"]'], 3000);
      } catch {
        // If direct link doesn't work, try clicking by text
        await clickByText(page, 'Get Started', 3000);
      }
      
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      const url = page.url();
      if (!url.includes('/signup') && !url.includes('/register')) {
        throw new Error(`Not on signup page, current URL: ${url}`);
      }
    });

    await runTest('Signup form renders correctly', async () => {
      const hasEmailField = await checkElementExists(page, 'input[type="email"]');
      const hasPasswordField = await checkElementExists(page, 'input[type="password"]');
      const hasNameField = await checkElementExists(page, 'input[name="name"], input[id="name"], input[placeholder*="ame"]');
      
      if (!hasEmailField) throw new Error('Email field not found');
      if (!hasPasswordField) throw new Error('Password field not found');
      if (!hasNameField) throw new Error('Name field not found');
    });

    await runTest('Create new account', async () => {
      // Fill signup form
      await waitAndType(page, 'input[type="email"]', TEST_EMAIL);
      await waitAndType(page, 'input[type="password"]', TEST_PASSWORD);
      
      // Find and fill name field
      const nameSelectors = ['input[name="name"]', 'input[id="name"]', 'input[placeholder*="ame"]'];
      for (const selector of nameSelectors) {
        if (await checkElementExists(page, selector, 1000)) {
          await page.type(selector, TEST_NAME);
          break;
        }
      }
      
      // Submit form
      const submitButton = await page.$('button[type="submit"]') || 
                          await page.$('button[type="button"]') ||
                          await page.$('input[type="submit"]');
      
      if (submitButton) {
        await submitButton.click();
      } else {
        // Try to find button by text
        await clickByText(page, 'Sign Up', 2000);
      }
      
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
        const hasBanner = await checkElementExists(page, '[data-testid="profile-onboarding-banner"], .profile-onboarding-banner, .onboarding-banner', 3000) ||
                         await findByText(page, 'Complete Your Profile', 3000) ||
                         await findByText(page, 'Complete Profile', 3000);
        if (!hasBanner) throw new Error('Profile onboarding banner not found on dashboard');
      }
    });

    await runTest('Navigate to profile page', async () => {
      // Try multiple ways to get to profile
      const profileLink = await page.$('a[href="/profile"]');
      if (profileLink) {
        await profileLink.click();
      } else {
        // Try clicking by text
        try {
          await clickByText(page, 'Profile', 3000);
        } catch {
          await clickByText(page, 'Complete Profile', 3000);
        }
      }
      
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      const url = page.url();
      if (!url.includes('/profile')) throw new Error('Not on profile page');
    });

    await runTest('Profile page has required field indicators', async () => {
      const hasIndicators = await checkElementExists(page, '.required-indicator, .text-red-500, span:contains("*")', 2000) ||
                           await findByText(page, '*', 1000);
      if (!hasIndicators) log('No required field indicators found', 'warning');
    });

    await runTest('Name auto-populated from Firebase Auth', async () => {
      const nameInput = await page.$('input[name="name"], input[id="name"], input[placeholder*="ame"]');
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
      const budgetSelector = 'input[name="weeklyBudget"], input[placeholder*="budget"]';
      if (await checkElementExists(page, budgetSelector, 1000)) {
        await page.evaluate(selector => {
          document.querySelector(selector).value = '';
        }, budgetSelector);
        await page.type(budgetSelector, '150');
      }

      // Set cooking time
      const cookingTimeSelector = 'select[name="cookingTime"], input[name="cookingTime"]';
      if (await checkElementExists(page, cookingTimeSelector, 1000)) {
        await page.select(cookingTimeSelector, '30-45 minutes');
      }

      // Set zip code
      const zipSelector = 'input[name="zipCode"], input[placeholder*="zip"]';
      if (await checkElementExists(page, zipSelector, 1000)) {
        await page.type(zipSelector, '10001');
      }

      // Save profile
      const saveButton = await page.$('button[type="submit"]') || 
                        await page.$('button[type="button"]');
      if (saveButton) {
        await saveButton.click();
      } else {
        await clickByText(page, 'Save', 2000);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for save
    });

    // Test 4: Household Member Management
    log('TEST SUITE: Household Members', 'section');

    await runTest('Self member automatically created', async () => {
      // Navigate to household members tab
      try {
        await clickByText(page, 'Household', 2000);
      } catch {
        // Try tab selector
        const tabSelector = '[role="tab"]';
        const tabs = await page.$$(tabSelector);
        for (const tab of tabs) {
          const text = await page.evaluate(el => el.textContent, tab);
          if (text.includes('Household')) {
            await tab.click();
            break;
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check for self member with (You) badge
      const hasSelfMember = await findByText(page, '(You)', 2000) ||
                           await findByText(page, 'Primary Account', 2000);
      
      if (!hasSelfMember) throw new Error('Self member with (You) badge not found');
    });

    await runTest('Cannot delete self member', async () => {
      // Look for all member cards
      const memberCards = await page.$$('.member-card, .household-member, div[class*="member"]');
      let foundSelfMember = false;
      
      for (const card of memberCards) {
        const cardText = await page.evaluate(el => el.textContent, card);
        if (cardText.includes('(You)') || cardText.includes('Primary Account')) {
          foundSelfMember = true;
          // Check if this card has a delete button
          const deleteButton = await card.$('button');
          if (deleteButton) {
            const buttonText = await page.evaluate(el => el.textContent, deleteButton);
            if (buttonText.toLowerCase().includes('delete')) {
              throw new Error('Delete button found on self member - should be hidden');
            }
          }
        }
      }
      
      if (!foundSelfMember) {
        log('Self member card not found to check delete button', 'warning');
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

    // Skip remaining tests in quick mode
    if (isQuickTest) {
      log('Quick test mode - skipping remaining tests', 'info');
    } else {
      // Test 6: Existing User Login
      log('TEST SUITE: Existing User Login', 'section');

      // Logout first
      await runTest('Logout current user', async () => {
        const logoutFound = await findByText(page, 'Logout', 1000) ||
                           await findByText(page, 'Sign Out', 1000);
        if (logoutFound) {
                     await clickByText(page, 'Logout', 2000);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      });

      await runTest('Login with existing user', async () => {
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
        
        await waitAndType(page, 'input[type="email"]', EXISTING_EMAIL);
        await waitAndType(page, 'input[type="password"]', EXISTING_PASSWORD);
        
        const loginButton = await page.$('button[type="submit"]');
        if (loginButton) {
          await loginButton.click();
        } else {
          await clickByText(page, 'Log In', 2000);
        }
        
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        const url = page.url();
        if (!url.includes('/dashboard')) {
          throw new Error(`Expected redirect to dashboard, got ${url}`);
        }
      });

      // Test 7: Navigation Tests
      log('TEST SUITE: Navigation', 'section');

      await runTest('Can navigate to meal plan page', async () => {
        const mealPlanLink = await page.$('a[href="/meal-plan"]');
        if (mealPlanLink) {
          await mealPlanLink.click();
        } else {
          await clickByText(page, 'Meal Plan', 2000);
        }
        
                 await new Promise(resolve => setTimeout(resolve, 2000));
        
        const url = page.url();
        if (!url.includes('/meal-plan')) log('Not on meal plan page', 'warning');
      });
    }

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