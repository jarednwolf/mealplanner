const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3001';

async function simpleTest() {
  console.log('🧪 Running Simple Test Suite\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Navigate to landing page
    console.log('1️⃣ Testing Landing Page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    console.log('  ✅ Landing page loaded');
    
    // 2. Take a screenshot to see what's actually on the page
    await page.screenshot({ path: 'landing-page.png' });
    console.log('  📸 Screenshot saved as landing-page.png');
    
    // 3. Get all links on the page
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.textContent.trim(),
        href: a.href
      }));
    });
    
    console.log('\n  🔗 Links found on landing page:');
    links.forEach(link => {
      console.log(`    - "${link.text}" -> ${link.href}`);
    });
    
    // 4. Get all buttons on the page
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(btn => ({
        text: btn.textContent.trim(),
        type: btn.type
      }));
    });
    
    console.log('\n  🔘 Buttons found on landing page:');
    buttons.forEach(btn => {
      console.log(`    - "${btn.text}" (type: ${btn.type})`);
    });
    
    // 5. Look for signup/login links
    console.log('\n2️⃣ Looking for Auth Links...');
    const signupLink = links.find(l => l.href.includes('/signup') || l.href.includes('/register'));
    const loginLink = links.find(l => l.href.includes('/login'));
    
    if (signupLink) {
      console.log(`  ✅ Found signup link: "${signupLink.text}"`);
    } else {
      console.log('  ❌ No signup link found');
    }
    
    if (loginLink) {
      console.log(`  ✅ Found login link: "${loginLink.text}"`);
    } else {
      console.log('  ❌ No login link found');
    }
    
    // 6. Navigate to login page
    if (loginLink) {
      console.log('\n3️⃣ Testing Login Page...');
      await page.goto(loginLink.href, { waitUntil: 'networkidle2' });
      
      // Check for form fields
      const hasEmailField = await page.$('input[type="email"]') !== null;
      const hasPasswordField = await page.$('input[type="password"]') !== null;
      const hasSubmitButton = await page.$('button[type="submit"]') !== null;
      
      console.log(`  ${hasEmailField ? '✅' : '❌'} Email field`);
      console.log(`  ${hasPasswordField ? '✅' : '❌'} Password field`);
      console.log(`  ${hasSubmitButton ? '✅' : '❌'} Submit button`);
      
      // Test login with existing user
      if (hasEmailField && hasPasswordField && hasSubmitButton) {
        console.log('\n4️⃣ Testing Login Flow...');
        await page.type('input[type="email"]', 'test@test.com');
        await page.type('input[type="password"]', 'test123');
        await page.click('button[type="submit"]');
        
        // Wait for navigation
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        const currentUrl = page.url();
        console.log(`  ✅ Logged in! Redirected to: ${currentUrl}`);
        
        // Take screenshot of dashboard
        await page.screenshot({ path: 'dashboard.png' });
        console.log('  📸 Dashboard screenshot saved');
        
        // Get navigation menu items
        const navItems = await page.evaluate(() => {
          const nav = document.querySelector('nav');
          if (!nav) return [];
          return Array.from(nav.querySelectorAll('a')).map(a => ({
            text: a.textContent.trim(),
            href: a.href
          }));
        });
        
        console.log('\n  🧭 Navigation menu items:');
        navItems.forEach(item => {
          console.log(`    - "${item.text}"`);
        });
      }
    }
    
    console.log('\n✅ Simple test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
simpleTest(); 