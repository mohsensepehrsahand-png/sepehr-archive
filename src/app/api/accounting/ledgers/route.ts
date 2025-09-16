import { NextRequest, NextResponse } from 'next/server';
import { prisma, getCurrentUser } from '../../_lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can access accounting
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز دسترسی به بخش حسابداری ندارید' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const accountId = searchParams.get('accountId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get all accounts for the project
    const accounts = await prisma.account.findMany({
      where: {
        projectId,
        isActive: true
      },
      orderBy: {
        code: 'asc'
      }
    });

    const accountSummaries = [];

    for (const account of accounts) {
      if (accountId && account.id !== accountId) continue;

      const whereClause: any = {
        projectId,
        accountId: account.id
      };

      if (dateFrom || dateTo) {
        whereClause.date = {};
        if (dateFrom) {
          whereClause.date.gte = new Date(dateFrom);
        }
        if (dateTo) {
          whereClause.date.lte = new Date(dateTo);
        }
      }

      // Get all transactions for this account
      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: {
          account: true,
          document: true
        },
        orderBy: {
          date: 'asc'
        }
      });

      // Calculate opening balance (sum of all transactions before the date range)
      const openingBalanceWhere = {
        projectId,
        accountId: account.id
      };

      if (dateFrom) {
        openingBalanceWhere.date = {
          lt: new Date(dateFrom)
        };
      }

      const openingTransactions = await prisma.transaction.findMany({
        where: openingBalanceWhere
      });

      let openingBalance = 0;
      openingTransactions.forEach(transaction => {
        if (transaction.type === 'DEBIT') {
          openingBalance += transaction.amount;
        } else {
          openingBalance -= transaction.amount;
        }
      });

      // Calculate totals for the period
      let totalDebit = 0;
      let totalCredit = 0;
      let runningBalance = openingBalance;

      const entries = transactions.map(transaction => {
        if (transaction.type === 'DEBIT') {
          totalDebit += transaction.amount;
          runningBalance += transaction.amount;
        } else {
          totalCredit += transaction.amount;
          runningBalance -= transaction.amount;
        }

        return {
          id: transaction.id,
          date: transaction.date.toISOString().split('T')[0],
          description: transaction.description,
          reference: transaction.document?.id,
          debit: transaction.type === 'DEBIT' ? transaction.amount : 0,
          credit: transaction.type === 'CREDIT' ? transaction.amount : 0,
          balance: runningBalance,
          journalType: transaction.journalType
        };
      });

      accountSummaries.push({
        account,
        openingBalance,
        totalDebit,
        totalCredit,
        closingBalance: runningBalance,
        entries
      });
    }

    return NextResponse.json(accountSummaries);
  } catch (error) {
    console.error('Error fetching ledger data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ledger data' },
      { status: 500 }
    );
  }
}