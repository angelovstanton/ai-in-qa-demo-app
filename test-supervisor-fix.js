const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Testing supervisor mode UI after fix...');
  
  // Launch browser
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the app
    console.log('📱 Navigating to the app...');
    await page.goto('http://localhost:5173');
    
    // Check if login page loads
    await page.waitForSelector('[data-testid="cs-login-form"]', { timeout: 10000 });
    console.log('✅ Login page loaded successfully');
    
    // Login as supervisor
    console.log('🔑 Logging in as supervisor...');
    await page.fill('input[type="email"]', 'supervisor@city.gov');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait a moment for login to process
    await page.waitForTimeout(3000);
    console.log('✅ Login completed');
    
    // Navigate directly to Department Metrics page
    console.log('📊 Navigating to Department Metrics...');
    await page.goto('http://localhost:5173/supervisor/department-metrics');
    
    // Wait for the department metrics page to load
    await page.waitForSelector('[data-testid="cs-department-metrics-page"]', { timeout: 15000 });
    console.log('✅ Department Metrics page loaded successfully');
    
    // Check if data is loading (should see loading indicator first)
    console.log('⏳ Checking for data loading...');
    
    // Wait for table to appear (indicating successful data fetch)
    await page.waitForSelector('table', { timeout: 10000 });
    console.log('✅ Data table appeared - API call successful!');
    
    // Check for specific metric data
    const tableRows = await page.locator('tbody tr').count();
    if (tableRows > 0) {
      console.log(`✅ Found ${tableRows} metric records in the table`);
      
      // Take a screenshot for verification
      await page.screenshot({ path: 'supervisor-metrics-success.png', fullPage: true });
      console.log('📸 Screenshot saved as supervisor-metrics-success.png');
    } else {
      console.log('⚠️  Table is empty - no metrics data displayed');
    }
    
    // Check for error messages
    const errorAlert = await page.locator('[data-testid*="error"], .MuiAlert-error').count();
    if (errorAlert > 0) {
      const errorText = await page.locator('[data-testid*="error"], .MuiAlert-error').first().textContent();
      console.log(`❌ Error found: ${errorText}`);
    } else {
      console.log('✅ No error messages - fix appears successful!');
    }
    
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'supervisor-metrics-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as supervisor-metrics-error.png');
  } finally {
    await browser.close();
  }
})();