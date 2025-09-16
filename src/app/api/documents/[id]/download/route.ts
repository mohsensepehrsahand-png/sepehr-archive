import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';

// GET /api/documents/[id]/download - دانلود سند
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'شناسه سند الزامی است' },
        { status: 400 }
      );
    }

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Get document with folder information
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        folder: true
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'سند یافت نشد' },
        { status: 404 }
      );
    }

    // Check if user has access
    if (userRole !== 'ADMIN') {
      // For non-admin users, check folder permissions
      if (!userId) {
        return NextResponse.json(
          { error: 'شما مجوز دسترسی به این سند ندارید' },
          { status: 403 }
        );
      }

      // If document is in a folder, check folder permissions
      if (document.folderId) {
        const folderPermission = await prisma.folderPermissions.findUnique({
          where: {
            folderId_userId: {
              folderId: document.folderId,
              userId: userId
            }
          }
        });

        if (!folderPermission || !folderPermission.canView) {
          return NextResponse.json(
            { error: 'شما مجوز دسترسی به این سند ندارید' },
            { status: 403 }
          );
        }
      } else {
        // For root level documents, only admin can access
        return NextResponse.json(
          { error: 'شما مجوز دسترسی به این سند ندارید' },
          { status: 403 }
        );
      }
    }

    // Construct file path - filePath already includes 'uploads/'
    const filePath = join(process.cwd(), document.filePath);
    
    console.log('Document filePath:', document.filePath);
    console.log('Full file path:', filePath);
    console.log('Current working directory:', process.cwd());
    
    try {
      // Read file
      const fileBuffer = await readFile(filePath);
      
      // Set appropriate headers
      const headers = new Headers();
      headers.set('Content-Type', document.mimeType);
      headers.set('Content-Disposition', `inline; filename="${document.originalName}"`);
      headers.set('Content-Length', fileBuffer.length.toString());
      
      // Return file
      return new NextResponse(fileBuffer, {
        status: 200,
        headers
      });
    } catch (fileError) {
      console.error('Error reading file:', fileError);
      console.error('File path that failed:', filePath);
      return NextResponse.json(
        { 
          error: 'خطا در خواندن فایل',
          details: fileError instanceof Error ? fileError.message : 'Unknown error',
          filePath: filePath
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json(
      { error: 'خطا در دانلود سند' },
      { status: 500 }
    );
  }
}