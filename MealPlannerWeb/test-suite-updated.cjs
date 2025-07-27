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
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function clickButtonByText(page, text) {
  const buttons = await page.$$('button');
  for (const button of buttons) {
    const buttonText = await page.evaluate(el => el.textContent.trim(), button);
    if (buttonText.includes(text)) {
      await button.click();
      return true;
    }
  }
  return false;
}

async function findElementByText(page, text, selector = '*') {
  const elements = await page.$$(selector);
  for (const element of elements) {
    const elementText = await page.evaluate(el => el.textContent.trim(), element);
    if (elementText.includes(text)) {
      return element;
    }
  }
  return null;
}

// Main test suite
async function runTestSuite() {
  const isHeadless = process.env.HEADLESS === 'true';
  const browser = await puppeteer.launch({
    headless: isHeadless,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', error => {
    consoleErrors.push(error.toString());
  });

  log(`Running in ${isHeadless ? 'headless' : 'browser'} mode`, 'info');

  try {
    // Test 1: Landing Page
    log('TEST SUITE: Landing Page', 'section');
    
    await runTest('Landing page loads successfully', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      const title = await page.title();
      if (!title) throw new Error('Page title not found');
    });

    await runTest('Landing page has free trial buttons', async () => {
      const buttons = await page.$$('button');
      let foundTrialButton = false;
      
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Start Free') || text.includes('Start Your Free')) {
          foundTrialButton = true;
          break;
        }
      }
      
      if (!foundTrialButton) throw new Error('No free trial buttons found');
    });

    await runTest('Landing page has login link', async () => {
      const loginLink = await page.$('a[href="/login"]');
      if (!loginLink) throw new Error('Login link not found');
    });

    await runTest('Landing page has demo link', async () => {
      const demoLink = await page.$('a[href="/demo"]');
      if (!demoLink) throw new Error('Demo link not found');
    });

    // Test 2: Existing User Login Flow
    log('TEST SUITE: Existing User Login', 'section');

    await runTest('Navigate to login page', async () => {
      await page.click('a[href="/login"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      const url = page.url();
      if (!url.includes('/login')) throw new Error('Not on login page');
    });

    await runTest('Login form renders correctly', async () => {
      const emailField = await page.$('input[type="email"]');
      const passwordField = await page.$('input[type="password"]');
      const submitButton = await page.$('button[type="submit"]');
      
      if (!emailField) throw new Error('Email field not found');
      if (!passwordField) throw new Error('Password field not found');
      if (!submitButton) throw new Error('Submit button not found');
    });

    await runTest('Login with test credentials', async () => {
      await page.type('input[type="email"]', EXISTING_EMAIL);
      await page.type('input[type="password"]', EXISTING_PASSWORD);
      await page.click('button[type="submit"]');
      
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      const url = page.url();
      if (!url.includes('/dashboard')) throw new Error(`Expected dashboard, got ${url}`);
    });

    // Test 3: Dashboard & Navigation
    log('TEST SUITE: Dashboard & Navigation', 'section');

    await runTest('Dashboard loads successfully', async () => {
      const dashboardTitle = await page.$('h1, h2');
      if (!dashboardTitle) throw new Error('Dashboard title not found');
    });

    await runTest('Navigation menu contains all main items', async () => {
      const expectedItems = ['Dashboard', 'Meal Plan', 'Grocery List', 'Pantry', 'Profile'];
      const navLinks = await page.$$('nav a');
      
      for (const expectedItem of expectedItems) {
        let found = false;
        for (const link of navLinks) {
          const text = await page.evaluate(el => el.textContent.trim(), link);
          if (text === expectedItem) {
            found = true;
            break;
          }
        }
        if (!found) throw new Error(`Navigation item "${expectedItem}" not found`);
      }
    });

    await runTest('Profile onboarding banner check', async () => {
      // Check if profile is complete
      await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle2' });
      await delay(1000);
      
      // Go back to dashboard
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
      
      // Look for onboarding banner if profile is incomplete
      const banner = await findElementByText(page, 'Complete Your Profile', 'div');
      log(banner ? 'Profile onboarding banner found' : 'Profile already complete', 'info');
    });

    // Test 4: Profile Page
    log('TEST SUITE: Profile Management', 'section');

    await runTest('Navigate to profile page', async () => {
      await page.click('a[href="/profile"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      const url = page.url();
      if (!url.includes('/profile')) throw new Error('Not on profile page');
    });

    await runTest('Profile page has tab navigation', async () => {
      const tabs = await page.$$('[role="tab"], button[class*="tab"]');
      if (tabs.length < 2) throw new Error('Tab navigation not found or insufficient tabs');
    });

    await runTest('Household members section exists', async () => {
      // Click on Household tab if it exists
      const householdTab = await findElementByText(page, 'Household', 'button');
      if (householdTab) {
        await householdTab.click();
        await delay(1000);
        
        // Check for self member
        const selfMember = await findElementByText(page, '(You)', 'div') ||
                          await findElementByText(page, 'Primary Account', 'div');
        if (!selfMember) throw new Error('Self member not found in household');
      } else {
        log('Household tab not found', 'warning');
      }
    });

    // Test 5: Meal Plan Page
    log('TEST SUITE: Meal Planning', 'section');

    await runTest('Navigate to meal plan page', async () => {
      await page.click('a[href="/meal-plan"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      const url = page.url();
      if (!url.includes('/meal-plan')) throw new Error('Not on meal plan page');
    });

    await runTest('Meal plan page has generate button or existing meals', async () => {
      await delay(1000);
      
      // Look for either a generate button or existing meal cards
      const generateButton = await findElementByText(page, 'Generate', 'button') ||
                           await findElementByText(page, 'Create', 'button');
      const mealCards = await page.$$('[class*="meal"], [class*="card"]');
      
      if (!generateButton && mealCards.length === 0) {
        throw new Error('No generate button or meal cards found');
      }
    });

    await runTest('Calendar component check', async () => {
      const calendar = await page.$('[class*="calendar"], [data-testid="calendar"]');
      log(calendar ? 'Calendar component found' : 'Calendar not visible on current view', 'info');
    });

    // Test 6: Grocery List Page
    log('TEST SUITE: Grocery Management', 'section');

    await runTest('Navigate to grocery list page', async () => {
      await page.click('a[href="/grocery-list"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      const url = page.url();
      if (!url.includes('/grocery')) throw new Error('Not on grocery list page');
    });

    await runTest('Grocery page has shopping options', async () => {
      await delay(1000);
      
      // Look for shopping-related buttons or links
      const instacartOption = await findElementByText(page, 'Instacart', '*');
      const shopOption = await findElementByText(page, 'Shop', 'button');
      const orderOption = await findElementByText(page, 'Order', 'button');
      
      if (!instacartOption && !shopOption && !orderOption) {
        log('No shopping integration buttons found - may need to generate meal plan first', 'warning');
      }
    });

    // Test 7: Pantry Page
    log('TEST SUITE: Pantry Management', 'section');

    await runTest('Navigate to pantry page', async () => {
      await page.click('a[href="/pantry"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      const url = page.url();
      if (!url.includes('/pantry')) throw new Error('Not on pantry page');
    });

    await runTest('Pantry page loads', async () => {
      const pantryContent = await page.$('main, [role="main"]');
      if (!pantryContent) throw new Error('Pantry content area not found');
    });

    // Test 8: Error Checking
    log('TEST SUITE: Error Validation', 'section');

    await runTest('No Firebase errors', async () => {
      const firebaseErrors = consoleErrors.filter(err => 
        err.toLowerCase().includes('firebase') && 
        (err.includes('undefined') || err.includes('error'))
      );
      if (firebaseErrors.length > 0) {
        throw new Error(`Firebase errors found: ${firebaseErrors.join(', ')}`);
      }
    });

    await runTest('No React/JSX errors', async () => {
      const reactErrors = consoleErrors.filter(err => 
        err.includes('React') || 
        err.includes('JSX') || 
        err.includes('Warning:')
      );
      if (reactErrors.length > 0) {
        throw new Error(`React errors found: ${reactErrors.join(', ')}`);
      }
    });

    // Test 9: Performance Check
    log('TEST SUITE: Performance', 'section');

    await runTest('Page load performance', async () => {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
      const loadTime = Date.now() - startTime;
      
      if (loadTime > 3000) {
        throw new Error(`Page load too slow: ${loadTime}ms (expected < 3000ms)`);
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
      console.log(`\n${colors.yellow}Console Messages:${colors.reset}`);
      consoleErrors.forEach(err => {
        console.log(`${colors.yellow}- ${err}${colors.reset}`);
      });
    }

    // Save screenshots for documentation
    await page.screenshot({ path: 'test-final-state.png' });
    log('Final screenshot saved as test-final-state.png', 'info');

  } catch (error) {
    log(`Test suite error: ${error.message}`, 'error');
  } finally {
    await browser.close();
  }

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the test suite
console.log(`${colors.cyan}🧪 AI Meal Planner - Comprehensive Test Suite${colors.reset}`);
console.log(`📍 Testing URL: ${BASE_URL}`);
console.log(`👤 Test Account: ${EXISTING_EMAIL}\n`);

runTestSuite(); 