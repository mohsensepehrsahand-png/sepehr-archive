import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getCurrentUser } from "@/app/api/_lib/db";
import { FinancialCalculator } from "@/lib/financialCalculations";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ installmentId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { installmentId } = await params;
    const body = await request.json();
    const { shareAmount, paidAmount, installmentDefinitionId, title, dueDate, paymentDate } = body;
    
    console.log('📝 PUT /api/finance/user-installments/' + installmentId);
    console.log('📦 Request body:', { shareAmount, paidAmount, installmentDefinitionId, title, dueDate, paymentDate });

    // Check if installment exists
    const existingInstallment = await prisma.userInstallment.findUnique({
      where: { id: installmentId },
      include: {
        installmentDefinition: true
      }
    });

    if (!existingInstallment) {
      return NextResponse.json({ error: "قسط یافت نشد" }, { status: 404 });
    }

    // Check if this is the first customization of this installment
    const isFirstCustomization = !existingInstallment.isCustomized;
    
    // Any change to the installment should make it customized and independent
    const hasAnyChanges = title || dueDate || shareAmount;
    
    console.log('🔍 Installment customization check:');
    console.log('- isFirstCustomization:', isFirstCustomization);
    console.log('- hasAnyChanges:', hasAnyChanges);
    console.log('- title:', title);
    console.log('- dueDate:', dueDate);
    console.log('- shareAmount:', shareAmount);
    
    if (isFirstCustomization && hasAnyChanges) {
      // Mark as customized, store custom values, and make it independent
      console.log('🔄 قسط در حال شخصی‌سازی شدن... (isCustomized: false → true)');
      
      await prisma.userInstallment.update({
        where: { id: installmentId },
        data: {
          isCustomized: true,
          title: title || existingInstallment.installmentDefinition?.title || '',
          dueDate: dueDate ? new Date(dueDate) : existingInstallment.installmentDefinition?.dueDate || null,
          installmentDefinitionId: null, // Make it independent
          order: existingInstallment.installmentDefinition?.order || 0
        }
      });

      console.log('✅ قسط با موفقیت شخصی‌سازی شد! (isCustomized: true)');
    } else if (existingInstallment.isCustomized && (title || dueDate || shareAmount)) {
      // Update custom values for already customized installment
      console.log('🔄 قسط قبلاً شخصی‌سازی شده - در حال به‌روزرسانی...');
      
      await prisma.userInstallment.update({
        where: { id: installmentId },
        data: {
          ...(title && { title }),
          ...(dueDate && { dueDate: new Date(dueDate) }),
          ...(shareAmount && { shareAmount: parseFloat(shareAmount) })
        }
      });

      console.log('✅ قسط شخصی‌سازی شده با موفقیت به‌روزرسانی شد!');
    } else {
      console.log('ℹ️ هیچ تغییری در قسط اعمال نشد - قسط همچنان پیش‌فرض باقی ماند (isCustomized: false)');
    }

    // Update installment
    const updateData: any = {};
    if (shareAmount) {
      updateData.shareAmount = parseFloat(shareAmount);
    }
    if (installmentDefinitionId !== undefined) {
      updateData.installmentDefinitionId = installmentDefinitionId || null;
    }

    const updatedInstallment = await prisma.userInstallment.update({
      where: { id: installmentId },
      data: updateData,
      include: {
        installmentDefinition: true,
        payments: true
      }
    });

    // Handle payment update
    console.log('Payment update check:', { paidAmount, paymentDate });
    
    if (paidAmount !== undefined && paymentDate) {
      // Only count payments without receipt (actual installment payments)
      const currentPaidAmount = updatedInstallment.payments.reduce((sum, p) => {
        return sum + (p.amount > 0 && !p.receiptImagePath ? p.amount : 0);
      }, 0);
      const difference = parseFloat(paidAmount) - currentPaidAmount;
      
      console.log('Payment calculation:', { currentPaidAmount, paidAmount, difference });

      if (difference > 0) {
        // Add payment
        await prisma.payment.create({
          data: {
            userInstallmentId: installmentId,
            paymentDate: new Date(paymentDate),
            amount: difference,
            description: "ویرایش قسط"
          }
        });
      } else if (difference < 0) {
        // Remove or reduce payments
        const sortedPayments = updatedInstallment.payments.sort((a, b) => 
          new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
        );

        let remainingToRemove = Math.abs(difference);
        for (const payment of sortedPayments) {
          if (remainingToRemove <= 0) break;
          
          if (payment.amount <= remainingToRemove) {
            await prisma.payment.delete({ where: { id: payment.id } });
            remainingToRemove -= payment.amount;
          } else {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { amount: payment.amount - remainingToRemove }
            });
            break;
          }
        }
      } else if (difference === 0) {
        // Amount didn't change, but maybe payment date changed
        // Update the latest payment date
        const latestPayment = updatedInstallment.payments
          .filter(p => !p.receiptImagePath) // Only update non-receipt payments
          .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];
        
        if (latestPayment) {
          console.log('Updating payment date for payment:', latestPayment.id, 'from', latestPayment.paymentDate, 'to', paymentDate);
          await prisma.payment.update({
            where: { id: latestPayment.id },
            data: { paymentDate: new Date(paymentDate) }
          });
        } else if (parseFloat(paidAmount) > 0) {
          // No payment exists but paidAmount > 0, create a new payment
          console.log('Creating new payment with amount:', paidAmount, 'and date:', paymentDate);
          await prisma.payment.create({
            data: {
              userInstallmentId: installmentId,
              paymentDate: new Date(paymentDate),
              amount: parseFloat(paidAmount),
              description: "ویرایش قسط"
            }
          });
        }
      }
    } else if (paymentDate && paidAmount === undefined) {
      // Only payment date changed, update the latest payment date
      const latestPayment = updatedInstallment.payments
        .filter(p => !p.receiptImagePath) // Only update non-receipt payments
        .sort((a, b) => 
          new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
        )[0];
      
      if (latestPayment) {
        console.log('Updating payment date for payment:', latestPayment.id, 'from', latestPayment.paymentDate, 'to', paymentDate);
        await prisma.payment.update({
          where: { id: latestPayment.id },
          data: { paymentDate: new Date(paymentDate) }
        });
      }
    } else if (paymentDate && paidAmount !== undefined && parseFloat(paidAmount) > 0) {
      // Payment date is provided but no current payment exists
      // Create a new payment
      const currentPaidAmount = updatedInstallment.payments.reduce((sum, p) => {
        return sum + (p.amount > 0 && !p.receiptImagePath ? p.amount : 0);
      }, 0);
      
      if (currentPaidAmount === 0) {
        console.log('Creating new payment with amount:', paidAmount, 'and date:', paymentDate);
        await prisma.payment.create({
          data: {
            userInstallmentId: installmentId,
            paymentDate: new Date(paymentDate),
            amount: parseFloat(paidAmount),
            description: "ویرایش قسط"
          }
        });
      }
    }

    // Recalculate installment status after payment updates
    const finalInstallment = await prisma.userInstallment.findUnique({
      where: { id: installmentId },
      include: {
        installmentDefinition: true,
        payments: true
      }
    });

    if (finalInstallment) {
      // Calculate new status - only count payments without receipt
      const totalPaidAmount = finalInstallment.payments.reduce((sum, p) => sum + (p.amount > 0 && !p.receiptImagePath ? p.amount : 0), 0);
      const dueDate = finalInstallment.isCustomized && finalInstallment.dueDate ? finalInstallment.dueDate : finalInstallment.installmentDefinition?.dueDate;
      
      const newStatus = dueDate ? FinancialCalculator.calculateInstallmentStatus(
        finalInstallment.shareAmount,
        totalPaidAmount,
        new Date(dueDate)
      ) : 'PENDING';

      // Update installment status
      await prisma.userInstallment.update({
        where: { id: installmentId },
        data: { status: newStatus }
      });

      // Update final installment with new status
      finalInstallment.status = newStatus;
    }

    // Determine the status message based on what happened
    let statusMessage = "قسط با موفقیت به‌روزرسانی شد";
    let consoleMessage = "";

    if (isFirstCustomization && hasAnyChanges) {
      statusMessage = "قسط با موفقیت شخصی‌سازی شد! (isCustomized: false → true)";
      consoleMessage = "🔄 قسط در حال شخصی‌سازی شدن... (isCustomized: false → true)";
    } else if (existingInstallment.isCustomized && (title || dueDate || shareAmount)) {
      statusMessage = "قسط شخصی‌سازی شده با موفقیت به‌روزرسانی شد!";
      consoleMessage = "🔄 قسط قبلاً شخصی‌سازی شده - در حال به‌روزرسانی...";
    } else {
      statusMessage = "هیچ تغییری در قسط اعمال نشد - قسط همچنان پیش‌فرض باقی ماند (isCustomized: false)";
      consoleMessage = "ℹ️ هیچ تغییری در قسط اعمال نشد - قسط همچنان پیش‌فرض باقی ماند (isCustomized: false)";
    }

    return NextResponse.json({
      message: statusMessage,
      consoleMessage: consoleMessage,
      installment: finalInstallment || updatedInstallment,
      wasCustomized: isFirstCustomization && hasAnyChanges,
      isCustomized: finalInstallment?.isCustomized || updatedInstallment.isCustomized
    });
  } catch (error) {
    console.error("Error updating user installment:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی قسط" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ installmentId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { installmentId } = await params;
    console.log("Attempting to delete installment:", installmentId);

    // Check if installment exists
    const existingInstallment = await prisma.userInstallment.findUnique({
      where: { id: installmentId },
      include: {
        payments: true,
        penalties: true
      }
    });

    if (!existingInstallment) {
      console.log("Installment not found:", installmentId);
      return NextResponse.json({ error: "قسط یافت نشد" }, { status: 404 });
    }

    console.log("Found installment with", existingInstallment.payments.length, "payments and", existingInstallment.penalties.length, "penalties");

    // Delete installment (cascade delete will handle payments and penalties)
    await prisma.userInstallment.delete({
      where: { id: installmentId }
    });

    console.log("Successfully deleted installment:", installmentId);

    return NextResponse.json({
      message: "قسط با موفقیت حذف شد",
      deletedPayments: existingInstallment.payments.length,
      deletedPenalties: existingInstallment.penalties.length
    });
  } catch (error) {
    console.error("Error deleting user installment:", error);
    return NextResponse.json(
      { 
        error: "خطا در حذف قسط", 
        details: error instanceof Error ? error.message : 'خطای نامشخص',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}