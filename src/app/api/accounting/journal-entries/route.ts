import { NextRequest, NextResponse } from 'next/server';
import { prisma, getCurrentUser } from '../../_lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const journalType = searchParams.get('journalType');
    const accountId = searchParams.get('accountId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const whereClause: any = {
      projectId,
    };

    if (journalType) {
      whereClause.journalType = journalType;
    }

    if (accountId) {
      whereClause.accountId = accountId;
    }

    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) {
        whereClause.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.date.lte = new Date(dateTo);
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        account: true,
        document: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Group transactions by journal entry
    const journalEntries = new Map();
    
    transactions.forEach(transaction => {
      const key = `${transaction.date.toISOString().split('T')[0]}-${transaction.description}`;
      
      if (!journalEntries.has(key)) {
        journalEntries.set(key, {
          id: transaction.id,
          date: transaction.date.toISOString().split('T')[0],
          description: transaction.description,
          reference: transaction.document?.id,
          entries: [],
          totalDebit: 0,
          totalCredit: 0,
          isBalanced: false,
          createdAt: transaction.createdAt.toISOString()
        });
      }

      const entry = journalEntries.get(key);
      entry.entries.push({
        id: transaction.id,
        accountId: transaction.accountId,
        account: transaction.account,
        debit: transaction.type === 'DEBIT' ? transaction.amount : 0,
        credit: transaction.type === 'CREDIT' ? transaction.amount : 0
      });

      if (transaction.type === 'DEBIT') {
        entry.totalDebit += transaction.amount;
      } else {
        entry.totalCredit += transaction.amount;
      }
    });

    // Calculate balance and check if entries are balanced
    const result = Array.from(journalEntries.values()).map(entry => ({
      ...entry,
      isBalanced: Math.abs(entry.totalDebit - entry.totalCredit) < 0.01
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journal entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, date, description, reference, journalType, entries } = body;

    if (!projectId || !date || !description || !entries || entries.length < 2) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate double-entry bookkeeping
    const totalDebit = entries.reduce((sum: number, entry: any) => sum + (entry.debit || 0), 0);
    const totalCredit = entries.reduce((sum: number, entry: any) => sum + (entry.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: 'Total debit and credit must be equal' },
        { status: 400 }
      );
    }

    // Create transactions
    const createdTransactions = await prisma.$transaction(async (tx) => {
      const transactions = [];
      
      for (const entry of entries) {
        if (entry.debit > 0) {
          const debitTransaction = await tx.transaction.create({
            data: {
              projectId,
              accountId: entry.accountId,
              date: new Date(date),
              amount: entry.debit,
              type: 'DEBIT',
              journalType: journalType || 'DAYBOOK',
              description,
              documentId: reference || null
            }
          });
          transactions.push(debitTransaction);
        }

        if (entry.credit > 0) {
          const creditTransaction = await tx.transaction.create({
            data: {
              projectId,
              accountId: entry.accountId,
              date: new Date(date),
              amount: entry.credit,
              type: 'CREDIT',
              journalType: journalType || 'DAYBOOK',
              description,
              documentId: reference || null
            }
          });
          transactions.push(creditTransaction);
        }
      }

      return transactions;
    });

    return NextResponse.json(createdTransactions);
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return NextResponse.json(
      { error: 'Failed to create journal entry' },
      { status: 500 }
    );
  }
}
