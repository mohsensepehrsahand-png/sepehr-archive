import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function fixInstallmentStatuses() {
  console.log("🔧 شروع به‌روزرسانی وضعیت اقساط...");

  try {
    // Get all user installments
    const installments = await prisma.userInstallment.findMany({
      include: {
        payments: true,
        installmentDefinition: true
      }
    });

    console.log(`📊 یافت شد ${installments.length} قسط`);

    let updatedCount = 0;

    for (const installment of installments) {
      // Calculate total paid amount
      const totalPaidAmount = installment.payments.reduce((sum, p) => sum + p.amount, 0);
      
      // Determine new status
      let newStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' = 'PENDING';
      
      if (totalPaidAmount >= installment.shareAmount) {
        newStatus = 'PAID';
      } else if (totalPaidAmount > 0) {
        newStatus = 'PARTIAL';
      } else {
        // Check if overdue
        const dueDate = installment.isCustomized && installment.dueDate 
          ? installment.dueDate 
          : installment.installmentDefinition?.dueDate;
        
        if (dueDate && new Date() > new Date(dueDate)) {
          newStatus = 'OVERDUE';
        }
      }

      // Update if status changed
      if (installment.status !== newStatus) {
        await prisma.userInstallment.update({
          where: { id: installment.id },
          data: { status: newStatus }
        });
        
        console.log(`✅ قسط ${installment.id}: ${installment.status} → ${newStatus} (پرداخت: ${totalPaidAmount}/${installment.shareAmount})`);
        updatedCount++;
      }
    }

    console.log(`🎉 به‌روزرسانی کامل شد! ${updatedCount} قسط به‌روزرسانی شد.`);

  } catch (error) {
    console.error("❌ خطا در به‌روزرسانی وضعیت اقساط:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixInstallmentStatuses();
