import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';

const DEFAULT_ACCOUNTING_GROUPS = [
  {
    code: '1',
    name: 'دارایی‌ها',
    isDefault: true,
    isProtected: true,
    sortOrder: 1
  },
  {
    code: '2', 
    name: 'بدهی‌ها',
    isDefault: true,
    isProtected: true,
    sortOrder: 2
  },
  {
    code: '3',
    name: 'سرمایه',
    isDefault: true,
    isProtected: true,
    sortOrder: 3
  },
  {
    code: '4',
    name: 'درآمدها',
    isDefault: true,
    isProtected: true,
    sortOrder: 4
  },
  {
    code: '5',
    name: 'هزینه‌ها',
    isDefault: true,
    isProtected: true,
    sortOrder: 5
  }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if groups already exist for this project
    const existingGroups = await prisma.accountGroup.findFirst({
      where: { projectId }
    });

    if (existingGroups) {
      return NextResponse.json({ 
        message: 'Accounting groups already exist for this project',
        groupsExist: true 
      });
    }

    // Create default accounting groups
    const createdGroups = [];
    for (const groupData of DEFAULT_ACCOUNTING_GROUPS) {
      const group = await prisma.accountGroup.create({
        data: {
          projectId,
          code: groupData.code,
          name: groupData.name,
          isDefault: groupData.isDefault,
          isProtected: groupData.isProtected,
          sortOrder: groupData.sortOrder
        }
      });
      createdGroups.push(group);
    }

    return NextResponse.json({
      message: 'Accounting groups initialized successfully',
      groupsCreated: createdGroups.length,
      groups: createdGroups
    });
  } catch (error) {
    console.error('Error initializing accounting groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
