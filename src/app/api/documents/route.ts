import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { logActivity } from "@/lib/activityLogger";

// GET /api/documents - دریافت لیست اسناد
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const folderId = searchParams.get('folderId');

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

    const where: any = { projectId };
    if (folderId) {
      where.folderId = folderId;
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        folder: {
          select: {
            name: true
          }
        },
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

    const documentsWithDetails = documents.map((doc: any) => ({
      ...doc,
      uploadedBy: doc.createdByUser ? 
        `${doc.createdByUser.firstName || ''} ${doc.createdByUser.lastName || ''}`.trim() || 
        doc.createdByUser.username : 
        'نامشخص',
      folderName: doc.folder?.name || 'پوشه اصلی',
      folderId: doc.folderId // Add folderId to the response
    }));

    return NextResponse.json(documentsWithDetails);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اسناد' },
      { status: 500 }
    );
  }
}

// POST /api/documents - آپلود سند جدید
export async function POST(request: NextRequest) {
  try {
    console.log('=== DOCUMENT UPLOAD REQUEST START ===');
    const formData = await request.formData();
    
    console.log('FormData received, extracting fields...');
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const projectId = formData.get('projectId') as string;
    const folderId = formData.get('folderId') as string;
    const createdBy = formData.get('createdBy') as string;
    const file = formData.get('file') as File;

    console.log('Extracted fields:', { 
      name, 
      description, 
      projectId, 
      folderId, 
      createdBy, 
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type
    });

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    console.log('User authentication:', { userRole, userId });

    // Only admin users can upload documents
    if (userRole !== 'ADMIN') {
      console.log('Access denied: User is not admin');
      return NextResponse.json(
        { error: 'شما مجوز آپلود سند ندارید' },
        { status: 403 }
      );
    }

    console.log('User is admin, proceeding with validation...');

    // Enhanced validation with better error messages
    if (!name || !name.trim()) {
      console.log('Validation failed: Missing document name');
      return NextResponse.json(
        { error: 'نام سند الزامی است' },
        { status: 400 }
      );
    }

    if (!projectId || !projectId.trim()) {
      console.log('Validation failed: Missing project ID');
      return NextResponse.json(
        { error: 'شناسه پروژه الزامی است' },
        { status: 400 }
      );
    }

    if (!folderId || !folderId.trim()) {
      console.log('Validation failed: Missing folder ID');
      return NextResponse.json(
        { error: 'شناسه پوشه الزامی است' },
        { status: 400 }
      );
    }

    if (!createdBy || !createdBy.trim()) {
      console.log('Validation failed: Missing creator ID');
      return NextResponse.json(
        { error: 'شناسه کاربر ایجادکننده الزامی است' },
        { status: 400 }
      );
    }

    if (!file) {
      console.log('Validation failed: No file provided');
      return NextResponse.json(
        { error: 'فایل الزامی است' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size === 0) {
      console.log('Validation failed: File is empty');
      return NextResponse.json(
        { error: 'فایل خالی است' },
        { status: 400 }
      );
    }

    console.log('Basic validation passed, checking project and folder existence...');

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

    // Check if folder exists (only if folderId is not the same as projectId)
    if (folderId !== projectId) {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId }
      });

      if (!folder) {
        console.log('Folder not found:', folderId);
        return NextResponse.json(
          { error: 'پوشه یافت نشد' },
          { status: 404 }
        );
      }

      // Check if folder belongs to the project
      if (folder.projectId !== projectId) {
        console.log('Folder does not belong to project:', { folderProjectId: folder.projectId, requestProjectId: projectId });
        return NextResponse.json(
          { error: 'پوشه متعلق به این پروژه نیست' },
          { status: 400 }
        );
      }
      console.log('Folder found:', { id: folder.id, name: folder.name });
    } else {
      console.log('Uploading to root level (project root)');
    }

    console.log('Project and folder validation passed, checking file type and size...');

    // بررسی نوع فایل
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      console.log('File type not allowed:', file.type);
      return NextResponse.json(
        { error: `نوع فایل ${file.type} پشتیبانی نمی‌شود. انواع مجاز: PDF، تصاویر، Word، Excel` },
        { status: 400 }
      );
    }

    // بررسی اندازه فایل (حداکثر 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      console.log('File size too large:', { fileSize: file.size, maxSize });
      return NextResponse.json(
        { error: 'اندازه فایل نباید بیشتر از 50 مگابایت باشد' },
        { status: 400 }
      );
    }

    console.log('File validation passed, creating upload directory...');

    // ایجاد مسیر ذخیره فایل
    let uploadDir: string;
    if (folderId === projectId) {
      // Root level documents
      uploadDir = join(process.cwd(), 'uploads', projectId, 'root');
    } else {
      // Folder documents
      uploadDir = join(process.cwd(), 'uploads', projectId, folderId);
    }
    
    console.log('Creating upload directory:', uploadDir);
    
    try {
      await mkdir(uploadDir, { recursive: true });
      console.log('Upload directory created successfully');
    } catch (dirError) {
      console.error('Error creating upload directory:', dirError);
      return NextResponse.json(
        { error: 'خطا در ایجاد پوشه آپلود' },
        { status: 500 }
      );
    }

    // ذخیره فایل
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = join(uploadDir, fileName);
    console.log('Saving file to:', filePath);
    
    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      console.log('File saved successfully to disk');
    } catch (fileError) {
      console.error('Error saving file to disk:', fileError);
      throw new Error('خطا در ذخیره فایل');
    }

    console.log('File saved to disk, creating database record...');

    // ذخیره اطلاعات در دیتابیس
    const documentData = {
      name: name.trim(),
      description: description?.trim() || '',
      projectId,
      folderId: folderId === projectId ? null : folderId, // Set folderId to null for root documents
      mimeType: file.type,
      fileExt: file.name.split('.').pop() || '',
      sizeBytes: file.size,
      filePath: folderId === projectId ? 
        `uploads/${projectId}/root/${fileName}` : 
        `uploads/${projectId}/${folderId}/${fileName}`,
      createdBy,
      isUserUploaded: true
    };

    console.log('Document data for database:', documentData);

    const document = await prisma.document.create({
      data: documentData,
      include: {
        createdByUser: {
          select: {
            firstName: true,
            lastName: true,
            username: true
          }
        },
        folder: {
          select: {
            name: true
          }
        }
      }
    });

    console.log('Document created in database successfully');

    // Log the document creation activity
    if (createdBy) {
      await logActivity({
        userId: createdBy,
        action: 'CREATE',
        resourceType: 'DOCUMENT',
        resourceId: document.id,
        resourceName: document.name,
        description: `سند "${document.name}" آپلود شد`,
        metadata: {
          mimeType: document.mimeType,
          sizeBytes: document.sizeBytes,
          folderId: document.folderId,
          projectId: document.projectId
        }
      });
    }

    const documentWithDetails = {
      ...document,
      uploadedBy: document.createdByUser ? 
        `${document.createdByUser.firstName || ''} ${document.createdByUser.lastName || ''}`.trim() || 
        document.createdByUser.username : 
        'نامشخص',
      folderName: document.folder?.name || 'پوشه اصلی',
      folderId: document.folderId // Add folderId to the response
    };

    console.log('=== DOCUMENT UPLOAD REQUEST SUCCESS ===');
    console.log('Final document data:', documentWithDetails);
    return NextResponse.json(documentWithDetails, { status: 201 });
  } catch (error) {
    console.error('=== DOCUMENT UPLOAD REQUEST ERROR ===');
    console.error('Error uploading document:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { error: `خطا در آپلود سند: ${error instanceof Error ? error.message : 'خطای نامشخص'}` },
      { status: 500 }
    );
  }
}
