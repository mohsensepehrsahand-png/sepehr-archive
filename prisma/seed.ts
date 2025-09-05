import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database cleanup...');
  
  // حذف همه رکوردهای مرتبط با کاربران (به ترتیب صحیح)
  console.log('Deleting related records...');
  
  // حذف مجوزها
  const deletedPermissions = await prisma.permission.deleteMany({});
  console.log(`Deleted ${deletedPermissions.count} permissions`);
  
  // حذف اسناد
  const deletedDocuments = await prisma.document.deleteMany({});
  console.log(`Deleted ${deletedDocuments.count} documents`);
  
  // حذف پوشه‌ها
  const deletedFolders = await prisma.folder.deleteMany({});
  console.log(`Deleted ${deletedFolders.count} folders`);
  
  // حذف پروژه‌ها
  const deletedProjects = await prisma.project.deleteMany({});
  console.log(`Deleted ${deletedProjects.count} projects`);
  
  // حالا می‌توانیم کاربران را حذف کنیم
  const deletedUsers = await prisma.user.deleteMany({});
  console.log(`Deleted ${deletedUsers.count} existing users`);
  
  // ایجاد کاربر admin با پسورد "admin"
  const passwordHash = await bcrypt.hash('admin', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: passwordHash,
      firstName: 'مدیر',
      lastName: 'سیستم',
      email: 'admin@example.com',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('Admin user created successfully:', {
    username: adminUser.username,
    firstName: adminUser.firstName,
    lastName: adminUser.lastName,
    email: adminUser.email,
    role: adminUser.role,
    isActive: adminUser.isActive
  });

  // ایجاد کاربر تست غیر-ادمین
  const testUserPasswordHash = await bcrypt.hash('test123', 10);
  
  const testUser = await prisma.user.create({
    data: {
      username: 'testuser',
      passwordHash: testUserPasswordHash,
      firstName: 'کاربر',
      lastName: 'تست',
      email: 'test@example.com',
      role: 'BUYER',
      isActive: true,
    },
  });

  console.log('Test user created successfully:', {
    username: testUser.username,
    firstName: testUser.firstName,
    lastName: testUser.lastName,
    email: testUser.email,
    role: testUser.role,
    isActive: testUser.isActive
  });

  // ایجاد پروژه‌های تست
  const project1 = await prisma.project.create({
    data: {
      name: 'پروژه تست ۱',
      description: 'این پروژه برای تست سیستم دسترسی است',
      status: 'ACTIVE',
      createdBy: adminUser.id,
      colorPrimary: "#1976d2",
      colorFolderDefault: "#90caf9",
      colorDocImage: "#26a69a",
      colorDocPdf: "#ef5350",
      bgColor: "#ffffff"
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'پروژه تست ۲',
      description: 'این پروژه برای تست سیستم دسترسی است',
      status: 'ACTIVE',
      createdBy: adminUser.id,
      colorPrimary: "#388e3c",
      colorFolderDefault: "#81c784",
      colorDocImage: "#ff9800",
      colorDocPdf: "#e91e63",
      bgColor: "#fafafa"
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'پروژه خصوصی',
      description: 'این پروژه فقط برای مدیر قابل دسترسی است',
      status: 'ACTIVE',
      createdBy: adminUser.id,
      colorPrimary: "#d32f2f",
      colorFolderDefault: "#f44336",
      colorDocImage: "#9c27b0",
      colorDocPdf: "#607d8b",
      bgColor: "#fff"
    },
  });

  console.log('Test projects created successfully:', {
    project1: project1.name,
    project2: project2.name,
    project3: project3.name
  });

  // ایجاد مجوزهای دسترسی برای کاربر تست
  // کاربر تست فقط به پروژه ۱ و ۲ دسترسی دارد
  const permission1 = await prisma.permission.create({
    data: {
      userId: testUser.id,
      resourceType: 'PROJECT',
      resourceId: project1.id,
      accessLevel: 'VIEW',
    },
  });

  const permission2 = await prisma.permission.create({
    data: {
      userId: testUser.id,
      resourceType: 'PROJECT',
      resourceId: project2.id,
      accessLevel: 'ADD',
    },
  });

  console.log('Test permissions created successfully:', {
    permission1: `User ${testUser.username} has ${permission1.accessLevel} access to ${project1.name}`,
    permission2: `User ${testUser.username} has ${permission2.accessLevel} access to ${project2.name}`,
    note: `User ${testUser.username} has NO access to ${project3.name}`
  });

  console.log('\n=== TEST ENVIRONMENT SETUP COMPLETE ===');
  console.log('Admin user: admin / admin');
  console.log('Test user: testuser / test123');
  console.log('Test user should only see Project 1 and Project 2');
  console.log('Test user should NOT see Project 3 (Private Project)');
  console.log('===============================================\n');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

