import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET /api/archived-projects/[id] - دریافت جزئیات پروژه آرشیو شده
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try to find project in ArchivedProject table
    let archivedProject = await prisma.archivedProject.findUnique({
      where: { id },
      include: {
        archivedFolders: {
          orderBy: { sortOrder: 'asc' }
        },
        archivedDocuments: {
          orderBy: { archivedAt: 'desc' }
        },
        archivedUnits: {
          orderBy: { unitNumber: 'asc' }
        },
        archivedInstallmentDefinitions: {
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    // If not found in ArchivedProject table, check Project table with status ARCHIVED
    if (!archivedProject) {
      const project = await prisma.project.findFirst({
        where: { 
          id,
          status: 'ARCHIVED'
        },
        include: {
          folders: {
            orderBy: { sortOrder: 'asc' }
          },
          documents: {
            orderBy: { updatedAt: 'desc' }
          },
          units: {
            orderBy: { unitNumber: 'asc' },
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
          installmentDefinitions: {
            orderBy: { dueDate: 'asc' }
          },
          createdByUser: {
            select: {
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (project) {
        // Transform Project to ArchivedProject structure
        archivedProject = {
          id: project.id,
          originalProjectId: project.id,
          name: project.name,
          description: project.description || '',
          status: project.status,
          colorPrimary: project.colorPrimary,
          colorFolderDefault: project.colorFolderDefault,
          colorDocImage: project.colorDocImage,
          colorDocPdf: project.colorDocPdf,
          bgColor: project.bgColor,
          createdBy: project.createdBy,
          createdByUsername: project.createdByUser?.username || 'نامشخص',
          archivedAt: project.updatedAt,
          archivedFolders: project.folders.map(folder => ({
            id: folder.id,
            archivedProjectId: project.id,
            parentId: folder.parentId,
            name: folder.name,
            description: folder.description || '',
            tabKey: folder.tabKey,
            path: folder.path,
            depth: folder.depth,
            sortOrder: folder.sortOrder || 0,
            createdBy: folder.createdBy,
            createdByUsername: project.createdByUser?.username || 'نامشخص',
            archivedAt: folder.updatedAt
          })),
          archivedDocuments: project.documents.map(doc => ({
            id: doc.id,
            archivedProjectId: project.id,
            archivedFolderId: doc.folderId,
            name: doc.name,
            description: doc.description || '',
            tagsJson: doc.tagsJson,
            mimeType: doc.mimeType,
            fileExt: doc.fileExt,
            sizeBytes: doc.sizeBytes,
            isUserUploaded: doc.isUserUploaded,
            createdBy: doc.createdBy,
            createdByUsername: project.createdByUser?.username || 'نامشخص',
            filePath: doc.filePath,
            archivedAt: doc.updatedAt
          })),
          archivedUnits: project.units.map(unit => ({
            id: unit.id,
            archivedProjectId: project.id,
            userId: unit.userId,
            userUsername: unit.user?.username || 'نامشخص',
            userFirstName: unit.user?.firstName || '',
            userLastName: unit.user?.lastName || '',
            unitNumber: unit.unitNumber,
            area: unit.area,
            archivedAt: unit.updatedAt
          })),
          archivedInstallmentDefinitions: project.installmentDefinitions.map(def => ({
            id: def.id,
            archivedProjectId: project.id,
            title: def.title,
            dueDate: def.dueDate,
            amount: def.amount,
            isDefault: def.isDefault,
            archivedAt: def.updatedAt
          }))
        };
      }
    }

    if (!archivedProject) {
      return NextResponse.json(
        { error: 'پروژه آرشیو یافت نشد' },
        { status: 404 }
      );
    }

    // محاسبه آمار پروژه
    const stats = {
      totalFolders: archivedProject.archivedFolders.length,
      totalDocuments: archivedProject.archivedDocuments.length,
      totalUnits: archivedProject.archivedUnits.length,
      totalInstallmentDefinitions: archivedProject.archivedInstallmentDefinitions.length,
      totalDocumentsSize: archivedProject.archivedDocuments.reduce((sum, doc) => sum + doc.sizeBytes, 0)
    };

    return NextResponse.json({
      archivedProject,
      stats
    });

  } catch (error) {
    console.error('Error fetching archived project details:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت جزئیات پروژه آرشیو' },
      { status: 500 }
    );
  }
}


// DELETE /api/archived-projects/[id] - حذف کامل پروژه آرشیو شده
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if this is a project with status ARCHIVED
    const archivedProjectFromStatus = await prisma.project.findFirst({
      where: { 
        id,
        status: 'ARCHIVED'
      }
    });

    // If it's a project with status ARCHIVED, delete it
    if (archivedProjectFromStatus) {
      await prisma.project.delete({
        where: { id }
      });

      return NextResponse.json({
        success: true,
        message: 'پروژه با موفقیت حذف شد'
      });
    }

    // Otherwise, check ArchivedProject table
    const archivedProject = await prisma.archivedProject.findUnique({
      where: { id }
    });

    if (!archivedProject) {
      return NextResponse.json(
        { error: 'پروژه آرشیو یافت نشد' },
        { status: 404 }
      );
    }

    // حذف پروژه آرشیو (cascade delete تمام اطلاعات مرتبط را حذف می‌کند)
    await prisma.archivedProject.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'پروژه آرشیو با موفقیت حذف شد'
    });

  } catch (error) {
    console.error('Error deleting archived project:', error);
    return NextResponse.json(
      { error: 'خطا در حذف پروژه آرشیو' },
      { status: 500 }
    );
  }
}
