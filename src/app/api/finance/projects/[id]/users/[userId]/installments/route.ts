import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/api/_lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, userId } = await params;

    // Check access permissions
    if (user.role !== "ADMIN" && user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if project exists
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        status: "ACTIVE"
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    // Get user penalty settings
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        penaltyGraceDays: true
      }
    });

    const penaltyGraceDays = targetUser?.penaltyGraceDays || 0;

    // Get user installments for this project
    const userInstallments = await prisma.userInstallment.findMany({
      where: {
        userId: userId,
        unit: {
          projectId: projectId
        }
      },
      include: {
        installmentDefinition: true,
        payments: true
      },
      orderBy: [
        {
          installmentDefinition: {
            order: 'asc'
          }
        },
        {
          createdAt: 'asc'
        }
      ]
    });


    // Transform data for frontend
    const transformedInstallments = userInstallments.map((installment, index) => {
      // Calculate paid amount (only count payments without receipt, not receipt links)
      const paidAmount = installment.payments.reduce((sum, payment) => {
        // Only add amount if it's a real payment without receipt (not a receipt link)
        return sum + (payment.amount > 0 && !payment.receiptImagePath ? payment.amount : 0);
      }, 0);
      const remainingAmount = installment.shareAmount - paidAmount;
      const isPaid = paidAmount >= installment.shareAmount;
      const isPartiallyPaid = paidAmount > 0 && paidAmount < installment.shareAmount;
      
      // Get the latest payment date
      const latestPayment = installment.payments
        .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];
      const paymentDate = latestPayment ? latestPayment.paymentDate : null;

      // Calculate daily delay
      let dailyDelay = 0;
      
      // Check if installmentDefinition exists and has dueDate
      if (installment.installmentDefinition?.dueDate) {
        const dueDate = new Date(installment.installmentDefinition.dueDate);
        
        if (paymentDate) {
          // For paid installments, calculate delay based on payment date
          const paymentDateObj = new Date(paymentDate);
          const daysDifference = Math.ceil((paymentDateObj.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDifference > penaltyGraceDays) {
            dailyDelay = daysDifference - penaltyGraceDays;
          }
        } else {
          // For unpaid installments, calculate delay based on current date
          // Only if the due date has passed
          const currentDate = new Date();
          if (currentDate > dueDate) {
            const daysDifference = Math.ceil((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            
            
            if (daysDifference > penaltyGraceDays) {
              dailyDelay = daysDifference - penaltyGraceDays;
            }
          }
        }
      } else if (installment.dueDate) {
        // For custom installments with their own dueDate
        const dueDate = new Date(installment.dueDate);
        
        if (paymentDate) {
          // For paid installments, calculate delay based on payment date
          const paymentDateObj = new Date(paymentDate);
          const daysDifference = Math.ceil((paymentDateObj.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDifference > penaltyGraceDays) {
            dailyDelay = daysDifference - penaltyGraceDays;
          }
        } else {
          // For unpaid installments, calculate delay based on current date
          // Only if the due date has passed
          const currentDate = new Date();
          if (currentDate > dueDate) {
            const daysDifference = Math.ceil((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            
            
            if (daysDifference > penaltyGraceDays) {
              dailyDelay = daysDifference - penaltyGraceDays;
            }
          }
        }
      }


      // Get all payments with receipt images
      const paymentsWithReceipts = installment.payments
        .filter(payment => payment.receiptImagePath)
        .map(payment => ({
          id: payment.id,
          amount: payment.amount,
          paymentDate: payment.paymentDate,
          description: payment.description,
          receiptImagePath: payment.receiptImagePath
        }));

      // Determine status in Persian
      let status = "در انتظار پرداخت";
      if (isPaid) {
        // Check if payment was delayed
        if (paymentDate && installment.installmentDefinition?.dueDate) {
          const dueDate = new Date(installment.installmentDefinition.dueDate);
          const paymentDateObj = new Date(paymentDate);
          const daysDifference = Math.ceil((paymentDateObj.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDifference > penaltyGraceDays) {
            status = "پرداخت با تاخیر";
          } else {
            status = "پرداخت شده";
          }
        } else {
          status = "پرداخت شده";
        }
      } else if (isPartiallyPaid) {
        status = "بخشی پرداخت شده";
      } else {
        // Check if overdue
        if (installment.installmentDefinition?.dueDate) {
          const dueDate = new Date(installment.installmentDefinition.dueDate);
          if (new Date() > dueDate) {
            status = "معوق";
          }
        }
      }

      return {
        id: installment.id,
        title: installment.installmentDefinition?.title || `قسط ${index + 1}`,
        dueDate: installment.installmentDefinition?.dueDate || new Date().toISOString(),
        shareAmount: installment.shareAmount,
        paidAmount,
        remainingAmount,
        status,
        order: index + 1,
        paymentDate,
        dailyDelay,
        payments: paymentsWithReceipts,
        receipts: paymentsWithReceipts // Also include as receipts for backward compatibility
      };
    });

    return NextResponse.json(transformedInstallments);
  } catch (error) {
    console.error("Error fetching user installments:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اقساط کاربر" },
      { status: 500 }
    );
  }
}
