import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// POST /api/archived-projects/[id]/restore - بازگردانی پروژه آرشیو شده
export async function POST(
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

    // If it's a project with status ARCHIVED, just update the status
    if (archivedProjectFromStatus) {
      const updatedProject = await prisma.project.update({
        where: { id },
        data: { status: 'ACTIVE' }
      });

      return NextResponse.json({
        success: true,
        message: 'پروژه با موفقیت بازگردانی شد',
        restoredProject: {
          id: updatedProject.id,
          name: updatedProject.name
        }
      });
    }

    // Otherwise, check ArchivedProject table
    const archivedProject = await prisma.archivedProject.findUnique({
      where: { id },
      include: {
        archivedFolders: {
          orderBy: { depth: 'asc' }
        },
        archivedDocuments: true,
        archivedUnits: true,
        archivedInstallmentDefinitions: true
      }
    });

    if (!archivedProject) {
      return NextResponse.json(
        { error: 'پروژه آرشیو یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی وجود کاربر سازنده
    const creator = await prisma.user.findFirst({
      where: { username: archivedProject.createdByUsername }
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'کاربر سازنده پروژه یافت نشد' },
        { status: 404 }
      );
    }

    // ایجاد پروژه جدید
    const restoredProject = await prisma.project.create({
      data: {
        name: archivedProject.name,
        description: archivedProject.description,
        status: 'ACTIVE',
        colorPrimary: archivedProject.colorPrimary,
        colorFolderDefault: archivedProject.colorFolderDefault,
        colorDocImage: archivedProject.colorDocImage,
        colorDocPdf: archivedProject.colorDocPdf,
        bgColor: archivedProject.bgColor,
        createdBy: creator.id
      }
    });

    // بازگردانی پوشه‌ها
    const folderMap = new Map<string, string>();
    
    for (const archivedFolder of archivedProject.archivedFolders) {
      const restoredFolder = await prisma.folder.create({
        data: {
          projectId: restoredProject.id,
          parentId: archivedFolder.parentId ? folderMap.get(archivedFolder.parentId) : null,
          name: archivedFolder.name,
          description: archivedFolder.description,
          tabKey: archivedFolder.tabKey,
          path: archivedFolder.path,
          depth: archivedFolder.depth,
          sortOrder: archivedFolder.sortOrder,
          createdBy: creator.id
        }
      });
      
      folderMap.set(archivedFolder.id, restoredFolder.id);
    }

    // بازگردانی اسناد
    for (const archivedDocument of archivedProject.archivedDocuments) {
      await prisma.document.create({
        data: {
          projectId: restoredProject.id,
          folderId: archivedDocument.archivedFolderId ? folderMap.get(archivedDocument.archivedFolderId) : null,
          name: archivedDocument.name,
          description: archivedDocument.description,
          tagsJson: archivedDocument.tagsJson,
          mimeType: archivedDocument.mimeType,
          fileExt: archivedDocument.fileExt,
          sizeBytes: archivedDocument.sizeBytes,
          isUserUploaded: archivedDocument.isUserUploaded,
          createdBy: creator.id,
          filePath: archivedDocument.filePath
        }
      });
    }

    // بازگردانی واحدها
    for (const archivedUnit of archivedProject.archivedUnits) {
      await prisma.unit.create({
        data: {
          projectId: restoredProject.id,
          userId: archivedUnit.userId,
          unitNumber: archivedUnit.unitNumber,
          area: archivedUnit.area
        }
      });
    }

    // بازگردانی تعریف اقساط
    for (const archivedInstallmentDef of archivedProject.archivedInstallmentDefinitions) {
      await prisma.installmentDefinition.create({
        data: {
          projectId: restoredProject.id,
          title: archivedInstallmentDef.title,
          dueDate: archivedInstallmentDef.dueDate,
          amount: archivedInstallmentDef.amount,
          isDefault: archivedInstallmentDef.isDefault
        }
      });
    }

    // حذف پروژه آرشیو شده
    await prisma.archivedProject.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'پروژه با موفقیت بازگردانی شد',
      restoredProject: {
        id: restoredProject.id,
        name: restoredProject.name
      }
    });

  } catch (error) {
    console.error('Error restoring archived project:', error);
    return NextResponse.json(
      { error: 'خطا در بازگردانی پروژه آرشیو' },
      { status: 500 }
    );
  }
}
