import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const subClassId = searchParams.get('subClassId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const where: any = { 
      projectId,
      isActive: true 
    };

    if (subClassId) {
      where.subClassId = subClassId;
    }

    const details = await prisma.accountDetail.findMany({
      where,
      include: {
        subClass: {
          include: {
            class: {
              include: {
                group: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json(details);
  } catch (error) {
    console.error('Error fetching account details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      projectId, 
      subClassId, 
      name, 
      description, 
      code,
      userId,
      isDefault = false, 
      isProtected = false 
    } = body;

    if (!projectId || !subClassId || !name || !code) {
      return NextResponse.json({ 
        error: 'Project ID, subclass ID, name, and code are required' 
      }, { status: 400 });
    }

    if (!/^\d{2}$/.test(code) || parseInt(code, 10) < 1 || parseInt(code, 10) > 99) {
      return NextResponse.json({ error: 'کد تفصیلی باید 2 رقم بین 01 تا 99 باشد' }, { status: 400 });
    }

    // Validate userId if provided
    if (userId && userId.trim() !== '') {
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      
      if (!userExists) {
        return NextResponse.json({ error: 'کاربر انتخاب شده یافت نشد' }, { status: 400 });
      }
    }

    // Check if the provided code already exists (only active details)
    const existingDetail = await prisma.accountDetail.findFirst({
      where: {
        projectId,
        subClassId,
        code: code,
        isActive: true
      }
    });

    if (existingDetail) {
      return NextResponse.json({ error: 'Detail code already exists' }, { status: 400 });
    }

    // Get next sort order
    const lastSortOrder = await prisma.accountDetail.findFirst({
      where: { projectId, subClassId },
      orderBy: { sortOrder: 'desc' }
    });

    const newDetail = await prisma.accountDetail.create({
      data: {
        projectId,
        subClassId,
        code: code,
        name,
        description,
        userId: userId && userId.trim() !== '' ? userId : null,
        isDefault,
        isProtected,
        sortOrder: (lastSortOrder?.sortOrder || 0) + 1
      },
      include: {
        subClass: {
          include: {
            class: {
              include: {
                group: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });

    return NextResponse.json(newDetail);
  } catch (error) {
    console.error('Error creating account detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailId = searchParams.get('id');
    
    if (!detailId) {
      return NextResponse.json({ error: 'Detail ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, code, userId } = body;

    if (!name) {
      return NextResponse.json({ 
        error: 'Name is required' 
      }, { status: 400 });
    }

    // Load current detail to validate code edits within subclass scope
    const current = await prisma.accountDetail.findUnique({
      where: { id: detailId },
      select: { id: true, code: true, projectId: true, subClassId: true }
    });

    if (!current) {
      return NextResponse.json({ error: 'Detail not found' }, { status: 404 });
    }

    // Validate userId if provided
    if (userId && userId.trim() !== '') {
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      
      if (!userExists) {
        return NextResponse.json({ error: 'کاربر انتخاب شده یافت نشد' }, { status: 400 });
      }
    }

    const dataToUpdate: any = {
      name,
      description: description ?? null,
      userId: userId && userId.trim() !== '' ? userId : null
    };

    if (typeof code === 'string') {
      // Must be two digits 01-99
      if (!/^\d{2}$/.test(code) || parseInt(code) < 1 || parseInt(code) > 99) {
        return NextResponse.json({ error: 'کد تفصیلی باید دو رقمی بین 01 تا 99 باشد' }, { status: 400 });
      }
      if (code !== current.code) {
        const duplicate = await prisma.accountDetail.findFirst({
          where: {
            projectId: current.projectId,
            subClassId: current.subClassId,
            code,
            isActive: true,
            id: { not: detailId }
          }
        });
        if (duplicate) {
          return NextResponse.json({ error: 'کد تفصیلی تکراری است' }, { status: 400 });
        }
        dataToUpdate.code = code;
      }
    }

    const updatedDetail = await prisma.accountDetail.update({
      where: { id: detailId },
      data: dataToUpdate,
      include: {
        subClass: {
          include: {
            class: {
              include: {
                group: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });

    return NextResponse.json(updatedDetail);
  } catch (error) {
    console.error('Error updating account detail:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      body: { name, description, code, userId }
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailId = searchParams.get('id');
    
    if (!detailId) {
      return NextResponse.json({ error: 'Detail ID is required' }, { status: 400 });
    }

    const detail = await prisma.accountDetail.findUnique({
      where: { id: detailId },
      select: { code: true },
    });

    if (!detail) {
      return NextResponse.json({ error: 'Detail not found' }, { status: 404 });
    }

    // Soft delete by setting isActive to false and modifying code to prevent unique constraint conflict
    await prisma.accountDetail.update({
      where: { id: detailId },
      data: { 
        isActive: false,
        code: `${detail.code}_del_${Date.now()}`
      }
    });

    return NextResponse.json({ message: 'Detail deleted successfully' });
  } catch (error) {
    console.error('Error deleting account detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

