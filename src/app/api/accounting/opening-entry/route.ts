import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { logActivity } from "@/lib/activityLogger";
import { DateObject } from 'react-multi-date-picker';
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

// GET /api/accounting/opening-entry - دریافت سند افتتاحیه سال مالی جاری
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const fiscalYearId = searchParams.get('fiscalYearId');

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can access opening entries
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز دسترسی به سند افتتاحیه ندارید' },
        { status: 403 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'شناسه پروژه الزامی است' },
        { status: 400 }
      );
    }

    // Get current fiscal year if not specified
    let targetFiscalYearId = fiscalYearId;
    if (!targetFiscalYearId) {
      // Get current Persian year using the library
      try {
        const now = new Date();
        const persianDate = new DateObject({ date: now, calendar: persian, locale: persian_fa });
        const fiscalYear = await prisma.fiscalYear.findFirst({
          where: {
            projectId,
            year: persianDate.year,
            isActive: true
          }
        });
        targetFiscalYearId = fiscalYear?.id;
      } catch (error) {
        // Fallback to approximate calculation
        const now = new Date();
        const currentPersianYear = now.getFullYear() - 621;
        const fiscalYear = await prisma.fiscalYear.findFirst({
          where: {
            projectId,
            year: currentPersianYear,
            isActive: true
          }
        });
        targetFiscalYearId = fiscalYear?.id;
      }
    }

    if (!targetFiscalYearId) {
      return NextResponse.json(
        { error: 'سال مالی جاری یافت نشد' },
        { status: 404 }
      );
    }

    // Find opening entry document for this fiscal year
    const openingDocument = await prisma.accountingDocument.findFirst({
      where: {
        projectId,
        fiscalYearId: targetFiscalYearId,
        description: {
          contains: 'افتتاحیه'
        }
      },
      include: {
        entries: true,
        fiscalYear: true
      }
    });

    return NextResponse.json({
      exists: !!openingDocument,
      document: openingDocument,
      fiscalYearId: targetFiscalYearId
    });
  } catch (error) {
    console.error('Error fetching opening entry:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت سند افتتاحیه' },
      { status: 500 }
    );
  }
}

