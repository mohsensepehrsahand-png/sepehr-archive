import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";

// GET /api/accounting/closing-entry/balances - دریافت مانده حساب‌ها برای سند اختتامیه
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

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

    // Check if this is a new company (no previous year data)
    const hasPreviousTransactions = await prisma.transaction.findFirst({
      where: {
        projectId,
        journalType: 'GENERAL_LEDGER'
      }
    });

    const isNewCompany = !hasPreviousTransactions;

    // Get all accounts for the project
    const accounts = await prisma.account.findMany({
      where: {
        projectId,
        isActive: true
      },
      include: {
        transactions: {
          where: {
            journalType: 'GENERAL_LEDGER'
          }
        }
      },
      orderBy: [
        { type: 'asc' },
        { code: 'asc' }
      ]
    });

    // Calculate balances and determine closing status for each account
    const accountBalances = accounts.map(account => {
      let debitBalance = 0;
      let creditBalance = 0;

      // Calculate balance from transactions
      account.transactions.forEach(transaction => {
        if (transaction.type === 'DEBIT') {
          debitBalance += transaction.amount;
        } else {
          creditBalance += transaction.amount;
        }
      });

      // Determine closing status based on account type
      let willBeClosed = false;
      let transferredToNextYear = false;
      let isEditable = false;

      switch (account.type) {
        case 'INCOME':
        case 'EXPENSE':
          willBeClosed = true;
          isEditable = true;
          break;
        case 'ASSET':
        case 'LIABILITY':
          transferredToNextYear = true;
          isEditable = true;
          break;
        case 'EQUITY':
          transferredToNextYear = true;
          isEditable = true;
          break;
        default:
          isEditable = false;
      }

      return {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        level: account.level,
        debitBalance: isNewCompany ? 0 : debitBalance,
        creditBalance: isNewCompany ? 0 : creditBalance,
        isEditable,
        willBeClosed,
        transferredToNextYear
      };
    });

    // For new companies, set initial capital for equity accounts
    const initialCapital = isNewCompany ? 1000000 : 0; // Default 1M for new companies

    return NextResponse.json({
      accounts: accountBalances,
      isNewCompany,
      initialCapital
    });
  } catch (error) {
    console.error('Error fetching closing entry balances:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت مانده حساب‌ها' },
      { status: 500 }
    );
  }
}


