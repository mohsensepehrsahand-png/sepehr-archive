import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log("🔐 ایجاد کاربر نمونه...");

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    });

    if (existingAdmin) {
      console.log("✅ کاربر ادمین از قبل وجود دارد:");
      console.log(`   نام کاربری: ${existingAdmin.username}`);
      console.log(`   نقش: ${existingAdmin.role}`);
      console.log(`   نام: ${existingAdmin.firstName} ${existingAdmin.lastName}`);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("123456", 10);
    
    const adminUser = await prisma.user.create({
      data: {
        username: "admin",
        passwordHash: hashedPassword,
        firstName: "مدیر",
        lastName: "سیستم",
        email: "admin@example.com",
        role: "ADMIN",
        isActive: true
      }
    });

    console.log("✅ کاربر ادمین ایجاد شد:");
    console.log(`   نام کاربری: ${adminUser.username}`);
    console.log(`   رمز عبور: 123456`);
    console.log(`   نقش: ${adminUser.role}`);

    // Create a regular user
    const regularUser = await prisma.user.create({
      data: {
        username: "user1",
        passwordHash: hashedPassword,
        firstName: "کاربر",
        lastName: "نمونه",
        email: "user1@example.com",
        role: "BUYER",
        isActive: true
      }
    });

    console.log("✅ کاربر عادی ایجاد شد:");
    console.log(`   نام کاربری: ${regularUser.username}`);
    console.log(`   رمز عبور: 123456`);
    console.log(`   نقش: ${regularUser.role}`);

    console.log("\n🎉 کاربران نمونه با موفقیت ایجاد شدند!");
    console.log("\n📝 اطلاعات ورود:");
    console.log("   ادمین: admin / 123456");
    console.log("   کاربر: user1 / 123456");

  } catch (error) {
    console.error("❌ خطا در ایجاد کاربر نمونه:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
