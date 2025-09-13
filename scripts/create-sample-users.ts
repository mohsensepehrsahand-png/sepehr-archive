import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createSampleUsers() {
  try {
    console.log("👥 ایجاد کاربران نمونه...");

    // Get existing project
    const project = await prisma.project.findFirst();
    if (!project) {
      console.log("❌ ابتدا پروژه‌ای ایجاد کنید");
      return;
    }

    console.log(`📋 استفاده از پروژه: ${project.name}`);

    // Create sample users
    const hashedPassword = await bcrypt.hash("123456", 10);
    
    const users = [
      {
        username: "ahmad",
        firstName: "احمد",
        lastName: "محمدی",
        email: "ahmad@example.com",
        role: "BUYER"
      },
      {
        username: "fatemeh",
        firstName: "فاطمه",
        lastName: "احمدی",
        email: "fatemeh@example.com",
        role: "BUYER"
      },
      {
        username: "ali",
        firstName: "علی",
        lastName: "رضایی",
        email: "ali@example.com",
        role: "BUYER"
      }
    ];

    for (const userData of users) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { username: userData.username }
      });

      if (existingUser) {
        console.log(`✅ کاربر ${userData.username} از قبل وجود دارد`);
        continue;
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          passwordHash: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          role: userData.role,
          isActive: true
        }
      });

      console.log(`✅ کاربر ${userData.username} ایجاد شد`);

      // Create unit for user
      const unitNumber = `A-${Math.floor(Math.random() * 100) + 200}`;
      const area = Math.floor(Math.random() * 50) + 80; // 80-130 متر

      const unit = await prisma.unit.create({
        data: {
          projectId: project.id,
          userId: user.id,
          unitNumber: unitNumber,
          area: area
        }
      });

      console.log(`   واحد ${unitNumber} (${area} متر) ایجاد شد`);

      // Get installment definitions
      const installments = await prisma.installmentDefinition.findMany({
        where: { projectId: project.id }
      });

      // Get total area for share calculation
      const totalArea = await prisma.unit.aggregate({
        where: { projectId: project.id },
        _sum: { area: true }
      });

      if (totalArea._sum.area && installments.length > 0) {
        // Create user installments
        for (const installment of installments) {
          const shareAmount = (installment.amount * area) / totalArea._sum.area;
          
          await prisma.userInstallment.create({
            data: {
              userId: user.id,
              unitId: unit.id,
              installmentDefinitionId: installment.id,
              shareAmount: shareAmount
            }
          });
        }
        console.log(`   ${installments.length} قسط ایجاد شد`);
      }
    }

    console.log("\n🎉 کاربران نمونه با موفقیت ایجاد شدند!");
    console.log("\n📝 اطلاعات ورود:");
    console.log("   احمد محمدی: ahmad / 123456");
    console.log("   فاطمه احمدی: fatemeh / 123456");
    console.log("   علی رضایی: ali / 123456");

  } catch (error) {
    console.error("❌ خطا در ایجاد کاربران نمونه:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleUsers();
