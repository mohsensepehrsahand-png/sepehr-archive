import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const groupId = searchParams.get('groupId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const where: any = { 
      projectId,
      isActive: true 
    };

    if (groupId) {
      where.groupId = groupId;
    }

    const classes = await prisma.accountClass.findMany({
      where,
      include: {
        group: true,
        subClasses: {
          include: {
            details: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' }
            }
          },
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error('Error fetching account classes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, groupId, name, nature, code, isDefault = false, isProtected = false } = body;

    if (!projectId || !groupId || !name || !nature || !code) {
      return NextResponse.json({ 
        error: 'Project ID, group ID, name, nature, and code are required' 
      }, { status: 400 });
    }

    if (!/^\d{1}$/.test(code) || parseInt(code) < 1 || parseInt(code) > 9) {
      return NextResponse.json({ error: 'کد کل باید 1 رقم بین 1 تا 9 باشد' }, { status: 400 });
    }

    // Check if the group exists
    const group = await prisma.accountGroup.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({ 
        error: 'Group not found. Please initialize accounting groups first.',
        suggestion: 'Call /api/accounting/coding/initialize to create default groups'
      }, { status: 404 });
    }

    // Check if the provided code already exists (only active classes)
    const existingClass = await prisma.accountClass.findFirst({
      where: {
        projectId,
        groupId,
        code: code,
        isActive: true
      }
    });

    if (existingClass) {
      return NextResponse.json({ error: 'Class code already exists' }, { status: 400 });
    }

    // Get next sort order
    const lastSortOrder = await prisma.accountClass.findFirst({
      where: { projectId, groupId },
      orderBy: { sortOrder: 'desc' }
    });

    const newClass = await prisma.accountClass.create({
      data: {
        projectId,
        groupId,
        code: code,
        name,
        nature,
        isDefault,
        isProtected,
        sortOrder: (lastSortOrder?.sortOrder || 0) + 1
      },
      include: {
        group: true
      }
    });

    return NextResponse.json(newClass);
  } catch (error) {
    console.error('Error creating account class:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('id');
    
    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, nature, code } = body;

    if (!name || !nature || !code) {
      return NextResponse.json({ 
        error: 'Name, nature, and code are required' 
      }, { status: 400 });
    }

    if (!/^\d{1}$/.test(code) || parseInt(code) < 1 || parseInt(code) > 9) {
      return NextResponse.json({ error: 'کد کل باید 1 رقم بین 1 تا 9 باشد' }, { status: 400 });
    }


    // Get current class to check if code is changing
    const currentClassWithCode = await prisma.accountClass.findUnique({
      where: { id: classId },
      select: { projectId: true, groupId: true, code: true }
    });

    if (!currentClassWithCode) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Only check for duplicate code if the code is actually changing
    if (currentClassWithCode.code !== code) {
      const existingClass = await prisma.accountClass.findFirst({
        where: {
          projectId: currentClassWithCode.projectId,
          groupId: currentClassWithCode.groupId,
          code: code,
          isActive: true,
          id: { not: classId }
        }
      });

      if (existingClass) {
        return NextResponse.json({ error: 'Class code already exists' }, { status: 400 });
      }
    }

    const updatedClass = await prisma.accountClass.update({
      where: { id: classId },
      data: { name, nature, code },
      include: {
        group: true
      }
    });

    return NextResponse.json(updatedClass);
  } catch (error) {
    console.error('Error updating account class:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('id');
    
    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    const accountClass = await prisma.accountClass.findUnique({
      where: { id: classId },
      select: { code: true },
    });

    if (!accountClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Soft delete by setting isActive to false and modifying code
    await prisma.accountClass.update({
      where: { id: classId },
      data: { 
        isActive: false,
        code: `${accountClass.code}_del_${Date.now()}`
      }
    });

    return NextResponse.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting account class:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

