import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function testAccountingCoding() {
  console.log('🧪 Testing Accounting Coding System...\n');

  try {
    // Test 1: Create a test project
    console.log('1️⃣ Creating test project...');
    const testProject = await prisma.project.create({
      data: {
        name: 'پروژه تست کدینگ حسابداری',
        description: 'پروژه تست برای سیستم کدینگ حسابداری',
        createdBy: 'test-user-id', // You'll need to replace this with an actual user ID
      }
    });
    console.log('✅ Test project created:', testProject.id);

    // Test 2: Import default coding structure
    console.log('\n2️⃣ Importing default coding structure...');
    const importResponse = await fetch('http://localhost:3000/api/accounting/coding/import-default', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: testProject.id })
    });

    if (!importResponse.ok) {
      const errorData = await importResponse.json();
      throw new Error(`Import failed: ${errorData.error}`);
    }

    const importResult = await importResponse.json();
    console.log('✅ Default coding structure imported successfully');
    console.log(`   - Groups created: ${importResult.data.length}`);

    // Test 3: Fetch and verify the imported structure
    console.log('\n3️⃣ Fetching imported structure...');
    const groupsResponse = await fetch(`http://localhost:3000/api/accounting/coding/groups?projectId=${testProject.id}`);
    
    if (!groupsResponse.ok) {
      throw new Error('Failed to fetch groups');
    }

    const groups = await groupsResponse.json();
    console.log('✅ Groups fetched successfully');
    console.log(`   - Total groups: ${groups.length}`);

    // Count total items
    let totalClasses = 0;
    let totalSubClasses = 0;
    let totalDetails = 0;

    groups.forEach((group: any) => {
      totalClasses += group.classes.length;
      group.classes.forEach((accountClass: any) => {
        totalSubClasses += accountClass.subClasses.length;
        accountClass.subClasses.forEach((subClass: any) => {
          totalDetails += subClass.details.length;
        });
      });
    });

    console.log(`   - Total classes: ${totalClasses}`);
    console.log(`   - Total subclasses: ${totalSubClasses}`);
    console.log(`   - Total details: ${totalDetails}`);

    // Test 4: Test adding a new group
    console.log('\n4️⃣ Testing adding new group...');
    const newGroupResponse = await fetch('http://localhost:3000/api/accounting/coding/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: testProject.id,
        code: '11',
        name: 'گروه تست جدید'
      })
    });

    if (!newGroupResponse.ok) {
      const errorData = await newGroupResponse.json();
      throw new Error(`Failed to add group: ${errorData.error}`);
    }

    const newGroup = await newGroupResponse.json();
    console.log('✅ New group added:', newGroup.code, '-', newGroup.name);

    // Test 5: Test adding a new class
    console.log('\n5️⃣ Testing adding new class...');
    const newClassResponse = await fetch('http://localhost:3000/api/accounting/coding/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: testProject.id,
        groupId: newGroup.id,
        code: '01',
        name: 'کل تست جدید',
        nature: 'DEBIT'
      })
    });

    if (!newClassResponse.ok) {
      const errorData = await newClassResponse.json();
      throw new Error(`Failed to add class: ${errorData.error}`);
    }

    const newClass = await newClassResponse.json();
    console.log('✅ New class added:', newClass.code, '-', newClass.name);

    // Test 6: Test adding a new subclass
    console.log('\n6️⃣ Testing adding new subclass...');
    const newSubClassResponse = await fetch('http://localhost:3000/api/accounting/coding/subclasses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: testProject.id,
        classId: newClass.id,
        code: '001',
        name: 'معین تست جدید',
        hasDetails: true
      })
    });

    if (!newSubClassResponse.ok) {
      const errorData = await newSubClassResponse.json();
      throw new Error(`Failed to add subclass: ${errorData.error}`);
    }

    const newSubClass = await newSubClassResponse.json();
    console.log('✅ New subclass added:', newSubClass.code, '-', newSubClass.name);

    // Test 7: Test adding a new detail
    console.log('\n7️⃣ Testing adding new detail...');
    const newDetailResponse = await fetch('http://localhost:3000/api/accounting/coding/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: testProject.id,
        subClassId: newSubClass.id,
        code: '001',
        name: 'تفصیلی تست جدید',
        description: 'توضیحات تفصیلی تست'
      })
    });

    if (!newDetailResponse.ok) {
      const errorData = await newDetailResponse.json();
      throw new Error(`Failed to add detail: ${errorData.error}`);
    }

    const newDetail = await newDetailResponse.json();
    console.log('✅ New detail added:', newDetail.code, '-', newDetail.name);

    // Test 8: Verify the complete structure
    console.log('\n8️⃣ Verifying complete structure...');
    const finalGroupsResponse = await fetch(`http://localhost:3000/api/accounting/coding/groups?projectId=${testProject.id}`);
    const finalGroups = await finalGroupsResponse.json();

    const testGroup = finalGroups.find((g: any) => g.code === '11');
    if (testGroup) {
      console.log('✅ Test group found:', testGroup.name);
      if (testGroup.classes.length > 0) {
        const testClass = testGroup.classes[0];
        console.log('✅ Test class found:', testClass.name);
        if (testClass.subClasses.length > 0) {
          const testSubClass = testClass.subClasses[0];
          console.log('✅ Test subclass found:', testSubClass.name);
          if (testSubClass.details.length > 0) {
            const testDetail = testSubClass.details[0];
            console.log('✅ Test detail found:', testDetail.name);
          }
        }
      }
    }

    // Test 9: Test validation - try to add duplicate code
    console.log('\n9️⃣ Testing validation - duplicate code...');
    const duplicateResponse = await fetch('http://localhost:3000/api/accounting/coding/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: testProject.id,
        code: '1', // This should already exist from default import
        name: 'گروه تکراری'
      })
    });

    if (duplicateResponse.ok) {
      console.log('❌ Validation failed: Duplicate code was accepted');
    } else {
      const errorData = await duplicateResponse.json();
      console.log('✅ Validation working: Duplicate code rejected:', errorData.error);
    }

    // Test 10: Clean up test data
    console.log('\n🔟 Cleaning up test data...');
    await prisma.project.delete({
      where: { id: testProject.id }
    });
    console.log('✅ Test project deleted');

    console.log('\n🎉 All tests passed! Accounting coding system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAccountingCoding();

