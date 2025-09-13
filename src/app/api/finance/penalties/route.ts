import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/api/_lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userInstallmentId, daysLate, dailyRate } = body;

    if (!userInstallmentId || !daysLate || !dailyRate) {
      return NextResponse.json(
        { error: "شناسه قسط، روزهای تأخیر و نرخ روزانه الزامی است" },
        { status: 400 }
      );
    }

    // Check if penalty already exists for this installment
    const existingPenalty = await prisma.penalty.findFirst({
      where: { userInstallmentId }
    });

    if (existingPenalty) {
      return NextResponse.json(
        { error: "برای این قسط قبلاً جریمه تعریف شده است" },
        { status: 400 }
      );
    }

    // Calculate total penalty
    const totalPenalty = daysLate * dailyRate;

    // Create penalty
    const penalty = await prisma.penalty.create({
      data: {
        userInstallmentId,
        daysLate: parseInt(daysLate),
        dailyRate: parseFloat(dailyRate),
        totalPenalty
      },
      include: {
        userInstallment: {
          include: {
            installmentDefinition: true,
            user: true,
            unit: true
          }
        }
      }
    });

    return NextResponse.json({
      penalty,
      message: "جریمه با موفقیت ایجاد شد"
    });
  } catch (error) {
    console.error("Error creating penalty:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد جریمه" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "شناسه پروژه الزامی است" },
        { status: 400 }
      );
    }

    // Get penalties for the project
    const penalties = await prisma.penalty.findMany({
      where: {
        userInstallment: {
          unit: {
            projectId: projectId
          },
          ...(user.role !== "ADMIN" ? {
            userId: user.id
          } : {})
        }
      },
      include: {
        userInstallment: {
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
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(penalties);
  } catch (error) {
    console.error("Error fetching penalties:", error);
    return NextResponse.json(
      { error: "خطا در دریافت جریمه‌ها" },
      { status: 500 }
    );
  }
}
