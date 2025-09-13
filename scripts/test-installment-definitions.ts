import { prisma } from '../src/app/api/_lib/db';

async function testInstallmentDefinitions() {
  try {
    console.log('🧪 تست سیستم مدیریت انواع قسط...\n');

    // 1. دریافت پروژه‌های موجود
    const projects = await prisma.project.findMany({
      take: 1,
      include: {
        installmentDefinitions: true
      }
    });

    if (projects.length === 0) {
      console.log('❌ هیچ پروژه‌ای یافت نشد. ابتدا یک پروژه ایجاد کنید.');
      return;
    }

    const project = projects[0];
    console.log(`📋 پروژه: ${project.name}`);
    console.log(`   تعداد انواع قسط موجود: ${project.installmentDefinitions.length}\n`);

    // 2. ایجاد نوع قسط جدید
    console.log('➕ ایجاد نوع قسط جدید...');
    const newDefinition = await prisma.installmentDefinition.create({
      data: {
        projectId: project.id,
        title: 'تست قسط - ' + new Date().toLocaleTimeString('fa-IR'),
        dueDate: new Date('2024-12-31'),
        amount: 10000000
      }
    });

    console.log(`✅ نوع قسط ایجاد شد:`);
    console.log(`   شناسه: ${newDefinition.id}`);
    console.log(`   عنوان: ${newDefinition.title}`);
    console.log(`   تاریخ سررسید: ${newDefinition.dueDate.toLocaleDateString('fa-IR')}`);
    console.log(`   مبلغ: ${new Intl.NumberFormat('fa-IR').format(newDefinition.amount)} ریال\n`);

    // 3. ویرایش نوع قسط
    console.log('✏️ ویرایش نوع قسط...');
    const updatedDefinition = await prisma.installmentDefinition.update({
      where: { id: newDefinition.id },
      data: {
        title: 'تست قسط ویرایش شده',
        amount: 15000000
      }
    });

    console.log(`✅ نوع قسط ویرایش شد:`);
    console.log(`   عنوان جدید: ${updatedDefinition.title}`);
    console.log(`   مبلغ جدید: ${new Intl.NumberFormat('fa-IR').format(updatedDefinition.amount)} ریال\n`);

    // 4. دریافت تمام انواع قسط پروژه
    console.log('📋 دریافت تمام انواع قسط پروژه...');
    const allDefinitions = await prisma.installmentDefinition.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ ${allDefinitions.length} نوع قسط یافت شد:`);
    allDefinitions.forEach((def, index) => {
      console.log(`   ${index + 1}. ${def.title} - ${new Intl.NumberFormat('fa-IR').format(def.amount)} ریال`);
    });

    // 5. حذف نوع قسط تست
    console.log('\n🗑️ حذف نوع قسط تست...');
    await prisma.installmentDefinition.delete({
      where: { id: newDefinition.id }
    });

    console.log('✅ نوع قسط تست حذف شد\n');

    // 6. تست کاربران پروژه
    console.log('👥 تست مدیریت کاربران پروژه...');
    const projectUsers = await prisma.user.findMany({
      where: {
        units: {
          some: {
            projectId: project.id
          }
        }
      },
      include: {
        units: {
          where: { projectId: project.id }
        }
      }
    });

    console.log(`✅ ${projectUsers.length} کاربر در پروژه عضو هستند:`);
    projectUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.username})`);
      console.log(`      واحدها: ${user.units.map(unit => unit.unitNumber).join(', ')}`);
    });

    console.log('\n🎉 تمام تست‌ها با موفقیت انجام شد!');

  } catch (error) {
    console.error('❌ خطا در تست:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testInstallmentDefinitions();
