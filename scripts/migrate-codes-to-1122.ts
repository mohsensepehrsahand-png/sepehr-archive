import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCodesTo1122() {
  try {
    console.log('Starting migration to 1-1-2-2 code format...');
    
    const projects = await prisma.project.findMany({
      include: {
        accountGroups: {
          include: {
            classes: {
              include: {
                subClasses: {
                  include: {
                    details: true
                  }
                }
              }
            }
          }
        }
      }
    });

    for (const project of projects) {
      console.log(`\nProcessing project: ${project.name}`);
      for (const group of project.accountGroups) {
        // Groups are already 1 digit, no change needed unless > 9
        if (parseInt(group.code) > 9) {
          console.warn(`  WARNING: Group ${group.code} in project ${project.name} is out of 1-9 range.`);
        }
        
        for (const accountClass of group.classes) {
          // Convert class code to 1 digit
          const newClassCode = String(parseInt(accountClass.code, 10) % 10);
          if (newClassCode !== accountClass.code) {
             await prisma.accountClass.update({
                where: { id: accountClass.id },
                data: { code: newClassCode }
            });
            console.log(`  Updated Class: ${accountClass.name} (${accountClass.code} -> ${newClassCode})`);
          }

          for (const subClass of accountClass.subClasses) {
            // Convert subclass code to 2 digits
            const newSubClassCode = String(parseInt(subClass.code, 10)).padStart(2, '0');
             if (newSubClassCode !== subClass.code) {
                await prisma.accountSubClass.update({
                    where: { id: subClass.id },
                    data: { code: newSubClassCode }
                });
                console.log(`    Updated SubClass: ${subClass.name} (${subClass.code} -> ${newSubClassCode})`);
            }
            
            for (const detail of subClass.details) {
              // Convert detail code to 2 digits
              const newDetailCode = String(parseInt(detail.code, 10)).padStart(2, '0');
               if (newDetailCode !== detail.code) {
                   await prisma.accountDetail.update({
                      where: { id: detail.id },
                      data: { code: newDetailCode }
                  });
                  console.log(`      Updated Detail: ${detail.name} (${detail.code} -> ${newDetailCode})`);
              }
            }
          }
        }
      }
    }

    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateCodesTo1122();
