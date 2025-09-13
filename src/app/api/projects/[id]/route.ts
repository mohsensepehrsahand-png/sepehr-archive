import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";
import { unlink, rmdir, readdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Helper function to delete directory recursively
async function deleteDirectoryRecursive(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    return;
  }

  const entries = await readdir(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      await deleteDirectoryRecursive(fullPath);
    } else {
      await unlink(fullPath);
    }
  }
  
  await rmdir(dirPath);
}

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
      status: project.status === 'ACTIVE' ? 'فعال' : 'آرشیو',
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
        folders: {
          include: {
            documents: true
          }
        },
        documents: true,
        createdByUser: {
          select: {
            username: true
          }
        },
        units: {
          include: {
            user: {
              select: {
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        installmentDefinitions: true
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      );
    }

    // Check if this is a force delete (with content)
    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get('force') === 'true';

    // Check if project has folders or documents
    if (project.folders.length > 0 || project.documents.length > 0) {
      if (!forceDelete) {
        return NextResponse.json({
          hasContent: true,
          foldersCount: project.folders.length,
          documentsCount: project.documents.length,
          message: `این پروژه شامل ${project.folders.length} پوشه و ${project.documents.length} سند است. آیا مطمئن هستید که می‌خواهید آن را حذف کنید؟`
        }, { status: 409 }); // Conflict status for content confirmation
      }
    }

    // Archive project before deletion
    const archivedProject = await prisma.archivedProject.create({
      data: {
        originalProjectId: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        colorPrimary: project.colorPrimary,
        colorFolderDefault: project.colorFolderDefault,
        colorDocImage: project.colorDocImage,
        colorDocPdf: project.colorDocPdf,
        bgColor: project.bgColor,
        createdBy: project.createdBy,
        createdByUsername: project.createdByUser?.username || 'نامشخص'
      }
    });

    // Archive folders
    for (const folder of project.folders) {
      const archivedFolder = await prisma.archivedFolder.create({
        data: {
          archivedProjectId: archivedProject.id,
          parentId: folder.parentId,
          name: folder.name,
          description: folder.description,
          tabKey: folder.tabKey,
          path: folder.path,
          depth: folder.depth,
          sortOrder: folder.sortOrder,
          createdBy: folder.createdBy,
          createdByUsername: 'نامشخص' // We'll need to get this from user data
        }
      });

      // Archive documents in this folder
      for (const document of folder.documents) {
        await prisma.archivedDocument.create({
          data: {
            archivedProjectId: archivedProject.id,
            archivedFolderId: archivedFolder.id,
            name: document.name,
            description: document.description,
            tagsJson: document.tagsJson,
            mimeType: document.mimeType,
            fileExt: document.fileExt,
            sizeBytes: document.sizeBytes,
            isUserUploaded: document.isUserUploaded,
            createdBy: document.createdBy,
            createdByUsername: 'نامشخص',
            filePath: document.filePath
          }
        });
      }
    }

    // Archive root level documents
    for (const document of project.documents) {
      await prisma.archivedDocument.create({
        data: {
          archivedProjectId: archivedProject.id,
          name: document.name,
          description: document.description,
          tagsJson: document.tagsJson,
          mimeType: document.mimeType,
          fileExt: document.fileExt,
          sizeBytes: document.sizeBytes,
          isUserUploaded: document.isUserUploaded,
          createdBy: document.createdBy,
          createdByUsername: 'نامشخص',
          filePath: document.filePath
        }
      });
    }

    // Archive units
    for (const unit of project.units) {
      await prisma.archivedProjectUnit.create({
        data: {
          archivedProjectId: archivedProject.id,
          userId: unit.userId,
          userUsername: unit.user.username,
          userFirstName: unit.user.firstName,
          userLastName: unit.user.lastName,
          unitNumber: unit.unitNumber,
          area: unit.area
        }
      });
    }

    // Archive installment definitions
    for (const installmentDef of project.installmentDefinitions) {
      await prisma.archivedProjectInstallmentDefinition.create({
        data: {
          archivedProjectId: archivedProject.id,
          title: installmentDef.title,
          dueDate: installmentDef.dueDate,
          amount: installmentDef.amount,
          isDefault: installmentDef.isDefault
        }
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
        description: `پروژه "${project.name}" حذف شد و در آرشیو نگهداری شد`,
        metadata: {
          foldersCount: project.folders.length,
          documentsCount: project.documents.length,
          archived: true
        }
      });
    }

    // Delete project from database (cascade delete will handle related data)
    console.log('🗑️ Deleting project:', id);
    await prisma.project.delete({
      where: { id }
    });
    console.log('✅ Project deleted successfully');

    return NextResponse.json({ 
      message: 'پروژه با موفقیت حذف شد و در آرشیو نگهداری شد',
      archivedProjectId: archivedProject.id
    });
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

    const updatedProjectWithPersianStatus = {
      ...updatedProject,
      status: updatedProject.status === 'ACTIVE' ? 'فعال' : 'آرشیو'
    };

    return NextResponse.json(updatedProjectWithPersianStatus);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی پروژه' },
      { status: 500 }
    );
  }
}
