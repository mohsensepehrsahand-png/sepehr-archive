import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/api/_lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

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

    // Get all documents for this project
    const documents = await prisma.document.findMany({
      where: {
        projectId: projectId
      },
      select: {
        id: true,
        name: true,
        description: true,
        mimeType: true,
        fileExt: true,
        createdAt: true,
        filePath: true,
        folderId: true,
        folder: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching project documents:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اسناد پروژه" },
      { status: 500 }
    );
  }
}
