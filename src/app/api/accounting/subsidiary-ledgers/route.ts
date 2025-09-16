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
    const type = searchParams.get('type');
    const accountId = searchParams.get('accountId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get accounts by type (CUSTOMER, CONTRACTOR, SUPPLIER)
    const whereClause: any = {
      projectId,
      isActive: true
    };

    if (type) {
      whereClause.type = type;
    }

    if (accountId) {
      whereClause.id = accountId;
    }

    const accounts = await prisma.account.findMany({
      where: whereClause,
      orderBy: {
        code: 'asc'
      }
    });

    const subsidiarySummaries = [];

    for (const account of accounts) {
      const transactionWhere: any = {
        projectId,
        accountId: account.id
      };

      if (dateFrom || dateTo) {
        transactionWhere.date = {};
        if (dateFrom) {
          transactionWhere.date.gte = new Date(dateFrom);
        }
        if (dateTo) {
          transactionWhere.date.lte = new Date(dateTo);
        }
      }

      // Get all transactions for this account
      const transactions = await prisma.transaction.findMany({
        where: transactionWhere,
        include: {
          account: true,
          document: true
        },
        orderBy: {
          date: 'asc'
        }
      });

      // Calculate opening balance
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

      // Calculate totals and create entries
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
          journalType: transaction.journalType,
          relatedAccount: transaction.account.name
        };
      });

      // Get related accounts (accounts that have transactions with this account)
      const relatedAccountIds = new Set();
      transactions.forEach(transaction => {
        // Find transactions that reference this account
        // This would need to be enhanced based on your business logic
      });

      const relatedAccounts = [];

      subsidiarySummaries.push({
        account,
        openingBalance,
        totalDebit,
        totalCredit,
        closingBalance: runningBalance,
        entries,
        relatedAccounts
      });
    }

    return NextResponse.json(subsidiarySummaries);
  } catch (error) {
    console.error('Error fetching subsidiary ledger data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subsidiary ledger data' },
      { status: 500 }
    );
  }
}
