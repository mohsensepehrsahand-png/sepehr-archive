// Script to login as admin and create fiscal year
async function loginAndCreateFiscalYear() {
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
    console.log('Login successful:', loginResult);
    
    // Extract cookies from response
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('Set-Cookie header:', setCookieHeader);
    
    // Parse cookies
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
    
    console.log('Parsed cookies:', cookies);
    
    // Create fiscal year with cookies
    console.log('\nCreating fiscal year...');
    const fiscalYearResponse = await fetch('http://localhost:3000/api/projects/cmfpsyers0003udu44o6nlsha/fiscal-years', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': Object.entries(cookies).map(([name, value]) => `${name}=${value}`).join('; ')
      },
      body: JSON.stringify({
        year: 1403,
        startDate: '2024-03-21',
        endDate: '2025-03-20',
        description: 'سال مالی 1403'
      })
    });
    
    if (!fiscalYearResponse.ok) {
      const errorData = await fiscalYearResponse.json();
      console.error('Failed to create fiscal year:', errorData);
      return;
    }
    
    const fiscalYear = await fiscalYearResponse.json();
    console.log('Fiscal year created successfully:', fiscalYear);
    
    // Now test the import with the fiscal year
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

loginAndCreateFiscalYear();
