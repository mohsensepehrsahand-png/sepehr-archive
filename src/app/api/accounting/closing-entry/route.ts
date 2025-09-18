import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { logActivity } from "@/lib/activityLogger";

// POST /api/accounting/closing-entry - ثبت سند اختتامیه
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, closingDate, initialCapital, accounts } = body;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can create closing entries
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ایجاد سند اختتامیه ندارید' },
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

    // Get current fiscal year
    const currentYear = new Date().getFullYear();
    let fiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        projectId,
        year: currentYear,
        isActive: true
      }
    });

    if (!fiscalYear) {
      return NextResponse.json(
        { error: 'سال مالی فعال یافت نشد. ابتدا سند افتتاحیه را ثبت کنید.' },
        { status: 400 }
      );
    }

    // Generate document number
    const documentCount = await prisma.accountingDocument.count({
      where: { projectId }
    });
    const documentNumber = `CL-${String(documentCount + 1).padStart(4, '0')}`;

    // Create the closing entry document
    const document = await prisma.accountingDocument.create({
      data: {
        projectId,
        documentNumber,
        documentDate: new Date(closingDate),
        description: 'سند اختتامیه - بستن حساب‌ها و انتقال مانده‌ها',
        totalDebit,
        totalCredit,
        status: 'PERMANENT'
      }
    });

    // Update fiscal year with closing entry and mark as closed
    await prisma.fiscalYear.update({
      where: { id: fiscalYear.id },
      data: { 
        closingEntryId: document.id,
        isClosed: true,
        isActive: false
      }
    });

    // Create accounting entries
    const entries = accounts.map((account: any) => ({
      documentId: document.id,
      accountCode: account.accountCode || '',
      accountName: account.accountName || '',
      description: account.willBeClosed ? 
        `بستن حساب - ${account.accountName || ''}` : 
        `انتقال به سال بعد - ${account.accountName || ''}`,
      debit: account.debit || 0,
      credit: account.credit || 0,
      accountNature: account.debit > 0 ? 'DEBIT' : 'CREDIT'
    }));

    await prisma.accountingEntry.createMany({
      data: entries
    });

    // Process each account based on its closing status
    for (const account of accounts) {
      if (account.willBeClosed) {
        // Close income and expense accounts
        if (account.debit > 0) {
          await prisma.transaction.create({
            data: {
              projectId,
              accountId: account.accountId,
              date: new Date(closingDate),
              amount: account.debit,
              type: 'DEBIT',
              journalType: 'GENERAL_LEDGER',
              description: 'بستن حساب - بدهکار'
            }
          });
        }
        if (account.credit > 0) {
          await prisma.transaction.create({
            data: {
              projectId,
              accountId: account.accountId,
              date: new Date(closingDate),
              amount: account.credit,
              type: 'CREDIT',
              journalType: 'GENERAL_LEDGER',
              description: 'بستن حساب - بستانکار'
            }
          });
        }
      } else if (account.transferredToNextYear) {
        // Transfer asset, liability, and equity accounts to next year
        if (account.debit > 0) {
          await prisma.transaction.create({
            data: {
              projectId,
              accountId: account.accountId,
              date: new Date(closingDate),
              amount: account.debit,
              type: 'DEBIT',
              journalType: 'GENERAL_LEDGER',
              description: 'انتقال به سال بعد - بدهکار'
            }
          });
        }
        if (account.credit > 0) {
          await prisma.transaction.create({
            data: {
              projectId,
              accountId: account.accountId,
              date: new Date(closingDate),
              amount: account.credit,
              type: 'CREDIT',
              journalType: 'GENERAL_LEDGER',
              description: 'انتقال به سال بعد - بستانکار'
            }
          });
        }
      }
    }

    // If this is a new company, create initial capital entry
    if (initialCapital && initialCapital > 0) {
      // Find or create equity account for initial capital
      let equityAccount = await prisma.account.findFirst({
        where: {
          projectId,
          type: 'EQUITY',
          name: { contains: 'سرمایه' }
        }
      });

      if (!equityAccount) {
        // Create initial capital account
        equityAccount = await prisma.account.create({
          data: {
            projectId,
            name: 'سرمایه اولیه',
            code: '300000000',
            type: 'EQUITY',
            level: 1,
            description: 'سرمایه اولیه شرکت'
          }
        });
      }

      // Create initial capital transaction
      await prisma.transaction.create({
        data: {
          projectId,
          accountId: equityAccount.id,
          date: new Date(closingDate),
          amount: initialCapital,
          type: 'CREDIT',
          journalType: 'GENERAL_LEDGER',
          description: 'سرمایه اولیه شرکت'
        }
      });
    }

    // Log activity
    await logActivity({
      userId: userId || 'system',
      action: 'CREATE',
      resourceType: 'PROJECT',
      resourceId: projectId,
      resourceName: 'سند اختتامیه',
      description: `سند اختتامیه با شماره ${documentNumber} ثبت شد`,
      metadata: JSON.stringify({
        documentId: document.id,
        totalDebit,
        totalCredit,
        accountCount: accounts.length,
        initialCapital: initialCapital || 0
      })
    });

    return NextResponse.json({
      success: true,
      documentId: document.id,
      documentNumber,
      message: 'سند اختتامیه با موفقیت ثبت شد و مانده‌ها به سال بعد منتقل شدند'
    });
  } catch (error) {
    console.error('Error creating closing entry:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت سند اختتامیه' },
      { status: 500 }
    );
  }
}
