/**
 * تست دسترسی به منابع (Projects/Documents/Folders)
 * بررسی سیستم Permission و دسترسی به منابع مختلف
 */

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const BASE_URL = 'http://localhost:3000';

async function createTestProject(userId: string): Promise<string> {
  try {
    const project = await prisma.project.create({
      data: {
        name: 'Test Security Project',
        description: 'پروژه تست امنیت',
        status: 'ACTIVE',
        createdBy: userId
      }
    });
    return project.id;
  } catch (error) {
    console.error('خطا در ایجاد پروژه تست:', error);
    return '';
  }
}

async function createTestFolder(projectId: string, userId: string): Promise<string> {
  try {
    const folder = await prisma.folder.create({
      data: {
        name: 'Test Security Folder',
        projectId,
        createdBy: userId,
        tabKey: 'BUYER', // اضافه کردن tabKey الزامی
        path: '/test-security-folder',
        depth: 1
      }
    });
    return folder.id;
  } catch (error) {
    console.error('خطا در ایجاد پوشه تست:', error);
    return '';
  }
}

async function createTestUser(role: 'ADMIN' | 'BUYER' | 'CONTRACTOR' | 'SUPPLIER'): Promise<any> {
  try {
    const bcrypt = require('bcryptjs');
    const username = `test_${role.toLowerCase()}_${Date.now()}`;
    const password = await bcrypt.hash('test123', 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: password,
        firstName: 'Test',
        lastName: role,
        role,
        isActive: true
      }
    });
    return user;
  } catch (error) {
    console.error('خطا در ایجاد کاربر تست:', error);
    return null;
  }
}

async function grantProjectPermission(
  userId: string, 
  projectId: string, 
  accessLevel: 'VIEW' | 'ADD' | 'ADMIN'
): Promise<boolean> {
  try {
    await prisma.permission.create({
      data: {
        userId,
        resourceType: 'PROJECT',
        resourceId: projectId,
        accessLevel
      }
    });
    return true;
  } catch (error) {
    console.error('خطا در اعطای دسترسی:', error);
    return false;
  }
}

async function grantFolderPermission(
  userId: string, 
  folderId: string,
  canView: boolean,
  canEdit: boolean,
  canDelete: boolean
): Promise<boolean> {
  try {
    await prisma.folderPermissions.create({
      data: {
        userId,
        folderId,
        canView,
        canEdit,
        canDelete
      }
    });
    return true;
  } catch (error) {
    console.error('خطا در اعطای دسترسی پوشه:', error);
    return false;
  }
}

