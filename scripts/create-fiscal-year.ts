// Script to create a fiscal year for testing
async function createFiscalYear() {
  try {
    console.log('Creating fiscal year...');
    
    const response = await fetch('http://localhost:3000/api/projects/cmfpsyers0003udu44o6nlsha/fiscal-years', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        year: 1403,
        startDate: '2024-03-21',
        endDate: '2025-03-20',
        description: 'سال مالی 1403'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to create fiscal year:', errorData);
      return;
    }
    
    const fiscalYear = await response.json();
    console.log('Fiscal year created successfully:', fiscalYear);
    
    // Now test the import with the fiscal year
    console.log('\nTesting import with fiscal year...');
    const importResponse = await fetch('http://localhost:3000/api/accounting/coding/import-default', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    const codingResponse = await fetch(`http://localhost:3000/api/accounting/coding/groups?projectId=cmfpsyers0003udu44o6nlsha&fiscalYearId=${fiscalYear.id}`);
    if (codingResponse.ok) {
      const codingData = await codingResponse.json();
      console.log(`Found ${codingData.length} groups with fiscal year`);
      codingData.forEach((group: any) => {
        console.log(`  - ${group.code}: ${group.name} (default: ${group.isDefault}, active: ${group.isActive})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createFiscalYear();
