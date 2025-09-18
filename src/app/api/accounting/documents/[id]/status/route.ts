import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const body = await request.json();
    const { status } = body;

    if (!status || !['TEMPORARY', 'PERMANENT'].includes(status)) {
      return NextResponse.json(
        { error: 'وضعیت نامعتبر است' },
        { status: 400 }
      );
    }

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can change document status
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز تغییر وضعیت سند ندارید' },
        { status: 403 }
      );
    }

    // Get document info before updating
    const document = await prisma.accountingDocument.findUnique({
      where: { id: documentId },
      include: {
        project: {
          select: {
            name: true
          }
        }
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'سند یافت نشد' },
        { status: 404 }
      );
    }

    // Update document status
    const updatedDocument = await prisma.accountingDocument.update({
      where: { id: documentId },
      data: { status },
      include: {
        entries: true
      }
    });

    // Log the status change activity
    if (userId) {
      const statusText = status === 'TEMPORARY' ? 'موقت' : 'دائم';
      await logActivity({
        userId,
        action: 'UPDATE',
        resourceType: 'PROJECT',
        resourceId: document.projectId,
        resourceName: document.project.name,
        description: `وضعیت سند "${document.documentNumber}" به ${statusText} تغییر یافت`,
        metadata: {
          documentId: document.id,
          oldStatus: document.status,
          newStatus: status
        }
      });
    }

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Error changing document status:', error);
    return NextResponse.json(
      { error: 'خطا در تغییر وضعیت سند' },
      { status: 500 }
    );
  }
}