async function testProjectListFiltering(): Promise<TestResult> {
  try {
    // ایجاد دو کاربر و دو پروژه
    const user1 = await createTestUser('BUYER');
    const user2 = await createTestUser('CONTRACTOR');

    if (!user1 || !user2) {
      return {
        name: 'خطا در ایجاد کاربران تست',
        passed: false,
        message: 'نتوانست کاربران تست را ایجاد کند',
        details: {}
      };
    }

    const project1 = await createTestProject(user1.id);
    const project2 = await createTestProject(user1.id);

    // فقط به user1 دسترسی به project1 بده
    await grantProjectPermission(user1.id, project1, 'VIEW');
    await grantProjectPermission(user2.id, project2, 'VIEW');

    // درخواست لیست پروژه‌ها برای user1
    const response1 = await fetch(`${BASE_URL}/api/projects`, {
      headers: {
        'Cookie': `authToken=user-token; userRole=${user1.role}; userData=${JSON.stringify({ id: user1.id })}`
      }
    });

    const projects1 = await response1.json();
    const hasAccessToProject1 = projects1.some((p: any) => p.id === project1);
    const hasAccessToProject2 = projects1.some((p: any) => p.id === project2);

    // پاک کردن داده‌های تست
    await prisma.permission.deleteMany({ where: { userId: user1.id } });
    await prisma.permission.deleteMany({ where: { userId: user2.id } });
    await prisma.project.deleteMany({ where: { id: { in: [project1, project2] } } });
    await prisma.user.deleteMany({ where: { id: { in: [user1.id, user2.id] } } });

    if (hasAccessToProject1 && !hasAccessToProject2) {
      return {
        name: 'فیلتر کردن لیست پروژه‌ها بر اساس دسترسی',
        passed: true,
        message: 'لیست پروژه‌ها به درستی بر اساس دسترسی فیلتر می‌شود',
        details: {
          user1Projects: projects1.length,
          hasAccessToProject1,
          hasAccessToProject2
        }
      };
    }

    return {
      name: 'خطا در فیلتر پروژه‌ها',
      passed: false,
      message: 'لیست پروژه‌ها به درستی فیلتر نمی‌شود',
      details: {
        hasAccessToProject1,
        hasAccessToProject2
      }
    };
  } catch (error) {
    return {
      name: 'خطا در تست فیلتر پروژه‌ها',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testProjectAccessLevels(): Promise<TestResult> {
  try {
    const adminUser = await createTestUser('ADMIN');
    const viewUser = await createTestUser('BUYER');
    const noAccessUser = await createTestUser('CONTRACTOR');

    if (!adminUser || !viewUser || !noAccessUser) {
      return {
        name: 'خطا در ایجاد کاربران',
        passed: false,
        message: 'نتوانست کاربران تست را ایجاد کند',
        details: {}
      };
    }

    const projectId = await createTestProject(adminUser.id);

    // دسترسی VIEW به viewUser
    await grantProjectPermission(viewUser.id, projectId, 'VIEW');

    // تست دسترسی VIEW
    const viewResponse = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
      headers: {
        'Cookie': `authToken=user-token; userRole=${viewUser.role}; userData=${JSON.stringify({ id: viewUser.id })}`
      }
    });

    // تست عدم دسترسی
    const noAccessResponse = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
      headers: {
        'Cookie': `authToken=user-token; userRole=${noAccessUser.role}; userData=${JSON.stringify({ id: noAccessUser.id })}`
      }
    });

    // تست دسترسی Admin
    const adminResponse = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
      headers: {
        'Cookie': `authToken=user-token; userRole=ADMIN; userData=${JSON.stringify({ id: adminUser.id })}`
      }
    });

    // پاک کردن داده‌های تست
    await prisma.permission.deleteMany({ 
      where: { resourceId: projectId } 
    });
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.user.deleteMany({ 
      where: { id: { in: [adminUser.id, viewUser.id, noAccessUser.id] } } 
    });

    const viewHasAccess = viewResponse.ok;
    const noAccessBlocked = noAccessResponse.status === 403 || noAccessResponse.status === 404;
    const adminHasAccess = adminResponse.ok;

    if (viewHasAccess && noAccessBlocked && adminHasAccess) {
      return {
        name: 'سطوح دسترسی پروژه',
        passed: true,
        message: 'سطوح دسترسی پروژه به درستی کار می‌کنند',
        details: {
          viewHasAccess,
          noAccessBlocked,
          adminHasAccess
        }
      };
    }

    return {
      name: 'خطا در سطوح دسترسی پروژه',
      passed: false,
      message: 'سطوح دسترسی به درستی کار نمی‌کنند',
      details: {
        viewHasAccess,
        noAccessBlocked,
        adminHasAccess
      }
    };
  } catch (error) {
    return {
      name: 'خطا در تست سطوح دسترسی',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testFolderPermissions(): Promise<TestResult> {
  try {
    const ownerUser = await createTestUser('ADMIN');
    const viewUser = await createTestUser('BUYER');
    const editUser = await createTestUser('CONTRACTOR');

    if (!ownerUser || !viewUser || !editUser) {
      return {
        name: 'خطا در ایجاد کاربران',
        passed: false,
        message: 'نتوانست کاربران تست را ایجاد کند',
        details: {}
      };
    }

    const projectId = await createTestProject(ownerUser.id);
    const folderId = await createTestFolder(projectId, ownerUser.id);

    // دسترسی VIEW به viewUser
    await grantFolderPermission(viewUser.id, folderId, true, false, false);

    // دسترسی EDIT به editUser
    await grantFolderPermission(editUser.id, folderId, true, true, false);

    // تست دسترسی VIEW
    const viewerPermission = await prisma.folderPermissions.findUnique({
      where: {
        folderId_userId: {
          folderId,
          userId: viewUser.id
        }
      }
    });

    // تست دسترسی EDIT
    const editorPermission = await prisma.folderPermissions.findUnique({
      where: {
        folderId_userId: {
          folderId,
          userId: editUser.id
        }
      }
    });

    // پاک کردن داده‌های تست
    await prisma.folderPermissions.deleteMany({ where: { folderId } });
    await prisma.folder.delete({ where: { id: folderId } });
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.user.deleteMany({ 
      where: { id: { in: [ownerUser.id, viewUser.id, editUser.id] } } 
    });

    const viewerHasCorrectPermissions = 
      viewerPermission?.canView && 
      !viewerPermission?.canEdit && 
      !viewerPermission?.canDelete;

    const editorHasCorrectPermissions = 
      editorPermission?.canView && 
      editorPermission?.canEdit && 
      !editorPermission?.canDelete;

    if (viewerHasCorrectPermissions && editorHasCorrectPermissions) {
      return {
        name: 'دسترسی‌های پوشه',
        passed: true,
        message: 'دسترسی‌های پوشه به درستی کار می‌کنند',
        details: {
          viewerPermissions: viewerPermission,
          editorPermissions: editorPermission
        }
      };
    }

    return {
      name: 'خطا در دسترسی‌های پوشه',
      passed: false,
      message: 'دسترسی‌های پوشه به درستی کار نمی‌کنند',
      details: {
        viewerHasCorrectPermissions,
        editorHasCorrectPermissions
      }
    };
  } catch (error) {
    return {
      name: 'خطا در تست دسترسی پوشه',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testDocumentAccess(): Promise<TestResult> {
  try {
    const ownerUser = await createTestUser('ADMIN');
    const authorizedUser = await createTestUser('BUYER');
    const unauthorizedUser = await createTestUser('CONTRACTOR');

    if (!ownerUser || !authorizedUser || !unauthorizedUser) {
      return {
        name: 'خطا در ایجاد کاربران',
        passed: false,
        message: 'نتوانست کاربران تست را ایجاد کند',
        details: {}
      };
    }

    const projectId = await createTestProject(ownerUser.id);
    const folderId = await createTestFolder(projectId, ownerUser.id);

    // اعطای دسترسی پروژه
    await grantProjectPermission(authorizedUser.id, projectId, 'VIEW');
    await grantProjectPermission(unauthorizedUser.id, projectId, 'VIEW');

    // اعطای دسترسی پوشه فقط به authorizedUser
    await grantFolderPermission(authorizedUser.id, folderId, true, false, false);

    // ایجاد یک سند تست
    const document = await prisma.document.create({
      data: {
        name: 'Test Document',
        filePath: 'uploads/test/doc.pdf',
        sizeBytes: 1024, // تغییر fileSize به sizeBytes
        fileExt: 'pdf', // اضافه کردن fileExt الزامی
        mimeType: 'application/pdf',
        projectId,
        folderId,
        createdBy: ownerUser.id
      }
    });

    // تست دسترسی مجاز
    const authorizedResponse = await fetch(`${BASE_URL}/api/documents?projectId=${projectId}&folderId=${folderId}`, {
      headers: {
        'Cookie': `authToken=user-token; userRole=${authorizedUser.role}; userData=${JSON.stringify({ id: authorizedUser.id })}`
      }
    });

    const authorizedDocs = authorizedResponse.ok ? await authorizedResponse.json() : [];

    // تست عدم دسترسی
    const unauthorizedResponse = await fetch(`${BASE_URL}/api/documents/${document.id}/download`, {
      headers: {
        'Cookie': `authToken=user-token; userRole=${unauthorizedUser.role}; userData=${JSON.stringify({ id: unauthorizedUser.id })}`
      }
    });

    // پاک کردن داده‌های تست
    await prisma.document.delete({ where: { id: document.id } });
    await prisma.folderPermissions.deleteMany({ where: { folderId } });
    await prisma.permission.deleteMany({ where: { resourceId: projectId } });
    await prisma.folder.delete({ where: { id: folderId } });
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.user.deleteMany({ 
      where: { id: { in: [ownerUser.id, authorizedUser.id, unauthorizedUser.id] } } 
    });

    const authorizedCanView = authorizedResponse.ok && authorizedDocs.length > 0;
    const unauthorizedBlocked = unauthorizedResponse.status === 403;

    if (authorizedCanView && unauthorizedBlocked) {
      return {
        name: 'دسترسی به اسناد',
        passed: true,
        message: 'دسترسی به اسناد به درستی کنترل می‌شود',
        details: {
          authorizedCanView,
          unauthorizedBlocked,
          documentsCount: authorizedDocs.length
        }
      };
    }

    return {
      name: 'خطا در کنترل دسترسی اسناد',
      passed: false,
      message: 'دسترسی به اسناد به درستی کنترل نمی‌شود',
      details: {
        authorizedCanView,
        unauthorizedBlocked
      }
    };
  } catch (error) {
    return {
      name: 'خطا در تست دسترسی اسناد',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

async function testAdminFullAccess(): Promise<TestResult> {
  try {
    const adminUser = await createTestUser('ADMIN');
    const regularUser = await createTestUser('BUYER');

    if (!adminUser || !regularUser) {
      return {
        name: 'خطا در ایجاد کاربران',
        passed: false,
        message: 'نتوانست کاربران تست را ایجاد کند',
        details: {}
      };
    }

    const projectId = await createTestProject(regularUser.id);

    // Admin باید بدون Permission به همه پروژه‌ها دسترسی داشته باشد
    const adminResponse = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
      headers: {
        'Cookie': `authToken=user-token; userRole=ADMIN; userData=${JSON.stringify({ id: adminUser.id })}`
      }
    });

    // پاک کردن داده‌های تست
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.user.deleteMany({ 
      where: { id: { in: [adminUser.id, regularUser.id] } } 
    });

    if (adminResponse.ok) {
      return {
        name: 'دسترسی کامل Admin',
        passed: true,
        message: 'Admin به درستی به همه منابع دسترسی دارد',
        details: { status: adminResponse.status }
      };
    }

    return {
      name: 'خطا در دسترسی Admin',
      passed: false,
      message: 'Admin نتوانست به منابع دسترسی پیدا کند',
      details: { status: adminResponse.status }
    };
  } catch (error) {
    return {
      name: 'خطا در تست دسترسی Admin',
      passed: false,
      message: error.message,
      details: error
    };
  }
}

export async function runResourceAccessTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('\n📁 شروع تست‌های دسترسی به منابع...\n');

  // تست 1: فیلتر پروژه‌ها
  console.log('📝 تست 1: بررسی فیلتر پروژه‌ها بر اساس دسترسی...');
  results.push(await testProjectListFiltering());

  // تست 2: سطوح دسترسی پروژه
  console.log('📝 تست 2: بررسی سطوح دسترسی پروژه...');
  results.push(await testProjectAccessLevels());

  // تست 3: دسترسی‌های پوشه
  console.log('📝 تست 3: بررسی دسترسی‌های پوشه...');
  results.push(await testFolderPermissions());

  // تست 4: دسترسی به اسناد
  console.log('📝 تست 4: بررسی دسترسی به اسناد...');
  results.push(await testDocumentAccess());

  // تست 5: دسترسی کامل Admin
  console.log('📝 تست 5: بررسی دسترسی کامل Admin...');
  results.push(await testAdminFullAccess());

  return results;
}

