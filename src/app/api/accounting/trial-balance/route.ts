import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";

// GET /api/accounting/trial-balance - دریافت تراز آزمایشی
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type') || 'two'; // 'two' or 'four'

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

    if (!projectId) {
      return NextResponse.json(
        { error: 'شناسه پروژه الزامی است' },
        { status: 400 }
      );
    }

    // Get all accounts with their transactions
    const accounts = await prisma.account.findMany({
      where: {
        projectId,
        isActive: true
      },
      include: {
        transactions: {
          orderBy: {
            date: 'asc'
          }
        },
        detail: {
          include: {
            subClass: {
              include: {
                class: {
                  include: {
                    group: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        {
          code: 'asc'
        }
      ]
    });

    // Calculate balances for each account
    const trialBalanceAccounts = accounts.map(account => {
      let debitBalance = 0;
      let creditBalance = 0;
      let openingDebitBalance = 0;
      let openingCreditBalance = 0;
      let closingDebitBalance = 0;
      let closingCreditBalance = 0;

      // Calculate current period balances
      account.transactions.forEach(transaction => {
        if (transaction.type === 'DEBIT') {
          debitBalance += transaction.amount;
        } else {
          creditBalance += transaction.amount;
        }
      });

      // Calculate opening balances (first half of transactions)
      const midPoint = Math.floor(account.transactions.length / 2);
      const openingTransactions = account.transactions.slice(0, midPoint);
      const closingTransactions = account.transactions.slice(midPoint);

      openingTransactions.forEach(transaction => {
        if (transaction.type === 'DEBIT') {
          openingDebitBalance += transaction.amount;
        } else {
          openingCreditBalance += transaction.amount;
        }
      });

      closingTransactions.forEach(transaction => {
        if (transaction.type === 'DEBIT') {
          closingDebitBalance += transaction.amount;
        } else {
          closingCreditBalance += transaction.amount;
        }
      });

      // Calculate net balances
      const netDebitBalance = debitBalance - creditBalance;
      const netCreditBalance = creditBalance - debitBalance;
      const netOpeningDebitBalance = openingDebitBalance - openingCreditBalance;
      const netOpeningCreditBalance = openingCreditBalance - openingDebitBalance;
      const netClosingDebitBalance = closingDebitBalance - closingCreditBalance;
      const netClosingCreditBalance = closingCreditBalance - closingDebitBalance;

      return {
        code: account.code || account.id.slice(-6),
        name: account.name,
        debitBalance: netDebitBalance > 0 ? netDebitBalance : 0,
        creditBalance: netCreditBalance > 0 ? netCreditBalance : 0,
        openingDebitBalance: netOpeningDebitBalance > 0 ? netOpeningDebitBalance : 0,
        openingCreditBalance: netOpeningCreditBalance > 0 ? netOpeningCreditBalance : 0,
        closingDebitBalance: netClosingDebitBalance > 0 ? netClosingDebitBalance : 0,
        closingCreditBalance: netClosingCreditBalance > 0 ? netClosingCreditBalance : 0
      };
    });

    // Filter out accounts with zero balances
    const activeAccounts = trialBalanceAccounts.filter(account => 
      account.debitBalance > 0 || account.creditBalance > 0 ||
      account.openingDebitBalance > 0 || account.openingCreditBalance > 0 ||
      account.closingDebitBalance > 0 || account.closingCreditBalance > 0
    );

    // Calculate totals
    const totals = {
      totalDebit: activeAccounts.reduce((sum, account) => sum + account.debitBalance, 0),
      totalCredit: activeAccounts.reduce((sum, account) => sum + account.creditBalance, 0),
      totalOpeningDebit: activeAccounts.reduce((sum, account) => sum + account.openingDebitBalance, 0),
      totalOpeningCredit: activeAccounts.reduce((sum, account) => sum + account.openingCreditBalance, 0),
      totalClosingDebit: activeAccounts.reduce((sum, account) => sum + account.closingDebitBalance, 0),
      totalClosingCredit: activeAccounts.reduce((sum, account) => sum + account.closingCreditBalance, 0)
    };

    // If no accounts with transactions, try to get accounts with ledger balances
    if (activeAccounts.length === 0) {
      const ledgerAccounts = await prisma.ledger.findMany({
        where: {
          projectId
        },
        include: {
          account: true
        }
      });

      const ledgerTrialBalance = ledgerAccounts.map(ledger => ({
        code: ledger.account.code || ledger.account.id.slice(-6),
        name: ledger.account.name,
        debitBalance: ledger.balance > 0 ? ledger.balance : 0,
        creditBalance: ledger.balance < 0 ? Math.abs(ledger.balance) : 0,
        openingDebitBalance: 0,
        openingCreditBalance: 0,
        closingDebitBalance: ledger.balance > 0 ? ledger.balance : 0,
        closingCreditBalance: ledger.balance < 0 ? Math.abs(ledger.balance) : 0
      }));

      const ledgerTotals = {
        totalDebit: ledgerTrialBalance.reduce((sum, account) => sum + account.debitBalance, 0),
        totalCredit: ledgerTrialBalance.reduce((sum, account) => sum + account.creditBalance, 0),
        totalOpeningDebit: 0,
        totalOpeningCredit: 0,
        totalClosingDebit: ledgerTrialBalance.reduce((sum, account) => sum + account.closingDebitBalance, 0),
        totalClosingCredit: ledgerTrialBalance.reduce((sum, account) => sum + account.closingCreditBalance, 0)
      };

      return NextResponse.json({
        accounts: ledgerTrialBalance,
        totals: ledgerTotals
      });
    }

    return NextResponse.json({
      accounts: activeAccounts,
      totals
    });

  } catch (error) {
    console.error('Error fetching trial balance:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تراز آزمایشی' },
      { status: 500 }
    );
  }
}

