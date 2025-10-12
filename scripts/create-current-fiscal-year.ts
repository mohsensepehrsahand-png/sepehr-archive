import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createCurrentFiscalYear() {
  try {
    console.log('🔍 جستجوی پروژه‌هایی که سال مالی جاری ندارند...');

    // Get current year
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    console.log(`📅 سال مالی جاری: ${currentYear}`);
    console.log(`📅 تاریخ شروع: ${startDate.toISOString().split('T')[0]}`);
    console.log(`📅 تاریخ پایان: ${endDate.toISOString().split('T')[0]}`);

    // Get all projects
    const projects = await prisma.project.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true
      }
    });

    console.log(`📊 تعداد پروژه‌های فعال: ${projects.length}`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const project of projects) {
      console.log(`\n🔍 بررسی پروژه: ${project.name}`);

      // Check if current fiscal year already exists
      const existingFiscalYear = await prisma.fiscalYear.findFirst({
        where: {
          projectId: project.id,
          year: currentYear
        }
      });

      if (existingFiscalYear) {
        console.log(`✅ سال مالی ${currentYear} قبلاً وجود دارد`);
        skippedCount++;
        continue;
      }

      try {
        // Create current fiscal year
        const fiscalYear = await prisma.fiscalYear.create({
          data: {
            projectId: project.id,
            year: currentYear,
            startDate,
            endDate,
            description: `سال مالی ${currentYear}`,
            isActive: true,
            isClosed: false
          }
        });

        console.log(`✅ سال مالی ${currentYear} ایجاد شد (ID: ${fiscalYear.id})`);

        // Link existing accounts without fiscal year to this new fiscal year
        const linkedAccounts = await prisma.account.updateMany({
          where: {
            projectId: project.id,
            fiscalYearId: null
          },
          data: {
            fiscalYearId: fiscalYear.id
          }
        });

        if (linkedAccounts.count > 0) {
          console.log(`🔗 ${linkedAccounts.count} حساب به سال مالی جدید متصل شد`);
        }

        // Link existing account groups without fiscal year to this new fiscal year
        const linkedAccountGroups = await prisma.accountGroup.updateMany({
          where: {
            projectId: project.id,
            fiscalYearId: null
          },
          data: {
            fiscalYearId: fiscalYear.id
          }
        });

        if (linkedAccountGroups.count > 0) {
          console.log(`🔗 ${linkedAccountGroups.count} گروه حساب به سال مالی جدید متصل شد`);
        }

        // Link existing account classes without fiscal year to this new fiscal year
        const linkedAccountClasses = await prisma.accountClass.updateMany({
          where: {
            projectId: project.id,
            fiscalYearId: null
          },
          data: {
            fiscalYearId: fiscalYear.id
          }
        });

        if (linkedAccountClasses.count > 0) {
          console.log(`🔗 ${linkedAccountClasses.count} کلاس حساب به سال مالی جدید متصل شد`);
        }

        // Link existing account sub-classes without fiscal year to this new fiscal year
        const linkedAccountSubClasses = await prisma.accountSubClass.updateMany({
          where: {
            projectId: project.id,
            fiscalYearId: null
          },
          data: {
            fiscalYearId: fiscalYear.id
          }
        });

        if (linkedAccountSubClasses.count > 0) {
          console.log(`🔗 ${linkedAccountSubClasses.count} زیرکلاس حساب به سال مالی جدید متصل شد`);
        }

        // Link existing account details without fiscal year to this new fiscal year
        const linkedAccountDetails = await prisma.accountDetail.updateMany({
          where: {
            projectId: project.id,
            fiscalYearId: null
          },
          data: {
            fiscalYearId: fiscalYear.id
          }
        });

        if (linkedAccountDetails.count > 0) {
          console.log(`🔗 ${linkedAccountDetails.count} جزئیات حساب به سال مالی جدید متصل شد`);
        }

        createdCount++;
      } catch (error) {
        console.error(`❌ خطا در ایجاد سال مالی برای پروژه ${project.name}:`, error);
      }
    }

    console.log(`\n📊 خلاصه نتایج:`);
    console.log(`✅ سال مالی ایجاد شده: ${createdCount}`);
    console.log(`⏭️ سال مالی قبلاً موجود: ${skippedCount}`);
    console.log(`📊 کل پروژه‌ها: ${projects.length}`);

    if (createdCount > 0) {
      console.log(`\n🎉 عملیات با موفقیت تکمیل شد! ${createdCount} سال مالی جدید ایجاد شد.`);
      console.log(`💡 حالا می‌توانید به بخش حسابداری پروژه‌ها دسترسی پیدا کنید.`);
    } else {
      console.log(`\n✅ تمام پروژه‌ها قبلاً سال مالی جاری دارند.`);
    }

  } catch (error) {
    console.error('❌ خطا در اجرای اسکریپت:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createCurrentFiscalYear();