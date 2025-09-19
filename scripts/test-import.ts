// Simple test script to check import functionality
async function testImport() {
  try {
    console.log('Testing import default coding...');
    
    // First, let's check what projects exist
    const projectsResponse = await fetch('http://localhost:3000/api/projects');
    if (!projectsResponse.ok) {
      console.error('Failed to fetch projects:', projectsResponse.status);
      return;
    }
    
    const projects = await projectsResponse.json();
    console.log('Available projects:', projects.map((p: any) => ({ id: p.id, name: p.name })));
    
    if (projects.length === 0) {
      console.log('No projects found. Please create a project first.');
      return;
    }
    
    const projectId = projects[0].id;
    console.log(`Using project: ${projects[0].name} (${projectId})`);
    
    // Check existing coding data
    console.log('\nChecking existing coding data...');
    const existingResponse = await fetch(`http://localhost:3000/api/accounting/coding/groups?projectId=${projectId}`);
    if (existingResponse.ok) {
      const existingData = await existingResponse.json();
      console.log(`Found ${existingData.length} existing groups`);
      existingData.forEach((group: any) => {
        console.log(`  - ${group.code}: ${group.name} (default: ${group.isDefault}, active: ${group.isActive})`);
      });
    }
    
    // Try to import default coding
    console.log('\nAttempting to import default coding...');
    const importResponse = await fetch('http://localhost:3000/api/accounting/coding/import-default', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId })
    });
    
    if (!importResponse.ok) {
      const errorData = await importResponse.json();
      console.error('Import failed:', errorData);
      return;
    }
    
    const importResult = await importResponse.json();
    console.log('Import successful:', importResult);
    
    // Check coding data again
    console.log('\nChecking coding data after import...');
    const afterResponse = await fetch(`http://localhost:3000/api/accounting/coding/groups?projectId=${projectId}`);
    if (afterResponse.ok) {
      const afterData = await afterResponse.json();
      console.log(`Found ${afterData.length} groups after import`);
      afterData.forEach((group: any) => {
        console.log(`  - ${group.code}: ${group.name} (default: ${group.isDefault}, active: ${group.isActive})`);
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testImport();
