const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3001';

async function quickValidation() {
  console.log('🚀 Running Quick Validation Check...\n');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox'] 
  });
  
  try {
    const page = await browser.newPage();
    
    // 1. Check if app is running
    console.log('✓ Checking if app is accessible...');
    const response = await page.goto(BASE_URL, { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    if (!response || response.status() !== 200) {
      throw new Error(`App not accessible. Status: ${response?.status()}`);
    }
    console.log('  ✅ App is running on port 3001\n');
    
    // 2. Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    // 3. Check critical elements
    console.log('✓ Checking critical UI elements...');
    
    const criticalElements = [
      { selector: 'a[href="/signup"], button:has-text("Get Started")', name: 'Get Started button' },
      { selector: 'h1, h2', name: 'Page heading' },
      { selector: 'nav, header', name: 'Navigation' }
    ];
    
    for (const element of criticalElements) {
      try {
        await page.waitForSelector(element.selector, { timeout: 3000 });
        console.log(`  ✅ ${element.name} found`);
      } catch {
        console.log(`  ❌ ${element.name} NOT found`);
      }
    }
    
    // 4. Quick navigation test
    console.log('\n✓ Testing navigation to login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('  ✅ Login form accessible');
    } else {
      console.log('  ❌ Login form NOT found');
    }
    
    // 5. Check for Firebase/JSX errors
    console.log('\n✓ Checking for critical errors...');
    const criticalErrors = errors.filter(err => 
      err.includes('Firebase') || 
      err.includes('JSX') || 
      err.includes('undefined')
    );
    
    if (criticalErrors.length > 0) {
      console.log('  ❌ Critical errors found:');
      criticalErrors.forEach(err => console.log(`    - ${err}`));
    } else {
      console.log('  ✅ No critical errors detected');
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('Quick Validation Complete!');
    console.log(`Total console errors: ${errors.length}`);
    console.log(`Critical errors: ${criticalErrors.length}`);
    console.log('='.repeat(50));
    
    return criticalErrors.length === 0;
    
  } catch (error) {
    console.error('\n❌ Validation Failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run validation
quickValidation().then(success => {
  process.exit(success ? 0 : 1);
}); 