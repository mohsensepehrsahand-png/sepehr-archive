import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard/recent-documents - دریافت اسناد اخیر
export async function GET(request: NextRequest) {
  try {
    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userDataCookie = request.cookies.get('userData')?.value;
    
    let userId = null;
    if (userDataCookie) {
      try {
        const userData = JSON.parse(userDataCookie);
        userId = userData.id;
      } catch (error) {
        console.error('Error parsing userData cookie:', error);
      }
    }

    // Only admin users can access dashboard data
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز دسترسی به این اطلاعات ندارید' },
        { status: 403 }
      );
    }

    // Get recent documents (last 10 documents)
    const recentDocuments = await prisma.document.findMany({
      include: {
        createdByUser: {
          select: {
            firstName: true,
            lastName: true,
            username: true
          }
        },
        project: {
          select: {
            name: true
          }
        },
        folder: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Format documents for display
    const formattedDocuments = recentDocuments.map(doc => ({
      id: doc.id,
      name: doc.name,
      description: doc.description || 'بدون توضیحات',
      mimeType: doc.mimeType,
      fileExt: doc.fileExt,
      sizeBytes: doc.sizeBytes,
      sizeFormatted: formatFileSize(doc.sizeBytes),
      uploadedBy: doc.createdByUser ? 
        `${doc.createdByUser.firstName || ''} ${doc.createdByUser.lastName || ''}`.trim() || 
        doc.createdByUser.username : 
        'نامشخص',
      projectName: doc.project.name,
      folderName: doc.folder?.name || 'پوشه اصلی',
      createdAt: doc.createdAt,
      isImage: doc.mimeType.startsWith('image/'),
      isPdf: doc.mimeType === 'application/pdf',
      isDocument: doc.mimeType.includes('word') || doc.mimeType.includes('document'),
      isSpreadsheet: doc.mimeType.includes('excel') || doc.mimeType.includes('spreadsheet')
    }));

    return NextResponse.json(formattedDocuments, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching recent documents:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اسناد اخیر' },
      { status: 500 }
    );
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
