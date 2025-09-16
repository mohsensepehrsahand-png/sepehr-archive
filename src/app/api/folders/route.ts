import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';
import { logActivity } from '@/lib/activityLogger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'شناسه پروژه الزامی است' },
        { status: 400 }
      );
    }

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // If user is not admin, check if they have access to this project
    if (userRole !== 'ADMIN' && userId) {
      const userPermission = await prisma.permission.findFirst({
        where: {
          userId: userId,
          resourceType: 'PROJECT',
          resourceId: projectId,
          accessLevel: {
            in: ['VIEW', 'ADD', 'ADMIN']
          }
        }
      });

      if (!userPermission) {
        return NextResponse.json(
          { error: 'شما دسترسی به این پروژه ندارید' },
          { status: 403 }
        );
      }
    }

    console.log('Fetching folders for projectId:', projectId);

    // First check if the project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      console.log('Project not found:', projectId);
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      );
    }

    console.log('Project found:', project.name);

    // Fetch folders for the specified project
    const folders = await prisma.folder.findMany({
      where: { projectId },
      include: {
        _count: {
          select: {
            documents: true
          }
        }
      },
      orderBy: [
        { depth: 'asc' },
        { name: 'asc' }
      ]
    });

    console.log('Found folders:', folders.length);

    // Transform the data to match the expected format
    const transformedFolders = folders.map(folder => ({
      id: folder.id,
      name: folder.name || 'پوشه بدون نام',
      description: folder.description || '',
      projectId: folder.projectId,
      parentId: folder.parentId,
      path: folder.path,
      depth: folder.depth,
      documents: folder._count.documents,
      createdAt: folder.createdAt.toISOString()
    }));

    return NextResponse.json(transformedFolders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { error: 'خطا در دریافت پوشه‌ها' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== FOLDER CREATION REQUEST START ===');
    const body = await request.json();
    const { name, description, projectId, parentId, path, depth, createdBy, tabKey = 'BUYER' } = body;

    console.log('Request body:', body);
    console.log('Parsed fields:', { name, description, projectId, parentId, path, depth, createdBy, tabKey });

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    console.log('User authentication:', { userRole, userId });

    // Only admin users can create folders
    if (userRole !== 'ADMIN') {
      console.log('Access denied: User is not admin');
      return NextResponse.json(
        { error: 'شما مجوز ایجاد پوشه ندارید' },
        { status: 403 }
      );
    }

    console.log('User is admin, proceeding with validation...');

    // Basic validation only
    if (!name || !name.trim()) {
      console.log('Validation failed: Missing folder name');
      return NextResponse.json(
        { error: 'نام پوشه الزامی است' },
        { status: 400 }
      );
    }

    if (!projectId) {
      console.log('Validation failed: Missing project ID');
      return NextResponse.json(
        { error: 'شناسه پروژه الزامی است' },
        { status: 400 }
      );
    }

    // Validate tabKey
    const validTabKeys = ['BUYER', 'CONTRACTOR', 'SUPPLIER'];
    const finalTabKey = validTabKeys.includes(tabKey) ? tabKey : 'BUYER';
    console.log('TabKey validation:', { input: tabKey, final: finalTabKey });

    console.log('Basic validation passed, checking project existence...');

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      console.log('Project not found:', projectId);
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      );
    }

    console.log('Project found:', { id: project.id, name: project.name });

    // Check if parent folder exists (if parentId is provided)
    if (parentId) {
      const parentFolder = await prisma.folder.findUnique({
        where: { id: parentId }
      });

      if (!parentFolder) {
        console.log('Parent folder not found:', parentId);
        return NextResponse.json(
          { error: 'پوشه والد یافت نشد' },
          { status: 404 }
        );
      }
      console.log('Parent folder found:', { id: parentFolder.id, name: parentFolder.name });
    }

    console.log('All validations passed, creating folder...');

    // Create new folder with minimal data
    const folderData = {
      name: name.trim(),
      description: description?.trim() || '',
      projectId,
      parentId: parentId || null,
      path: path || `/${name.trim()}`,
      depth: depth || 1,
      tabKey: finalTabKey,
      createdBy: createdBy
    };

    console.log('Final folder data for creation:', folderData);
    console.log('Name field:', folderData.name);
    console.log('Name type:', typeof folderData.name);
    console.log('Name length:', folderData.name.length);

    console.log('Final folder data for creation:', folderData);

    const newFolder = await prisma.folder.create({
      data: folderData
    });

    console.log('Folder created successfully:', newFolder);

    // Log the folder creation activity
    if (createdBy) {
      await logActivity({
        userId: createdBy,
        action: 'CREATE',
        resourceType: 'FOLDER',
        resourceId: newFolder.id,
        resourceName: newFolder.name,
        description: `پوشه "${newFolder.name}" ایجاد شد`,
        metadata: {
          projectId: newFolder.projectId,
          parentId: newFolder.parentId,
          path: newFolder.path,
          depth: newFolder.depth,
          tabKey: finalTabKey
        }
      });
    }

    const responseData = {
      id: newFolder.id,
      name: newFolder.name,
      description: newFolder.description,
      projectId: newFolder.projectId,
      parentId: newFolder.parentId,
      path: newFolder.path,
      depth: newFolder.depth,
      documents: 0,
      createdAt: newFolder.createdAt.toISOString()
    };

    console.log('=== FOLDER CREATION REQUEST SUCCESS ===');
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('=== FOLDER CREATION REQUEST ERROR ===');
    console.error('Error creating folder:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    // Return more specific error information
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'خطا در ایجاد پوشه',
          details: error.message,
          type: error.name
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'خطا در ایجاد پوشه' },
      { status: 500 }
    );
  }
}
