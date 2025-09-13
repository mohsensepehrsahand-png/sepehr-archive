import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET /api/archived-projects - دریافت لیست پروژه‌های آرشیو شده
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // ساخت شرط جستجو
    const whereClause = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { createdByUsername: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    // Get projects with ARCHIVED status from Project table
    const [archivedProjectsFromTable, archivedProjectsCount] = await Promise.all([
      prisma.project.findMany({
        where: {
          status: 'ARCHIVED',
          ...(search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } }
            ]
          } : {})
        },
        include: {
          folders: true,
          documents: true,
          units: true,
          installmentDefinitions: true,
          createdByUser: {
            select: {
              username: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.project.count({ 
        where: { 
          status: 'ARCHIVED',
          ...(search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } }
            ]
          } : {})
        } 
      })
    ]);
    
    // Transform Project objects to match ArchivedProject structure
    const archivedProjects = archivedProjectsFromTable.map(project => ({
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
        userUsername: 'نامشخص',
        userFirstName: '',
        userLastName: '',
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
    }));
    
    const total = archivedProjectsCount;

    // محاسبه آمار
    const stats = {
      totalArchivedProjects: total,
      totalArchivedFolders: archivedProjects.reduce((sum, project) => sum + project.archivedFolders.length, 0),
      totalArchivedDocuments: archivedProjects.reduce((sum, project) => sum + project.archivedDocuments.length, 0),
      totalArchivedUnits: archivedProjects.reduce((sum, project) => sum + project.archivedUnits.length, 0),
      totalArchivedInstallmentDefinitions: archivedProjects.reduce((sum, project) => sum + project.archivedInstallmentDefinitions.length, 0)
    };

    return NextResponse.json({
      archivedProjects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching archived projects:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت پروژه‌های آرشیو' },
      { status: 500 }
    );
  }
}
