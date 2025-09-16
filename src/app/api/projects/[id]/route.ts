import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// GET /api/projects/[id] - دریافت اطلاعات یک پروژه
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userRole = cookieStore.get('userRole')?.value;

    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const projectId = params.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
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

    if (!project) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 });
    }

    const projectWithCreator = {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status === 'ACTIVE' ? 'فعال' : 'آرشیو',
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

    return NextResponse.json(projectWithCreator);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت پروژه' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - ویرایش پروژه
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userRole = cookieStore.get('userRole')?.value;

    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const projectId = params.id;
    const body = await request.json();
    const { name, description, status } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'نام پروژه الزامی است' },
        { status: 400 }
      );
    }

    let projectStatus: 'ACTIVE' | 'ARCHIVED' = 'ACTIVE';
    if (status === 'فعال' || status === 'active' || status === 'ACTIVE') {
      projectStatus = 'ACTIVE';
    } else if (status === 'آرشیو' || status === 'archived' || status === 'ARCHIVED') {
      projectStatus = 'ARCHIVED';
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name,
        description: description || '',
        status: projectStatus,
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

    const projectWithCreator = {
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description,
      status: updatedProject.status === 'ACTIVE' ? 'فعال' : 'آرشیو',
      createdBy: updatedProject.createdByUser ?
        `${updatedProject.createdByUser.firstName || ''} ${updatedProject.createdByUser.lastName || ''}`.trim() ||
        updatedProject.createdByUser.username :
        'نامشخص',
      createdAt: updatedProject.createdAt,
      colorPrimary: updatedProject.colorPrimary,
      colorFolderDefault: updatedProject.colorFolderDefault,
      colorDocImage: updatedProject.colorDocImage,
      colorDocPdf: updatedProject.colorDocPdf,
      bgColor: updatedProject.bgColor
    };

    return NextResponse.json(projectWithCreator);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'خطا در ویرایش پروژه' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - حذف پروژه
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userRole = cookieStore.get('userRole')?.value;

    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const projectId = params.id;

    await prisma.project.delete({
      where: { id: projectId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'خطا در حذف پروژه' },
      { status: 500 }
    );
  }
}