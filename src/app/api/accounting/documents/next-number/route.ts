import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get the highest document number for this project
    const lastDocument = await prisma.accountingDocument.findFirst({
      where: {
        projectId: projectId
      },
      orderBy: {
        documentNumber: 'desc'
      },
      select: {
        documentNumber: true
      }
    });

    // Generate next number
    let nextNumber = '1';
    if (lastDocument) {
      const lastNumber = parseInt(lastDocument.documentNumber);
      if (!isNaN(lastNumber)) {
        nextNumber = (lastNumber + 1).toString();
      }
    }

    return NextResponse.json({ nextNumber });
  } catch (error) {
    console.error('Error getting next document number:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

