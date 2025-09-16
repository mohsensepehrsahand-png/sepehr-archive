import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { status } = body;
    const documentId = params.id;

    if (!status || !['TEMPORARY', 'PERMANENT'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Check if document exists
    const existingDocument = await prisma.accountingDocument.findUnique({
      where: { id: documentId }
    });

    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Update document status
    const document = await prisma.accountingDocument.update({
      where: {
        id: documentId
      },
      data: {
        status
      },
      include: {
        entries: true
      }
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error updating document status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
