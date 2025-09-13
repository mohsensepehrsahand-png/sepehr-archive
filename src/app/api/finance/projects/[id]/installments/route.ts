import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/api/_lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.id;

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

    // Get user installments for this project
    const userInstallments = await prisma.userInstallment.findMany({
      where: {
        unit: {
          projectId: projectId
        },
        ...(user.role !== "ADMIN" ? {
          userId: user.id
        } : {})
      },
      include: {
        installmentDefinition: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        unit: {
          select: {
            id: true,
            unitNumber: true,
            area: true
          }
        },
        payments: true
      },
      orderBy: {
        installmentDefinition: {
          dueDate: 'asc'
        }
      }
    });

    // Transform data for frontend
    const transformedInstallments = userInstallments.map(installment => {
      // Only count payments without receipt (actual payments, not receipt links)
      const paidAmount = installment.payments.reduce((sum, payment) => {
        return sum + (payment.amount > 0 && !payment.receiptImagePath ? payment.amount : 0);
      }, 0);
      const remainingAmount = installment.shareAmount - paidAmount;

      return {
        id: installment.id,
        installmentDefinition: {
          title: installment.installmentDefinition.title
        },
        user: installment.user,
        unit: installment.unit,
        shareAmount: installment.shareAmount,
        paidAmount,
        remainingAmount
      };
    });

    return NextResponse.json(transformedInstallments);
  } catch (error) {
    console.error("Error fetching project installments:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اقساط پروژه" },
      { status: 500 }
    );
  }
}
