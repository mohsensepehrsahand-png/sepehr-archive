import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";

// GET /api/projects/[id] - دریافت جزئیات پروژه
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // If user is not admin, check if they have access to this project
    if (userRole !== 'ADMIN' && userId) {
      const userPermission = await prisma.permission.findFirst({
        where: {
          userId: userId,
          resourceType: 'PROJECT',
          resourceId: id,
          accessLevel: {
            in: ['VIEW', 'ADD', 'ADMIN']
          }
        }
      });

      if (!userPermission) {
        return NextResponse.json(
          { error: 'شما دسترسی به این پروژه ندارید' },
          { status: 403 }
        );
      }
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        folders: {
          include: {
            documents: true
          }
        },
        documents: true,
        createdByUser: {
          select: {
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      );
    }

    const projectWithStats = {
      ...project,
      documents: project.documents.length,
      folders: project.folders.length,
      createdBy: project.createdByUser ? 
        `${project.createdByUser.firstName || ''} ${project.createdByUser.lastName || ''}`.trim() || 
        project.createdByUser.username : 
        'نامشخص'
    };

    return NextResponse.json(projectWithStats);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت پروژه' },
      { status: 500 }
    );
  }
}



// DELETE /api/projects/[id] - حذف پروژه
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'شناسه پروژه الزامی است' },
        { status: 400 }
      );
    }

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can delete projects
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز حذف پروژه ندارید' },
        { status: 403 }
      );
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        folders: true,
        documents: true
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      );
    }

    // Check if project has folders or documents
    if (project.folders.length > 0 || project.documents.length > 0) {
      return NextResponse.json({
        hasContent: true,
        foldersCount: project.folders.length,
        documentsCount: project.documents.length,
        message: `این پروژه شامل ${project.folders.length} پوشه و ${project.documents.length} سند است. آیا مطمئن هستید که می‌خواهید آن را حذف کنید؟`
      }, { status: 409 }); // Conflict status for content confirmation
    }

    // Check if this is a force delete (with content)
    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get('force') === 'true';

    if (forceDelete) {
      // Delete all documents first
      await prisma.document.deleteMany({
        where: { projectId: id }
      });

      // Delete all folders
      await prisma.folder.deleteMany({
        where: { projectId: id }
      });
    }

    // Log the deletion activity before deleting
    if (userId) {
      await logActivity({
        userId,
        action: 'DELETE',
        resourceType: 'PROJECT',
        resourceId: id,
        resourceName: project.name,
        description: `پروژه "${project.name}" حذف شد`,
        metadata: {
          foldersCount: project.folders.length,
          documentsCount: project.documents.length,
          forceDelete
        }
      });
    }

    // Delete project from database
    await prisma.project.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'پروژه با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'خطا در حذف پروژه' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - ویرایش پروژه
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'شناسه پروژه الزامی است' },
        { status: 400 }
      );
    }

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can update projects
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ویرایش پروژه ندارید' },
        { status: 403 }
      );
    }

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      );
    }

    // تبدیل status فارسی به enum
    let projectStatus: 'ACTIVE' | 'ARCHIVED' = existingProject.status;
    if (status) {
      if (status === 'فعال' || status === 'active' || status === 'ACTIVE') {
        projectStatus = 'ACTIVE';
      } else if (status === 'آرشیو' || status === 'archived' || status === 'ARCHIVED') {
        projectStatus = 'ARCHIVED';
      }
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name: name || existingProject.name,
        description: description || existingProject.description,
        status: projectStatus
      }
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی پروژه' },
      { status: 500 }
    );
  }
}
