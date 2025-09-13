import { prisma } from '../src/app/api/_lib/db';

async function testUsersApi() {
  try {
    console.log('🧪 تست API کاربران پروژه...\n');

    const projectId = 'cmfa8ni2j0002udcopddkg947'; // پروژه موجود

    // 1. تست query مستقیم
    console.log('📋 تست query مستقیم...');
    const projectUsers = await prisma.user.findMany({
      where: {
        role: {
          not: 'ADMIN'
        },
        units: {
          some: {
            projectId: projectId
          }
        }
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        units: {
          where: { projectId },
          select: {
            id: true,
            unitNumber: true,
            area: true
          }
        }
      }
    });

    console.log(`✅ ${projectUsers.length} کاربر یافت شد:`);
    projectUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.username})`);
      console.log(`      واحدها: ${user.units.map(unit => unit.unitNumber).join(', ')}`);
    });

    // 2. تست query ساده‌تر
    console.log('\n📋 تست query ساده‌تر...');
    const simpleUsers = await prisma.user.findMany({
      where: {
        role: {
          not: 'ADMIN'
        },
        units: {
          some: {
            projectId: projectId
          }
        }
      },
      include: {
        units: {
          where: { projectId }
        }
      }
    });

    console.log(`✅ ${simpleUsers.length} کاربر یافت شد:`);
    simpleUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.username})`);
      console.log(`      واحدها: ${user.units.map(unit => unit.unitNumber).join(', ')}`);
    });

    // 3. بررسی پروژه
    console.log('\n📋 بررسی پروژه...');
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        units: {
          include: {
            user: true
          }
        }
      }
    });

    if (project) {
      console.log(`   نام پروژه: ${project.name}`);
      console.log(`   تعداد واحدها: ${project.units.length}`);
      console.log(`   کاربران پروژه:`);
      project.units.forEach((unit, index) => {
        console.log(`     ${index + 1}. ${unit.user.firstName} ${unit.user.lastName} - واحد ${unit.unitNumber}`);
      });
    } else {
      console.log('   پروژه یافت نشد');
    }

  } catch (error) {
    console.error('❌ خطا در تست:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUsersApi();
