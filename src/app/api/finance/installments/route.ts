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
    const { projectId, title, dueDate, amount } = body;

    if (!projectId || !title || !dueDate || !amount) {
      return NextResponse.json(
        { error: "تمام فیلدها الزامی است" },
        { status: 400 }
      );
    }

    // Get the next order number for this project
    const lastOrder = await prisma.installmentDefinition.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });
    const nextOrder = (lastOrder?.order || 0) + 1;

    // Create installment definition
    const installmentDefinition = await prisma.installmentDefinition.create({
      data: {
        projectId,
        title,
        dueDate: new Date(dueDate),
        amount: parseFloat(amount),
        order: nextOrder
      }
    });

    // Get all units in this project
    const units = await prisma.unit.findMany({
      where: { projectId },
      include: { user: true }
    });

    if (units.length === 0) {
      return NextResponse.json({
        installmentDefinition,
        userInstallments: 0,
        message: "قسط ایجاد شد اما هیچ واحدی در پروژه یافت نشد"
      });
    }

    // Calculate total area
    const totalArea = units.reduce((sum, unit) => sum + unit.area, 0);

    // Create user installments for each unit
    const userInstallments = await Promise.all(
      units.map(unit => 
        prisma.userInstallment.create({
          data: {
            userId: unit.userId,
            unitId: unit.id,
            installmentDefinitionId: installmentDefinition.id,
            shareAmount: (parseFloat(amount) * unit.area) / totalArea
          }
        })
      )
    );

    return NextResponse.json({
      installmentDefinition,
      userInstallments: userInstallments.length,
      message: "قسط با موفقیت ایجاد شد"
    });
  } catch (error) {
    console.error("Error creating installment:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد قسط" },
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

    let installments;

    if (user.role === "ADMIN") {
      installments = await prisma.installmentDefinition.findMany({
        where: { projectId },
        include: {
          userInstallments: {
            include: {
              user: true,
              unit: true,
              payments: true
            }
          }
        },
        orderBy: { order: 'asc' }
      });
    } else {
      installments = await prisma.installmentDefinition.findMany({
        where: { 
          projectId,
          userInstallments: {
            some: {
              userId: user.id
            }
          }
        },
        include: {
          userInstallments: {
            where: { userId: user.id },
            include: {
              user: true,
              unit: true,
              payments: true
            }
          }
        },
        orderBy: { order: 'asc' }
      });
    }

    return NextResponse.json(installments);
  } catch (error) {
    console.error("Error fetching installments:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اقساط" },
      { status: 500 }
    );
  }
}
