import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { logActivity } from "@/lib/activityLogger";

// POST /api/accounting/opening-entry - ثبت سند افتتاحیه
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, accounts, documentDate, documentDescription } = body;

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

    // Only admin users can create opening entries
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ایجاد سند افتتاحیه ندارید' },
        { status: 403 }
      );
    }

    if (!projectId || !accounts || !Array.isArray(accounts)) {
      return NextResponse.json(
        { error: 'شناسه پروژه و لیست حساب‌ها الزامی است' },
        { status: 400 }
      );
    }

    // Validate that the entry is balanced
    let totalDebit = 0;
    let totalCredit = 0;

    accounts.forEach((account: any) => {
      totalDebit += account.debit || 0;
      totalCredit += account.credit || 0;
    });

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: 'سند تراز نیست. جمع بدهکار باید برابر جمع بستانکار باشد.' },
        { status: 400 }
      );
    }

    // Get or create current fiscal year
    const currentYear = new Date().getFullYear();
    let fiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        projectId,
        year: currentYear,
        isActive: true
      }
    });

    if (!fiscalYear) {
      // Create new fiscal year
      const startDate = new Date(currentYear, 0, 1); // January 1st
      const endDate = new Date(currentYear, 11, 31); // December 31st
      
      fiscalYear = await prisma.fiscalYear.create({
        data: {
          projectId,
          year: currentYear,
          startDate,
          endDate,
          isActive: true,
          isClosed: false
        }
      });
    }

    // Generate document number
    const documentCount = await prisma.accountingDocument.count({
      where: { projectId }
    });
    const documentNumber = `OP-${String(documentCount + 1).padStart(4, '0')}`;

    // Create the opening entry document
    const document = await prisma.accountingDocument.create({
      data: {
        projectId,
        documentNumber,
        documentDate: documentDate ? new Date(documentDate) : new Date(),
        description: documentDescription || 'سند افتتاحیه - مانده اول دوره',
        totalDebit,
        totalCredit,
        status: 'PERMANENT'
      }
    });

    // Update fiscal year with opening entry
    await prisma.fiscalYear.update({
      where: { id: fiscalYear.id },
      data: { openingEntryId: document.id }
    });

    // Create accounting entries
    const entries = accounts.map((account: any) => ({
      documentId: document.id,
      accountCode: account.accountCode || '',
      accountName: account.accountName || '',
      description: account.description || `مانده اول دوره - ${account.accountName || ''}`,
      debit: account.debit || 0,
      credit: account.credit || 0,
      accountNature: account.debit > 0 ? 'DEBIT' : 'CREDIT'
    }));

    await prisma.accountingEntry.createMany({
      data: entries
    });

    // Create transactions for each account
    for (const account of accounts) {
      if (account.debit > 0) {
        await prisma.transaction.create({
          data: {
            projectId,
            accountId: account.accountId,
            date: new Date(),
            amount: account.debit,
            type: 'DEBIT',
            journalType: 'GENERAL_LEDGER',
            description: 'مانده اول دوره - بدهکار'
          }
        });
      }
      if (account.credit > 0) {
        await prisma.transaction.create({
          data: {
            projectId,
            accountId: account.accountId,
            date: new Date(),
            amount: account.credit,
            type: 'CREDIT',
            journalType: 'GENERAL_LEDGER',
            description: 'مانده اول دوره - بستانکار'
          }
        });
      }
    }

    // Log activity
    await logActivity({
      userId: userId || 'system',
      action: 'CREATE',
      resourceType: 'PROJECT',
      resourceId: projectId,
      resourceName: 'سند افتتاحیه',
      description: `سند افتتاحیه با شماره ${documentNumber} ثبت شد`,
      metadata: JSON.stringify({
        documentId: document.id,
        totalDebit,
        totalCredit,
        accountCount: accounts.length
      })
    });

    return NextResponse.json({
      success: true,
      documentId: document.id,
      documentNumber,
      message: 'سند افتتاحیه با موفقیت ثبت شد'
    });
  } catch (error) {
    console.error('Error creating opening entry:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت سند افتتاحیه' },
      { status: 500 }
    );
  }
}
