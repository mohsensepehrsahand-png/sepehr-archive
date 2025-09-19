// Script to test import with existing fiscal year
async function testImportWithExistingFiscalYear() {
  try {
    console.log('Logging in as admin...');
    
    // Login as admin
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin'
      })
    });
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.error('Login failed:', errorData);
      return;
    }
    
    const loginResult = await loginResponse.json();
    console.log('Login successful');
    
    // Extract cookies from response
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    const cookies = {};
    if (setCookieHeader) {
      setCookieHeader.split(',').forEach(cookie => {
        const [nameValue] = cookie.split(';');
        const [name, value] = nameValue.split('=');
        if (name && value) {
          cookies[name.trim()] = value.trim();
        }
      });
    }
    
    // Get existing fiscal years
    console.log('\nGetting existing fiscal years...');
    const fiscalYearsResponse = await fetch('http://localhost:3000/api/projects/cmfpsyers0003udu44o6nlsha/fiscal-years', {
      headers: {
        'Cookie': Object.entries(cookies).map(([name, value]) => `${name}=${value}`).join('; ')
      }
    });
    
    if (!fiscalYearsResponse.ok) {
      const errorData = await fiscalYearsResponse.json();
      console.error('Failed to get fiscal years:', errorData);
      return;
    }
    
    const fiscalYears = await fiscalYearsResponse.json();
    console.log('Fiscal years:', fiscalYears);
    
    if (fiscalYears.length === 0) {
      console.log('No fiscal years found');
      return;
    }
    
    const fiscalYear = fiscalYears[0];
    console.log('Using fiscal year:', fiscalYear);
    
    // Test the import with the fiscal year
    console.log('\nTesting import with fiscal year...');
    const importResponse = await fetch('http://localhost:3000/api/accounting/coding/import-default', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': Object.entries(cookies).map(([name, value]) => `${name}=${value}`).join('; ')
      },
      body: JSON.stringify({ 
        projectId: 'cmfpsyers0003udu44o6nlsha',
        fiscalYearId: fiscalYear.id
      })
    });
    
    if (!importResponse.ok) {
      const errorData = await importResponse.json();
      console.error('Import failed:', errorData);
      return;
    }
    
    const importResult = await importResponse.json();
    console.log('Import successful:', importResult);
    
    // Check the coding data with fiscal year
    console.log('\nChecking coding data with fiscal year...');
    const codingResponse = await fetch(`http://localhost:3000/api/accounting/coding/groups?projectId=cmfpsyers0003udu44o6nlsha&fiscalYearId=${fiscalYear.id}`, {
      headers: {
        'Cookie': Object.entries(cookies).map(([name, value]) => `${name}=${value}`).join('; ')
      }
    });
    
    if (codingResponse.ok) {
      const codingData = await codingResponse.json();
      console.log(`Found ${codingData.length} groups with fiscal year`);
      codingData.forEach((group: any) => {
        console.log(`  - ${group.code}: ${group.name} (default: ${group.isDefault}, active: ${group.isActive})`);
      });
    }
    
    console.log('\n✅ Test completed successfully!');
    console.log(`You can now visit: http://localhost:3000/accounting/cmfpsyers0003udu44o6nlsha/${fiscalYear.id}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testImportWithExistingFiscalYear();
