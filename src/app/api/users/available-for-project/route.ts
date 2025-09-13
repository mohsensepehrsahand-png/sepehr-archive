import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/api/_lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
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

    // Get users who are not already in this project
    const usersInProject = await prisma.unit.findMany({
      where: { projectId },
      select: { userId: true }
    });

    const userIdsInProject = usersInProject.map(unit => unit.userId);

    const availableUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: userIdsInProject
        },
        role: "BUYER", // Only buyers can be added to projects
        isActive: true
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      },
      orderBy: {
        username: 'asc'
      }
    });

    return NextResponse.json(availableUsers);
  } catch (error) {
    console.error("Error fetching available users:", error);
    return NextResponse.json(
      { error: "خطا در دریافت کاربران موجود" },
      { status: 500 }
    );
  }
}
