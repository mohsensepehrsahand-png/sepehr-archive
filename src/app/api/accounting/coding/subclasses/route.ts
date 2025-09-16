import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const classId = searchParams.get('classId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const where: any = { 
      projectId,
      isActive: true 
    };

    if (classId) {
      where.classId = classId;
    }

    const subClasses = await prisma.accountSubClass.findMany({
      where,
      include: {
        class: {
          include: {
            group: true
          }
        },
        details: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json(subClasses);
  } catch (error) {
    console.error('Error fetching account subclasses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, classId, name, hasDetails = false, code, isDefault = false, isProtected = false } = body;

    console.log('Creating subclass with data:', { projectId, classId, name, hasDetails, code });

    if (!projectId || !classId || !name || !code) {
      return NextResponse.json({ 
        error: 'Project ID, class ID, name, and code are required' 
      }, { status: 400 });
    }

    if (!/^\d{2}$/.test(code) || parseInt(code, 10) < 1 || parseInt(code, 10) > 99) {
      return NextResponse.json({ error: 'کد معین باید 2 رقم بین 01 تا 99 باشد' }, { status: 400 });
    }

    // Check if the provided code already exists (only active subclasses)
    const existingSubClass = await prisma.accountSubClass.findFirst({
      where: {
        projectId,
        classId,
        code: code,
        isActive: true
      }
    });

    if (existingSubClass) {
      return NextResponse.json({ error: 'SubClass code already exists' }, { status: 400 });
    }

    // Get next sort order
    const lastSortOrder = await prisma.accountSubClass.findFirst({
      where: { projectId, classId },
      orderBy: { sortOrder: 'desc' }
    });

    const newSubClass = await prisma.accountSubClass.create({
      data: {
        projectId,
        classId,
        code: code,
        name,
        hasDetails,
        isDefault,
        isProtected,
        sortOrder: (lastSortOrder?.sortOrder || 0) + 1
      },
      include: {
        class: {
          include: {
            group: true
          }
        }
      }
    });

    console.log('Successfully created subclass:', newSubClass);
    return NextResponse.json(newSubClass);
  } catch (error) {
    console.error('Error creating account subclass:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subclassId = searchParams.get('id');
    
    if (!subclassId) {
      return NextResponse.json({ error: 'Subclass ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, hasDetails, code } = body;

    if (!name || hasDetails === undefined) {
      return NextResponse.json({ 
        error: 'Name and hasDetails are required' 
      }, { status: 400 });
    }

    // Load current subclass to validate code changes in its class scope
    const current = await prisma.accountSubClass.findUnique({
      where: { id: subclassId },
      select: { id: true, code: true, projectId: true, classId: true }
    });

    if (!current) {
      return NextResponse.json({ error: 'Subclass not found' }, { status: 404 });
    }

    const dataToUpdate: any = { name, hasDetails };

    if (typeof code === 'string') {
      // Must be two digits 01-99
      if (!/^\d{2}$/.test(code) || parseInt(code) < 1 || parseInt(code) > 99) {
        return NextResponse.json({ error: 'کد معین باید دو رقمی بین 01 تا 99 باشد' }, { status: 400 });
      }
      if (code !== current.code) {
        const duplicate = await prisma.accountSubClass.findFirst({
          where: {
            projectId: current.projectId,
            classId: current.classId,
            code,
            isActive: true,
            id: { not: subclassId }
          }
        });
        if (duplicate) {
          return NextResponse.json({ error: 'کد معین تکراری است' }, { status: 400 });
        }
        dataToUpdate.code = code;
      }
    }

    const updatedSubClass = await prisma.accountSubClass.update({
      where: { id: subclassId },
      data: dataToUpdate,
      include: {
        class: {
          include: {
            group: true
          }
        }
      }
    });

    return NextResponse.json(updatedSubClass);
  } catch (error) {
    console.error('Error updating account subclass:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subclassId = searchParams.get('id');
    
    if (!subclassId) {
      return NextResponse.json({ error: 'Subclass ID is required' }, { status: 400 });
    }
    
    const subClass = await prisma.accountSubClass.findUnique({
      where: { id: subclassId },
      select: { code: true },
    });

    if (!subClass) {
      return NextResponse.json({ error: 'Subclass not found' }, { status: 404 });
    }

    // Soft delete by setting isActive to false and modifying code
    await prisma.accountSubClass.update({
      where: { id: subclassId },
      data: { 
        isActive: false,
        code: `${subClass.code}_deleted_${new Date().toISOString()}`
      }
    });

    return NextResponse.json({ message: 'Subclass deleted successfully' });
  } catch (error) {
    console.error('Error deleting account subclass:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

