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
    const { projectId, code, name, isDefault = false, isProtected = false } = body;

    if (!projectId || !code || !name) {
      return NextResponse.json({ error: 'Project ID, code, and name are required' }, { status: 400 });
    }

    // Check if code already exists for this project
    const existingGroup = await prisma.accountGroup.findFirst({
      where: { 
        projectId, 
        code,
        isActive: true
      }
    });

    if (existingGroup) {
      return NextResponse.json({ error: 'Group code already exists' }, { status: 400 });
    }

    // Get next sort order
    const lastGroup = await prisma.accountGroup.findFirst({
      where: { projectId },
      orderBy: { sortOrder: 'desc' }
    });

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Delete all groups for this project (cascade delete will handle related data)
    await prisma.accountGroup.deleteMany({
      where: { projectId }
    });

    return NextResponse.json({ message: 'All groups deleted successfully' });
  } catch (error) {
    console.error('Error deleting groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

