import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const accountId = searchParams.get('accountId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!projectId || !accountId) {
      return NextResponse.json({ error: 'Project ID and Account ID are required' }, { status: 400 });
    }

    // Get the selected account
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        projectId: projectId,
        isActive: true
      }
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Build date filter
    const dateFilter: any = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo);
    }

    // Get transactions for the account
    const transactions = await prisma.transaction.findMany({
      where: {
        projectId: projectId,
        accountId: accountId,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Calculate running balance
    let runningBalance = 0;
    const entries = transactions.map(transaction => {
      const isDebitAccount = ['ASSET', 'EXPENSE'].includes(account.type);
      
      if (isDebitAccount) {
        if (transaction.type === 'DEBIT') {
          runningBalance += transaction.amount;
        } else {
          runningBalance -= transaction.amount;
        }
      } else {
        if (transaction.type === 'CREDIT') {
          runningBalance += transaction.amount;
        } else {
          runningBalance -= transaction.amount;
        }
      }

      return {
        id: transaction.id,
        date: transaction.date.toISOString(),
        description: transaction.description || '',
        reference: '', // You might want to add reference field to Transaction model
        debit: transaction.type === 'DEBIT' ? transaction.amount : 0,
        credit: transaction.type === 'CREDIT' ? transaction.amount : 0,
        balance: runningBalance,
        journalType: transaction.journalType,
        accountCode: account.code,
        accountName: account.name
      };
    });

    // Calculate summary
    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
    const closingBalance = runningBalance;

    const summary = {
      account: {
        id: account.id,
        name: account.name,
        code: account.code,
        type: account.type,
        level: account.level,
        parentId: account.parentId,
        isActive: account.isActive
      },
      openingBalance: 0, // You might want to calculate this based on previous period
      totalDebit,
      totalCredit,
      closingBalance,
      entries
    };

    return NextResponse.json([summary]);

  } catch (error) {
    console.error('Error fetching detail ledger:', error);
    return NextResponse.json(
      { error: 'Failed to fetch detail ledger data' },
      { status: 500 }
    );
  }
}
