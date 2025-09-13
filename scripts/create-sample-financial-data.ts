import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleFinancialData() {
  try {
    console.log('Creating sample financial data...');

    // Create a sample project
    const project = await prisma.project.create({
      data: {
        name: 'پروژه نمونه مالی',
        description: 'پروژه تست برای سیستم مالی',
        createdBy: 'admin-user-id', // You'll need to replace this with actual admin user ID
        status: 'ACTIVE'
      }
    });

    console.log('Created project:', project.name);

    // Create sample users
    const user1 = await prisma.user.create({
      data: {
        username: 'user1',
        passwordHash: 'hashed-password',
        firstName: 'احمد',
        lastName: 'محمدی',
        role: 'BUYER',
        isActive: true
      }
    });

    const user2 = await prisma.user.create({
      data: {
        username: 'user2',
        passwordHash: 'hashed-password',
        firstName: 'فاطمه',
        lastName: 'احمدی',
        role: 'BUYER',
        isActive: true
      }
    });

    console.log('Created users:', user1.username, user2.username);

    // Create units for users
    const unit1 = await prisma.unit.create({
      data: {
        projectId: project.id,
        userId: user1.id,
        unitNumber: 'A1',
        area: 100
      }
    });

    const unit2 = await prisma.unit.create({
      data: {
        projectId: project.id,
        userId: user2.id,
        unitNumber: 'A2',
        area: 120
      }
    });

    console.log('Created units:', unit1.unitNumber, unit2.unitNumber);

    // Create installment definitions
    const installment1 = await prisma.installmentDefinition.create({
      data: {
        projectId: project.id,
        title: 'پروانه ساختمان',
        dueDate: new Date('2024-02-01'),
        amount: 10000000
      }
    });

    const installment2 = await prisma.installmentDefinition.create({
      data: {
        projectId: project.id,
        title: 'تأسیسات',
        dueDate: new Date('2024-03-01'),
        amount: 8000000
      }
    });

    console.log('Created installment definitions:', installment1.title, installment2.title);

    // Create user installments
    const userInstallment1 = await prisma.userInstallment.create({
      data: {
        userId: user1.id,
        unitId: unit1.id,
        installmentDefinitionId: installment1.id,
        shareAmount: 5000000,
        status: 'PENDING'
      }
    });

    const userInstallment2 = await prisma.userInstallment.create({
      data: {
        userId: user1.id,
        unitId: unit1.id,
        installmentDefinitionId: installment2.id,
        shareAmount: 4000000,
        status: 'PENDING'
      }
    });

    const userInstallment3 = await prisma.userInstallment.create({
      data: {
        userId: user2.id,
        unitId: unit2.id,
        installmentDefinitionId: installment1.id,
        shareAmount: 6000000,
        status: 'PENDING'
      }
    });

    console.log('Created user installments');

    // Create some sample payments
    const payment1 = await prisma.payment.create({
      data: {
        userInstallmentId: userInstallment1.id,
        paymentDate: new Date('2024-01-15'),
        amount: 2000000,
        description: 'پرداخت اول'
      }
    });

    const payment2 = await prisma.payment.create({
      data: {
        userInstallmentId: userInstallment1.id,
        paymentDate: new Date('2024-01-20'),
        amount: 3000000,
        description: 'پرداخت دوم'
      }
    });

    console.log('Created sample payments');

    // Update installment status
    await prisma.userInstallment.update({
      where: { id: userInstallment1.id },
      data: { status: 'PAID' }
    });

    console.log('Updated installment status');

    console.log('Sample financial data created successfully!');
    console.log('Project ID:', project.id);
    console.log('User 1 ID:', user1.id);
    console.log('User 2 ID:', user2.id);

  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleFinancialData();
