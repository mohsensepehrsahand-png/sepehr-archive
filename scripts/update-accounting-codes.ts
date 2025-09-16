import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAccountingCodes() {
  try {
    console.log('Starting accounting codes update...');

    // Get all projects
    const projects = await prisma.project.findMany({
      include: {
        groups: {
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
      console.log(`\nUpdating project: ${project.name} (${project.id})`);

      // Update groups (keep as is: 1-10)
      for (const group of project.groups) {
        console.log(`  Group: ${group.name} (${group.code}) - keeping as is`);

        // Update classes: store only 2-digit part (01-99)
        for (let i = 0; i < group.classes.length; i++) {
          const accountClass = group.classes[i];
          const newClassCode = String(i + 1).padStart(2, '0');
          
          if (accountClass.code !== newClassCode) {
            console.log(`    Class: ${accountClass.name} (${accountClass.code} -> ${newClassCode})`);
            
            await prisma.accountClass.update({
              where: { id: accountClass.id },
              data: { code: newClassCode }
            });

            // Update subclasses: store only 2-digit part (01-99)
            for (let j = 0; j < accountClass.subClasses.length; j++) {
              const subClass = accountClass.subClasses[j];
              const newSubClassCode = String(j + 1).padStart(2, '0');
              
              if (subClass.code !== newSubClassCode) {
                console.log(`      SubClass: ${subClass.name} (${subClass.code} -> ${newSubClassCode})`);
                
                await prisma.accountSubClass.update({
                  where: { id: subClass.id },
                  data: { code: newSubClassCode }
                });

                // Update details: store only 2-digit part (01-99)
                for (let k = 0; k < subClass.details.length; k++) {
                  const detail = subClass.details[k];
                  const newDetailCode = String(k + 1).padStart(2, '0');
                  
                  if (detail.code !== newDetailCode) {
                    console.log(`        Detail: ${detail.name} (${detail.code} -> ${newDetailCode})`);
                    
                    await prisma.accountDetail.update({
                      where: { id: detail.id },
                      data: { code: newDetailCode }
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    console.log('\nAccounting codes update completed successfully!');
  } catch (error) {
    console.error('Error updating accounting codes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAccountingCodes();
