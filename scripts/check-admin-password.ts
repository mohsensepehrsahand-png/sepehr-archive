import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function checkAdminPassword() {
  try {
    console.log("🔍 بررسی رمز عبور کاربر ادمین...");

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        role: true
      }
    });

    if (!adminUser) {
      console.log("❌ کاربر ادمین یافت نشد");
      return;
    }

    console.log(`✅ کاربر ادمین یافت شد: ${adminUser.username}`);
    console.log(`   Hash: ${adminUser.passwordHash}`);

    // Test password "123456"
    const testPassword = "123456";
    const isValid = await bcrypt.compare(testPassword, adminUser.passwordHash);
    
    console.log(`\n🔐 تست رمز عبور "${testPassword}": ${isValid ? "✅ معتبر" : "❌ نامعتبر"}`);

    if (!isValid) {
      console.log("\n🔄 به‌روزرسانی رمز عبور...");
      const newHash = await bcrypt.hash(testPassword, 10);
      
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { passwordHash: newHash }
      });
      
      console.log("✅ رمز عبور به‌روزرسانی شد");
    }

  } catch (error) {
    console.error("❌ خطا:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminPassword();
