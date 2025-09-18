import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const groups = await prisma.accountGroup.findMany({
      where: { 
        projectId,
        isActive: true 
      },
      include: {
        classes: {
          include: {
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
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching account groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, code, name, isDefault = false, isProtected = true } = body;

    console.log('POST /api/accounting/coding/groups - Request data:', {
      projectId,
      code,
      name,
      isDefault,
      isProtected
    });

    if (!projectId || !code || !name) {
      return NextResponse.json({ error: 'Project ID, code, and name are required' }, { status: 400 });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get next sort order (needed for both new and reactivated groups)
    const lastGroup = await prisma.accountGroup.findFirst({
      where: { projectId },
      orderBy: { sortOrder: 'desc' }
    });

    // Check if code already exists for this project (including inactive groups)
    const existingGroup = await prisma.accountGroup.findFirst({
      where: { 
        projectId, 
        code
      }
    });

    if (existingGroup) {
      if (existingGroup.isActive) {
        return NextResponse.json({ error: 'Group code already exists' }, { status: 400 });
      } else {
        // Reactivate the existing group instead of creating a new one
        const reactivatedGroup = await prisma.accountGroup.update({
          where: { id: existingGroup.id },
          data: {
            name,
            isDefault,
            isProtected,
            isActive: true,
            sortOrder: (lastGroup?.sortOrder || 0) + 1
          }
        });
        return NextResponse.json(reactivatedGroup);
      }
    }

    const newGroup = await prisma.accountGroup.create({
      data: {
        projectId,
        code,
        name,
        isDefault,
        isProtected,
        sortOrder: (lastGroup?.sortOrder || 0) + 1
      }
    });

    return NextResponse.json(newGroup);
  } catch (error) {
    console.error('Error creating account group:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const { code, name, isDefault = false, isProtected = false } = body;

    console.log('PUT /api/accounting/coding/groups - Request data:', {
      id,
      code,
      name,
      isDefault,
      isProtected
    });

    if (!id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    // Check if group exists
    const existingGroup = await prisma.accountGroup.findUnique({
      where: { id }
    });

    console.log('Existing group found:', existingGroup);

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if code already exists for this project (excluding current group)
    const duplicateGroup = await prisma.accountGroup.findFirst({
      where: { 
        projectId: existingGroup.projectId, 
        code,
        isActive: true,
        id: { not: id }
      }
    });

    if (duplicateGroup) {
      return NextResponse.json({ error: 'Group code already exists' }, { status: 400 });
    }

    // Update the group
    const updatedGroup = await prisma.accountGroup.update({
      where: { id },
      data: {
        code,
        name,
        isDefault,
        isProtected
      }
    });

    console.log('Group updated successfully:', updatedGroup);

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Error updating account group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const id = searchParams.get('id');

    if (projectId && !id) {
      // Delete all groups for this project (cascade delete will handle related data)
      await prisma.accountGroup.deleteMany({
        where: { projectId }
      });

      return NextResponse.json({ message: 'All groups deleted successfully' });
    } else if (id) {
      // Delete specific group
      const group = await prisma.accountGroup.findUnique({
        where: { id }
      });

      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }

      // Check if group is protected
      if (group.isProtected) {
        return NextResponse.json({ error: 'Cannot delete protected group' }, { status: 400 });
      }

      // Soft delete the group
      await prisma.accountGroup.update({
        where: { id },
        data: { isActive: false }
      });

      return NextResponse.json({ message: 'Group deleted successfully' });
    } else {
      return NextResponse.json({ error: 'Project ID or Group ID is required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error deleting groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

