import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixClassCodes() {
  try {
    console.log('Starting to fix class codes...');
    
    // Get all classes that have 3-digit codes
    const classes = await prisma.accountClass.findMany({
      where: {
        code: {
          // Find codes that are 3 digits or more
          not: {
            in: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] // Single digits
          }
        }
      },
      include: {
        group: true
      }
    });

    console.log(`Found ${classes.length} classes with potentially incorrect codes`);

    for (const accountClass of classes) {
      const groupCode = accountClass.group.code;
      const currentCode = accountClass.code;
      
      // Check if the code starts with the group code
      if (currentCode.startsWith(groupCode)) {
        const classPart = currentCode.substring(groupCode.length);
        
        // If the class part is more than 1 digit, truncate it
        if (classPart.length > 1) {
          const newClassPart = classPart.substring(0, 1);
          const newCode = groupCode + newClassPart;
          
          console.log(`Fixing class: ${accountClass.name} (${currentCode} -> ${newCode})`);
          
          // Check if the new code already exists
          const existingClass = await prisma.accountClass.findFirst({
            where: {
              projectId: accountClass.projectId,
              groupId: accountClass.groupId,
              code: newCode,
              id: { not: accountClass.id }
            }
          });
          
          if (!existingClass) {
            await prisma.accountClass.update({
              where: { id: accountClass.id },
              data: { code: newCode }
            });
            console.log(`✓ Updated class ${accountClass.name} to code ${newCode}`);
          } else {
            console.log(`✗ Cannot update class ${accountClass.name} - code ${newCode} already exists`);
          }
        }
      }
    }

    console.log('Class code fixing completed!');
  } catch (error) {
    console.error('Error fixing class codes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixClassCodes();

