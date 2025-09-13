import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getCurrentUser } from "@/app/api/_lib/db";

// Get users available to add to project (not already in project)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Get users who are NOT already in this project and are not admin
    const availableUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          not: 'ADMIN' // Exclude admin users
        },
        units: {
          none: {
            projectId: projectId
          }
        }
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
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
