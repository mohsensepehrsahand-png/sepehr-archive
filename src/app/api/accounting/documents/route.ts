import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Build where clause
    const whereClause: any = {
      projectId: projectId
    };

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    // Add date range filter if provided (on documentDate)
    if (dateFrom || dateTo) {
      whereClause.documentDate = {};
      if (dateFrom) {
        whereClause.documentDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.documentDate.lte = new Date(dateTo);
      }
    }

    const documents = await prisma.accountingDocument.findMany({
      where: whereClause,
      include: {
        entries: true
      },
      orderBy: {
        documentDate: 'desc'
      }
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, documentNumber, documentDate, description, entries, status = 'TEMPORARY' } = body;
    
    if (!projectId || !documentNumber || !documentDate || !entries || entries.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate totals
    const totalDebit = entries.reduce((sum: number, entry: any) => sum + (entry.debit || 0), 0);
    const totalCredit = entries.reduce((sum: number, entry: any) => sum + (entry.credit || 0), 0);

    // Validate balance
    if (totalDebit !== totalCredit) {
      return NextResponse.json({ error: 'Document is not balanced' }, { status: 400 });
    }

    const document = await prisma.accountingDocument.create({
      data: {
        projectId,
        documentNumber,
        documentDate: new Date(documentDate),
        description,
        totalDebit,
        totalCredit,
        status,
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
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

