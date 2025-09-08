import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";

// GET /api/projects - دریافت لیست پروژه‌ها
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const status = searchParams.get('status');

    // Get user role and ID from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userDataCookie = request.cookies.get('userData')?.value;
    
    let userId = null;
    if (userDataCookie) {
      try {
        const userData = JSON.parse(userDataCookie);
        userId = userData.id;
      } catch (error) {
        console.error('Error parsing userData cookie:', error);
      }
    }

    let whereClause: any = {};
    
    if (status === 'ARCHIVED') {
      whereClause.status = 'ARCHIVED';
    } else if (!includeArchived) {
      whereClause.status = 'ACTIVE';
    }

    let projects;

    // If user is not admin, filter projects based on permissions
    if (userRole !== 'ADMIN' && userId) {
      // Get projects where user has VIEW or higher access
      const userPermissions = await prisma.permission.findMany({
        where: {
          userId: userId,
          resourceType: 'PROJECT',
          accessLevel: {
            in: ['VIEW', 'ADD', 'ADMIN']
          }
        },
        select: {
          resourceId: true
        }
      });

      const allowedProjectIds = userPermissions.map(p => p.resourceId);
      
      if (allowedProjectIds.length === 0) {
        return NextResponse.json([]);
      }

      // Filter projects by allowed IDs
      whereClause.id = {
        in: allowedProjectIds
      };
    }

    // Get projects (filtered for non-admin users)
    projects = await prisma.project.findMany({
      where: whereClause,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const projectsWithStats = projects.map((project: any) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status === 'ACTIVE' ? 'فعال' : 'آرشیو',
      documents: project.documents.length,
      folders: project.folders.length,
      createdBy: project.createdByUser ? 
        `${project.createdByUser.firstName || ''} ${project.createdByUser.lastName || ''}`.trim() || 
        project.createdByUser.username : 
        'نامشخص',
      createdAt: project.createdAt,
      colorPrimary: project.colorPrimary,
      colorFolderDefault: project.colorFolderDefault,
      colorDocImage: project.colorDocImage,
      colorDocPdf: project.colorDocPdf,
      bgColor: project.bgColor
    }));

    return NextResponse.json(projectsWithStats);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت پروژه‌ها' },
      { status: 500 }
    );
  }
}

// POST /api/projects - ایجاد پروژه جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, status = 'ACTIVE', createdBy } = body;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can create projects
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ایجاد پروژه ندارید' },
        { status: 403 }
      );
    }

    if (!name || !createdBy) {
      return NextResponse.json(
        { error: 'نام پروژه و شناسه کاربر ایجادکننده الزامی است' },
        { status: 400 }
      );
    }

    console.log('Creating project with data:', { name, description, status, createdBy });
    
    // تبدیل status فارسی به enum
    let projectStatus: 'ACTIVE' | 'ARCHIVED' = 'ACTIVE';
    if (status === 'فعال' || status === 'active' || status === 'ACTIVE') {
      projectStatus = 'ACTIVE';
    } else if (status === 'آرشیو' || status === 'archived' || status === 'ARCHIVED') {
      projectStatus = 'ARCHIVED';
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || '',
        status: projectStatus,
        createdBy,
        colorPrimary: "#1976d2",
        colorFolderDefault: "#90caf9",
        colorDocImage: "#26a69a",
        colorDocPdf: "#ef5350",
        bgColor: "#ffffff"
      },
      include: {
        createdByUser: {
          select: {
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });

    // Log the creation activity
    if (userId) {
      await logActivity({
        userId,
        action: 'CREATE',
        resourceType: 'PROJECT',
        resourceId: project.id,
        resourceName: project.name,
        description: `پروژه جدید "${project.name}" ایجاد شد`,
        metadata: {
          description: project.description,
          status: project.status
        }
      });
    }

    const projectWithCreator = {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status === 'ACTIVE' ? 'فعال' : 'آرشیو',
      documents: 0, // New project has no documents yet
      folders: 0,   // New project has no folders yet
      createdBy: project.createdByUser ? 
        `${project.createdByUser.firstName || ''} ${project.createdByUser.lastName || ''}`.trim() || 
        project.createdByUser.username : 
        'نامشخص',
      createdAt: project.createdAt,
      colorPrimary: project.colorPrimary,
      colorFolderDefault: project.colorFolderDefault,
      colorDocImage: project.colorDocImage,
      colorDocPdf: project.colorDocPdf,
      bgColor: project.bgColor
    };

    return NextResponse.json(projectWithCreator, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد پروژه' },
      { status: 500 }
    );
  }
}
