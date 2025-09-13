import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function testFinanceAPI() {
  try {
    console.log("🧪 تست API مالی...");

    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    });

    if (!adminUser) {
      console.log("❌ کاربر ادمین یافت نشد");
      return;
    }

    console.log(`✅ کاربر ادمین: ${adminUser.username}`);

    // Test projects API
    console.log("\n📊 تست API پروژه‌ها...");
    
    const projects = await prisma.project.findMany({
      where: {
        status: "ACTIVE"
      },
      include: {
        units: {
          include: {
            userInstallments: {
              include: {
                payments: true,
                penalties: true
              }
            }
          }
        },
        installmentDefinitions: true
      }
    });

    console.log(`✅ ${projects.length} پروژه یافت شد`);

    if (projects.length > 0) {
      const project = projects[0];
      console.log(`\n📋 پروژه اول: ${project.name}`);
      
      const allUserInstallments = project.units.flatMap(unit => unit.userInstallments);
      const totalInstallments = project.installmentDefinitions.length;
      const totalAmount = allUserInstallments.reduce((sum, installment) => sum + installment.shareAmount, 0);
      const paidAmount = allUserInstallments.reduce((sum, installment) => 
        sum + installment.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0), 0
      );
      const remainingAmount = totalAmount - paidAmount;

      console.log(`   - تعداد واحدها: ${project.units.length}`);
      console.log(`   - تعداد اقساط: ${totalInstallments}`);
      console.log(`   - مجموع اقساط: ${totalAmount.toLocaleString()} ریال`);
      console.log(`   - پرداخت شده: ${paidAmount.toLocaleString()} ریال`);
      console.log(`   - مانده: ${remainingAmount.toLocaleString()} ریال`);
    }

    // Test financial data
    console.log("\n💰 تست داده‌های مالی...");
    
    const units = await prisma.unit.findMany({
      include: {
        user: true,
        project: true,
        userInstallments: {
          include: {
            installmentDefinition: true,
            payments: true,
            penalties: true
          }
        }
      }
    });

    console.log(`✅ ${units.length} واحد یافت شد`);

    const installments = await prisma.userInstallment.findMany({
      include: {
        installmentDefinition: true,
        payments: true,
        penalties: true,
        user: true,
        unit: true
      }
    });

    console.log(`✅ ${installments.length} قسط کاربر یافت شد`);

    const payments = await prisma.payment.findMany();
    console.log(`✅ ${payments.length} پرداخت یافت شد`);

    const penalties = await prisma.penalty.findMany();
    console.log(`✅ ${penalties.length} جریمه یافت شد`);

    console.log("\n🎉 تست API مالی موفقیت‌آمیز بود!");

  } catch (error) {
    console.error("❌ خطا در تست API مالی:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testFinanceAPI();
