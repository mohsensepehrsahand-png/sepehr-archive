import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/api/_lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.id;
    const body = await request.json();
    const { userId, unitNumber, area } = body;

    if (!userId || !unitNumber || !area) {
      return NextResponse.json(
        { error: "شناسه کاربر، شماره واحد و متراژ الزامی است" },
        { status: 400 }
      );
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

    // Check if user exists and is a buyer
    const userToAdd = await prisma.user.findFirst({
      where: {
        id: userId,
        role: "BUYER",
        isActive: true
      }
    });

    if (!userToAdd) {
      return NextResponse.json(
        { error: "کاربر یافت نشد یا دسترسی ندارد" },
        { status: 404 }
      );
    }

    // Check if unit number already exists in this project
    const existingUnit = await prisma.unit.findFirst({
      where: {
        projectId,
        unitNumber
      }
    });

    if (existingUnit) {
      return NextResponse.json(
        { error: "شماره واحد قبلاً در این پروژه استفاده شده است" },
        { status: 400 }
      );
    }

    // Check if user already has a unit in this project
    const existingUserUnit = await prisma.unit.findFirst({
      where: {
        projectId,
        userId
      }
    });

    if (existingUserUnit) {
      return NextResponse.json(
        { error: "این کاربر قبلاً در این پروژه واحد دارد" },
        { status: 400 }
      );
    }

    // Create unit
    const unit = await prisma.unit.create({
      data: {
        projectId,
        userId,
        unitNumber,
        area: parseFloat(area)
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create user installments for existing installment definitions
    const installmentDefinitions = await prisma.installmentDefinition.findMany({
      where: { projectId }
    });

    if (installmentDefinitions.length > 0) {
      // Get total area for calculation
      const allUnits = await prisma.unit.findMany({
        where: { projectId }
      });
      const totalArea = allUnits.reduce((sum, u) => sum + u.area, 0);

      // Create user installments
      await Promise.all(
        installmentDefinitions.map(definition =>
          prisma.userInstallment.create({
            data: {
              userId,
              unitId: unit.id,
              installmentDefinitionId: definition.id,
              shareAmount: (definition.amount * unit.area) / totalArea
            }
          })
        )
      );
    }

    return NextResponse.json({
      unit,
      message: "کاربر با موفقیت به پروژه اضافه شد"
    });
  } catch (error) {
    console.error("Error adding user to project:", error);
    return NextResponse.json(
      { error: "خطا در اضافه کردن کاربر به پروژه" },
      { status: 500 }
    );
  }
}