// POST /api/accounting/opening-entry - ثبت سند افتتاحیه
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      projectId, 
      fiscalYearId, 
      documentDate, 
      documentDescription, 
      entries, 
      autoGenerate = false 
    } = body;

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

    if (!projectId) {
      return NextResponse.json(
        { error: 'شناسه پروژه الزامی است' },
        { status: 400 }
      );
    }

    // Get or determine fiscal year
    let fiscalYear;
    if (fiscalYearId) {
      fiscalYear = await prisma.fiscalYear.findUnique({
        where: { id: fiscalYearId }
      });
    } else {
      // Get current fiscal year using the library
      try {
        const now = new Date();
        const persianDate = new DateObject({ date: now, calendar: persian, locale: persian_fa });
        fiscalYear = await prisma.fiscalYear.findFirst({
          where: {
            projectId,
            year: persianDate.year,
            isActive: true
          }
        });
      } catch (error) {
        // Fallback to approximate calculation
        const now = new Date();
        const currentPersianYear = now.getFullYear() - 621;
        fiscalYear = await prisma.fiscalYear.findFirst({
          where: {
            projectId,
            year: currentPersianYear,
            isActive: true
          }
        });
      }
    }

    if (!fiscalYear) {
      return NextResponse.json(
        { error: 'سال مالی یافت نشد. لطفاً ابتدا سال مالی را تعریف کنید.' },
        { status: 404 }
      );
    }

    // Check if opening entry already exists for this fiscal year
    if (fiscalYear.openingEntryId) {
      return NextResponse.json(
        { error: `سند افتتاحیه برای سال مالی ${fiscalYear.year} قبلاً ثبت شده است` },
        { status: 400 }
      );
    }

    // Auto-generate entries from previous year if requested
    let finalEntries = entries;
    if (autoGenerate) {
      const previousYear = fiscalYear.year - 1;
      const previousFiscalYear = await prisma.fiscalYear.findFirst({
        where: {
          projectId,
          year: previousYear
        }
      });

      if (previousFiscalYear) {
        // Get closing balances from previous year for groups 2, 3, 4, 5 only
        const closingBalances = await prisma.accountingEntry.findMany({
          where: {
            document: {
              fiscalYearId: previousFiscalYear.id,
              description: {
                contains: 'اختتامیه'
              }
            },
            // Only include entries from groups 2, 3, 4, 5 (opening document groups)
            OR: [
              { accountCode: { startsWith: '2' } }, // دارایی‌های غیرجاری
              { accountCode: { startsWith: '3' } }, // بدهی‌ها
              { accountCode: { startsWith: '4' } }, // حقوق صاحبان سرمایه
              { accountCode: { startsWith: '5' } }  // سود و زیان انباشته
            ]
          },
          include: {
            document: true
          }
        });

        // Convert closing balances to opening entries
        finalEntries = closingBalances.map(entry => ({
          accountCode: entry.accountCode,
          accountName: entry.accountName,
          description: `مانده اول دوره - ${entry.accountName}`,
          debit: entry.credit > 0 ? entry.credit : 0, // Closing credit becomes opening debit
          credit: entry.debit > 0 ? entry.debit : 0   // Closing debit becomes opening credit
        }));

        // Add retained earnings entry if not present
        const hasRetainedEarnings = finalEntries.some(entry => 
          entry.accountCode.startsWith('5') || entry.accountName.includes('سود و زیان')
        );
        
        if (!hasRetainedEarnings) {
          // Calculate net profit/loss from temporary accounts (groups 6-9)
          const tempAccountBalances = await prisma.accountingEntry.findMany({
            where: {
              document: {
                fiscalYearId: previousFiscalYear.id,
                description: {
                  contains: 'اختتامیه'
                }
              },
              OR: [
                { accountCode: { startsWith: '6' } }, // خرید
                { accountCode: { startsWith: '7' } }, // فروش
                { accountCode: { startsWith: '8' } }, // درآمدها
                { accountCode: { startsWith: '9' } }  // هزینه‌ها
              ]
            }
          });

          let netProfit = 0;
          tempAccountBalances.forEach(entry => {
            if (entry.accountCode.startsWith('7') || entry.accountCode.startsWith('8')) {
              // Revenue accounts
              netProfit += (entry.debit - entry.credit);
            } else if (entry.accountCode.startsWith('6') || entry.accountCode.startsWith('9')) {
              // Expense accounts
              netProfit -= (entry.debit - entry.credit);
            }
          });

          if (Math.abs(netProfit) > 0.01) {
            finalEntries.push({
              accountCode: '500001',
              accountName: 'سود و زیان انباشته',
              description: `سود و زیان انباشته سال ${previousYear}`,
              debit: netProfit < 0 ? Math.abs(netProfit) : 0,
              credit: netProfit > 0 ? netProfit : 0
            });
          }
        }
      }
    }

    if (!finalEntries || finalEntries.length === 0) {
      return NextResponse.json(
        { error: 'لیست ردیف‌های سند الزامی است' },
        { status: 400 }
      );
    }

    // Validate that the entry is balanced
    const totalDebit = finalEntries.reduce((sum: number, entry: any) => sum + (entry.debit || 0), 0);
    const totalCredit = finalEntries.reduce((sum: number, entry: any) => sum + (entry.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: `سند تراز نیست. جمع بدهکار: ${totalDebit.toLocaleString('fa-IR')}, جمع بستانکار: ${totalCredit.toLocaleString('fa-IR')}` },
        { status: 400 }
      );
    }

    // Generate document number - same as regular documents
    const lastDocument = await prisma.accountingDocument.findFirst({
      where: { projectId },
      orderBy: { documentNumber: 'desc' },
      select: { documentNumber: true }
    });
    
    let documentNumber = '1';
    if (lastDocument) {
      const lastNumber = parseInt(lastDocument.documentNumber);
      if (!isNaN(lastNumber)) {
        documentNumber = (lastNumber + 1).toString();
      }
    }

    // Create the opening entry document
    const document = await prisma.accountingDocument.create({
      data: {
        projectId,
        fiscalYearId: fiscalYear.id,
        documentNumber,
        documentDate: documentDate ? new Date(documentDate) : fiscalYear.startDate,
        description: documentDescription || `سند افتتاحیه سال مالی ${fiscalYear.year}`,
        totalDebit,
        totalCredit,
        status: 'PERMANENT', // Opening entries are always permanent
        entries: {
          create: finalEntries.map((entry: any) => ({
            accountCode: entry.accountCode || '',
            accountName: entry.accountName || '',
            description: entry.description || `مانده اول دوره - ${entry.accountName || ''}`,
            debit: entry.debit || 0,
            credit: entry.credit || 0,
            accountNature: entry.accountNature || (entry.debit > 0 ? 'DEBIT' : 'CREDIT')
          }))
        }
      },
      include: {
        entries: true,
        fiscalYear: true
      }
    });

    // Update fiscal year with opening entry reference
    await prisma.fiscalYear.update({
      where: { id: fiscalYear.id },
      data: { openingEntryId: document.id }
    });

    // Log activity
    if (userId) {
      await logActivity({
        userId,
        action: 'CREATE',
        resourceType: 'PROJECT',
        resourceId: projectId,
        resourceName: 'سند افتتاحیه',
        description: `سند افتتاحیه سال مالی ${fiscalYear.year} با شماره ${documentNumber} ثبت شد`,
        metadata: JSON.stringify({
          documentId: document.id,
          fiscalYearId: fiscalYear.id,
          totalDebit,
          totalCredit,
          entryCount: finalEntries.length
        })
      });
    }

    return NextResponse.json({
      success: true,
      document,
      message: `سند افتتاحیه سال مالی ${fiscalYear.year} با موفقیت ثبت شد`
    });
  } catch (error) {
    console.error('Error creating opening entry:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت سند افتتاحیه' },
      { status: 500 }
    );
  }
}

