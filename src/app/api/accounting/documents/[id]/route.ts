import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { documentNumber, documentDate, description, entries } = body;
    const documentId = params.id;

    if (!documentNumber || !documentDate || !entries || entries.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if document exists and is not permanent
    const existingDocument = await prisma.accountingDocument.findUnique({
      where: { id: documentId }
    });

    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (existingDocument.status === 'PERMANENT') {
      return NextResponse.json({ error: 'Cannot edit permanent documents' }, { status: 400 });
    }

    // Calculate totals
    const totalDebit = entries.reduce((sum: number, entry: any) => sum + (entry.debit || 0), 0);
    const totalCredit = entries.reduce((sum: number, entry: any) => sum + (entry.credit || 0), 0);

    // Validate balance
    if (totalDebit !== totalCredit) {
      return NextResponse.json({ error: 'Document is not balanced' }, { status: 400 });
    }

    // Delete existing entries
    await prisma.accountingEntry.deleteMany({
      where: {
        documentId: documentId
      }
    });

    // Update document and create new entries
    const document = await prisma.accountingDocument.update({
      where: {
        id: documentId
      },
      data: {
        documentNumber,
        documentDate: new Date(documentDate),
        description,
        totalDebit,
        totalCredit,
        entries: {
          create: entries.map((entry: any) => ({
            accountCode: entry.accountCode,
            accountName: entry.accountName,
            description: entry.description,
            debit: entry.debit,
            credit: entry.credit,
            accountNature: entry.accountNature
          }))
        }
      },
      include: {
        entries: true
      }
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const documentId = params.id;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can delete documents
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز حذف سند ندارید' },
        { status: 403 }
      );
    }

    // Get document info before deletion
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

    // If document is permanent, return error
    if (document.status === 'PERMANENT') {
      return NextResponse.json(
        { 
          error: 'اسناد دایم قابل حذف نیستند',
          canConvertToTemporary: true,
          message: 'آیا می‌خواهید این سند را به حالت موقت تبدیل کنید؟'
        },
        { status: 400 }
      );
    }

    // Delete entries first (due to foreign key constraint)
    await prisma.accountingEntry.deleteMany({
      where: {
        documentId: documentId
      }
    });

    // Delete document
    await prisma.accountingDocument.delete({
      where: {
        id: documentId
      }
    });

    // TODO: Add activity logging here if needed

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
