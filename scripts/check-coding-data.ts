import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCodingData() {
  try {
    console.log('Checking coding data in database...');
    
    // Get all projects
    const projects = await prisma.project.findMany({
      select: { id: true, name: true }
    });
    
    console.log(`Found ${projects.length} projects:`);
    projects.forEach(p => console.log(`- ${p.name} (${p.id})`));
    
    for (const project of projects) {
      console.log(`\n--- Project: ${project.name} ---`);
      
      // Check groups
      const groups = await prisma.accountGroup.findMany({
        where: { projectId: project.id },
        select: { 
          id: true, 
          code: true, 
          name: true, 
          isDefault: true, 
          isActive: true,
          isProtected: true
        }
      });
      
      console.log(`Groups: ${groups.length}`);
      groups.forEach(g => console.log(`  - ${g.code}: ${g.name} (default: ${g.isDefault}, active: ${g.isActive}, protected: ${g.isProtected})`));
      
      // Check classes
      const classes = await prisma.accountClass.findMany({
        where: { projectId: project.id },
        select: { 
          id: true, 
          code: true, 
          name: true, 
          isDefault: true, 
          isActive: true
        }
      });
      
      console.log(`Classes: ${classes.length}`);
      classes.forEach(c => console.log(`  - ${c.code}: ${c.name} (default: ${c.isDefault}, active: ${c.isActive})`));
      
      // Check subclasses
      const subClasses = await prisma.accountSubClass.findMany({
        where: { projectId: project.id },
        select: { 
          id: true, 
          code: true, 
          name: true, 
          isDefault: true, 
          isActive: true
        }
      });
      
      console.log(`SubClasses: ${subClasses.length}`);
      subClasses.forEach(s => console.log(`  - ${s.code}: ${s.name} (default: ${s.isDefault}, active: ${s.isActive})`));
      
      // Check details
      const details = await prisma.accountDetail.findMany({
        where: { projectId: project.id },
        select: { 
          id: true, 
          code: true, 
          name: true, 
          isDefault: true, 
          isActive: true
        }
      });
      
      console.log(`Details: ${details.length}`);
      details.forEach(d => console.log(`  - ${d.code}: ${d.name} (default: ${d.isDefault}, active: ${d.isActive})`));
    }
    
  } catch (error) {
    console.error('Error checking coding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCodingData();
