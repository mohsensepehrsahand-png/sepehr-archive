import { NextRequest, NextResponse } from "next/server";
import { prisma, getCurrentUser } from "@/app/api/_lib/db";

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

    // Check if user has access to this project
    const projectUser = await prisma.unit.findFirst({
      where: {
        projectId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            dailyPenaltyAmount: true,
            penaltyGraceDays: true
          }
        }
      }
    });

    if (!projectUser) {
      return NextResponse.json({ error: "کاربر در این پروژه یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({
      userId: projectUser.user.id,
      firstName: projectUser.user.firstName,
      lastName: projectUser.user.lastName,
      username: projectUser.user.username,
      dailyPenaltyAmount: projectUser.user.dailyPenaltyAmount || 0,
      penaltyGraceDays: projectUser.user.penaltyGraceDays || 0
    });
  } catch (error) {
    console.error("Error fetching user penalty settings:", error);
    return NextResponse.json(
      { error: "خطا در دریافت تنظیمات جریمه کاربر" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, userId } = await params;
    const body = await request.json();
    const { dailyPenaltyAmount, penaltyGraceDays } = body;

    // Validate input
    if (dailyPenaltyAmount <= 0) {
      return NextResponse.json(
        { error: "مبلغ جریمه روزانه باید بزرگتر از صفر باشد" },
        { status: 400 }
      );
    }

    if (penaltyGraceDays < 0) {
      return NextResponse.json(
        { error: "تعداد روزهای تاخیر مجاز نمی‌تواند منفی باشد" },
        { status: 400 }
      );
    }

    // Check if user exists in project
    const projectUser = await prisma.unit.findFirst({
      where: {
        projectId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });

    if (!projectUser) {
      return NextResponse.json({ error: "کاربر در این پروژه یافت نشد" }, { status: 404 });
    }

    // Update user penalty settings
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        dailyPenaltyAmount: parseFloat(dailyPenaltyAmount) || 0,
        penaltyGraceDays: parseInt(penaltyGraceDays) || 0
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        dailyPenaltyAmount: true,
        penaltyGraceDays: true
      }
    });

    return NextResponse.json({
      message: "تنظیمات جریمه کاربر با موفقیت به‌روزرسانی شد",
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        username: updatedUser.username,
        dailyPenaltyAmount: updatedUser.dailyPenaltyAmount,
        penaltyGraceDays: updatedUser.penaltyGraceDays
      }
    });
  } catch (error) {
    console.error("Error updating user penalty settings:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی تنظیمات جریمه کاربر" },
      { status: 500 }
    );
  }
}

