import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function updateInstallmentOrders() {
  try {
    console.log('Starting to update installment orders...');

    // Get all projects
    const projects = await prisma.project.findMany({
      include: {
        installmentDefinitions: {
          where: { isDefault: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    for (const project of projects) {
      console.log(`Processing project: ${project.name}`);
      
      // Update order for each installment definition
      for (let i = 0; i < project.installmentDefinitions.length; i++) {
        const installment = project.installmentDefinitions[i];
        await prisma.installmentDefinition.update({
          where: { id: installment.id },
          data: { order: i + 1 }
        });
        console.log(`  Updated installment "${installment.title}" to order ${i + 1}`);
      }
    }

    console.log('Installment orders updated successfully!');
  } catch (error) {
    console.error('Error updating installment orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateInstallmentOrders();
