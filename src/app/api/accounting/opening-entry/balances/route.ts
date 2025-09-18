import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";

// GET /api/accounting/opening-entry/balances - دریافت مانده حساب‌ها برای سند افتتاحیه
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    let userId = null;
    try {
      const userData = request.cookies.get('userData')?.value;
      if (userData) {
        userId = JSON.parse(userData).id;
      }
    } catch (error) {
      console.error('Error parsing userData cookie:', error);
    }

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

    // Calculate balances for each account
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

      // Determine if account is editable based on type
      let isEditable = false;
      if (account.type === 'ASSET' || account.type === 'LIABILITY' || account.type === 'EQUITY') {
        isEditable = true;
      }

      return {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        level: account.level,
        debitBalance,
        creditBalance,
        isEditable
      };
    });

    return NextResponse.json(accountBalances);
  } catch (error) {
    console.error('Error fetching opening entry balances:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت مانده حساب‌ها' },
      { status: 500 }
    );
  }
}