// PUT /api/accounting/opening-entry - ویرایش سند افتتاحیه (فقط اگر هنوز ثبت نشده)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      documentId, 
      documentDate, 
      documentDescription, 
      entries 
    } = body;

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

    // Only admin users can edit opening entries
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ویرایش سند افتتاحیه ندارید' },
        { status: 403 }
      );
    }

    if (!documentId) {
      return NextResponse.json(
        { error: 'شناسه سند الزامی است' },
        { status: 400 }
      );
    }

    // Find the document
    const document = await prisma.accountingDocument.findUnique({
      where: { id: documentId },
      include: { fiscalYear: true }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'سند یافت نشد' },
        { status: 404 }
      );
    }

    // Check if document is already posted (opening entries are always permanent)
    if (document.status === 'PERMANENT') {
      return NextResponse.json(
        { error: 'سند افتتاحیه قبلاً ثبت شده و قابل ویرایش نیست' },
        { status: 400 }
      );
    }

    // Validate entries
    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'لیست ردیف‌های سند الزامی است' },
        { status: 400 }
      );
    }

    // Validate that the entry is balanced
    const totalDebit = entries.reduce((sum: number, entry: any) => sum + (entry.debit || 0), 0);
    const totalCredit = entries.reduce((sum: number, entry: any) => sum + (entry.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: 'سند تراز نیست. جمع بدهکار باید برابر جمع بستانکار باشد.' },
        { status: 400 }
      );
    }

    // Update document
    const updatedDocument = await prisma.accountingDocument.update({
      where: { id: documentId },
      data: {
        documentDate: documentDate ? new Date(documentDate) : document.documentDate,
        description: documentDescription || document.description,
        totalDebit,
        totalCredit,
        entries: {
          deleteMany: {}, // Delete existing entries
          create: entries.map((entry: any) => ({
            accountCode: entry.accountCode || '',
            accountName: entry.accountName || '',
            description: entry.description || `مانده اول دوره - ${entry.accountName || ''}`,
            debit: entry.debit || 0,
            credit: entry.credit || 0,
            accountNature: entry.debit > 0 ? 'DEBIT' : 'CREDIT'
          }))
        }
      },
      include: {
        entries: true,
        fiscalYear: true
      }
    });

    // Log activity
    if (userId) {
      await logActivity({
        userId,
        action: 'UPDATE',
        resourceType: 'PROJECT',
        resourceId: document.projectId,
        resourceName: 'سند افتتاحیه',
        description: `سند افتتاحیه ${document.documentNumber} ویرایش شد`,
        metadata: JSON.stringify({
          documentId: document.id,
          totalDebit,
          totalCredit,
          entryCount: entries.length
        })
      });
    }

    return NextResponse.json({
      success: true,
      document: updatedDocument,
      message: 'سند افتتاحیه با موفقیت ویرایش شد'
    });
  } catch (error) {
    console.error('Error updating opening entry:', error);
    return NextResponse.json(
      { error: 'خطا در ویرایش سند افتتاحیه' },
      { status: 500 }
    );
  }
}
