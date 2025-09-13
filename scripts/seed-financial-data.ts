import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function seedFinancialData() {
  try {
    console.log("🌱 شروع ایجاد داده‌های نمونه مالی...");

    // Get existing users and projects
    const users = await prisma.user.findMany();
    const projects = await prisma.project.findMany();

    if (users.length === 0 || projects.length === 0) {
      console.log("❌ ابتدا کاربران و پروژه‌ها را ایجاد کنید");
      return;
    }

    const adminUser = users.find(u => u.role === "ADMIN");
    const regularUser = users.find(u => u.role === "BUYER");
    const project = projects[0];

    if (!adminUser || !regularUser || !project) {
      console.log("❌ کاربر ادمین، کاربر عادی یا پروژه یافت نشد");
      return;
    }

    // Create units for the project
    const unit1 = await prisma.unit.create({
      data: {
        projectId: project.id,
        userId: regularUser.id,
        unitNumber: "A-101",
        area: 85.5
      }
    });

    const unit2 = await prisma.unit.create({
      data: {
        projectId: project.id,
        userId: adminUser.id,
        unitNumber: "A-102",
        area: 95.0
      }
    });

    console.log("✅ واحدها ایجاد شدند");

    // Create installment definitions
    const installment1 = await prisma.installmentDefinition.create({
      data: {
        projectId: project.id,
        title: "پروانه ساختمان",
        dueDate: new Date("2024-01-15"),
        amount: 100000000 // 100 میلیون ریال
      }
    });

    const installment2 = await prisma.installmentDefinition.create({
      data: {
        projectId: project.id,
        title: "تأسیسات مکانیکی",
        dueDate: new Date("2024-03-15"),
        amount: 50000000 // 50 میلیون ریال
      }
    });

    const installment3 = await prisma.installmentDefinition.create({
      data: {
        projectId: project.id,
        title: "نازک‌کاری",
        dueDate: new Date("2024-06-15"),
        amount: 80000000 // 80 میلیون ریال
      }
    });

    console.log("✅ تعریف اقساط ایجاد شدند");

    // Calculate total area for share calculation
    const totalArea = unit1.area + unit2.area;

    // Create user installments
    const userInstallments = [];

    // Unit 1 installments
    userInstallments.push(
      await prisma.userInstallment.create({
        data: {
          userId: unit1.userId,
          unitId: unit1.id,
          installmentDefinitionId: installment1.id,
          shareAmount: (installment1.amount * unit1.area) / totalArea
        }
      }),
      await prisma.userInstallment.create({
        data: {
          userId: unit1.userId,
          unitId: unit1.id,
          installmentDefinitionId: installment2.id,
          shareAmount: (installment2.amount * unit1.area) / totalArea
        }
      }),
      await prisma.userInstallment.create({
        data: {
          userId: unit1.userId,
          unitId: unit1.id,
          installmentDefinitionId: installment3.id,
          shareAmount: (installment3.amount * unit1.area) / totalArea
        }
      })
    );

    // Unit 2 installments
    userInstallments.push(
      await prisma.userInstallment.create({
        data: {
          userId: unit2.userId,
          unitId: unit2.id,
          installmentDefinitionId: installment1.id,
          shareAmount: (installment1.amount * unit2.area) / totalArea
        }
      }),
      await prisma.userInstallment.create({
        data: {
          userId: unit2.userId,
          unitId: unit2.id,
          installmentDefinitionId: installment2.id,
          shareAmount: (installment2.amount * unit2.area) / totalArea
        }
      }),
      await prisma.userInstallment.create({
        data: {
          userId: unit2.userId,
          unitId: unit2.id,
          installmentDefinitionId: installment3.id,
          shareAmount: (installment3.amount * unit2.area) / totalArea
        }
      })
    );

    console.log("✅ اقساط کاربران ایجاد شدند");

    // Create some sample payments
    const payment1 = await prisma.payment.create({
      data: {
        userInstallmentId: userInstallments[0].id, // First installment of unit 1
        paymentDate: new Date("2024-01-10"),
        amount: 40000000, // Partial payment
        description: "پرداخت بخشی از قسط پروانه ساختمان"
      }
    });

    const payment2 = await prisma.payment.create({
      data: {
        userInstallmentId: userInstallments[0].id, // First installment of unit 1
        paymentDate: new Date("2024-01-20"),
        amount: 7000000, // Complete the first installment
        description: "تکمیل پرداخت قسط پروانه ساختمان"
      }
    });

    const payment3 = await prisma.payment.create({
      data: {
        userInstallmentId: userInstallments[1].id, // Second installment of unit 1
        paymentDate: new Date("2024-03-10"),
        amount: 20000000, // Partial payment
        description: "پرداخت بخشی از قسط تأسیسات مکانیکی"
      }
    });

    console.log("✅ پرداخت‌های نمونه ایجاد شدند");

    // Update installment statuses
    await prisma.userInstallment.update({
      where: { id: userInstallments[0].id },
      data: { status: "PAID" }
    });

    await prisma.userInstallment.update({
      where: { id: userInstallments[1].id },
      data: { status: "PARTIAL" }
    });

    // Create a penalty for overdue installment
    const penalty = await prisma.penalty.create({
      data: {
        userInstallmentId: userInstallments[2].id, // Third installment (overdue)
        daysLate: 45,
        dailyRate: 0.1, // 0.1% per day
        totalPenalty: 1500000 // Sample penalty amount
      }
    });

    console.log("✅ جریمه نمونه ایجاد شد");

    console.log("🎉 داده‌های نمونه مالی با موفقیت ایجاد شدند!");
    console.log("\n📊 خلاصه داده‌های ایجاد شده:");
    console.log(`- ${userInstallments.length} قسط کاربر`);
    console.log(`- ${3} پرداخت نمونه`);
    console.log(`- ${1} جریمه نمونه`);
    console.log(`- ${2} واحد در پروژه ${project.name}`);

  } catch (error) {
    console.error("❌ خطا در ایجاد داده‌های نمونه:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFinancialData();
