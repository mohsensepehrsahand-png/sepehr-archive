import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from 'xlsx';

// GET /api/accounting/export - خروجی Excel
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const exportType = searchParams.get('type') || 'transactions';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

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

    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    let data: any[] = [];
    let filename = '';

    switch (exportType) {
      case 'transactions':
        const transactions = await prisma.transaction.findMany({
          where: {
            projectId,
            ...dateFilter
          },
          include: {
            account: {
              select: {
                name: true,
                type: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        });

        data = transactions.map(t => ({
          'تاریخ': t.date.toLocaleDateString('fa-IR'),
          'حساب': t.account.name,
          'نوع حساب': t.account.type,
          'مبلغ': t.amount,
          'نوع تراکنش': t.type === 'DEBIT' ? 'بدهکار' : 'بستانکار',
          'دفتر': t.journalType === 'DAYBOOK' ? 'روزنامه' : 
                  t.journalType === 'GENERAL_LEDGER' ? 'کل' : 'معین',
          'توضیحات': t.description || '',
          'سند': t.documentId ? 'دارد' : 'ندارد'
        }));
        filename = 'تراکنش‌ها';
        break;

      case 'invoices':
        const invoices = await prisma.invoice.findMany({
          where: {
            projectId,
            ...dateFilter
          },
          include: {
            account: {
              select: {
                name: true,
                type: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        });

        data = invoices.map(i => ({
          'تاریخ': i.date.toLocaleDateString('fa-IR'),
          'حساب': i.account.name,
          'نوع حساب': i.account.type,
          'مبلغ کل': i.totalAmount,
          'وضعیت': i.status === 'PAID' ? 'پرداخت شده' :
                   i.status === 'PARTIAL' ? 'بخشی' : 'معوق',
          'توضیحات': i.description || '',
          'سند': i.documentId ? 'دارد' : 'ندارد'
        }));
        filename = 'فاکتورها';
        break;

      case 'bills':
        const bills = await prisma.bill.findMany({
          where: {
            projectId,
            ...dateFilter
          },
          include: {
            account: {
              select: {
                name: true,
                type: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        });

        data = bills.map(b => ({
          'تاریخ': b.date.toLocaleDateString('fa-IR'),
          'حساب': b.account.name,
          'نوع حساب': b.account.type,
          'مبلغ کل': b.totalAmount,
          'وضعیت': b.status === 'PAID' ? 'پرداخت شده' :
                   b.status === 'PARTIAL' ? 'بخشی' : 'معوق',
          'توضیحات': b.description || '',
          'سند': b.documentId ? 'دارد' : 'ندارد'
        }));
        filename = 'قبض‌ها';
        break;

      case 'ledgers':
        const ledgers = await prisma.ledger.findMany({
          where: { projectId },
          include: {
            account: {
              select: {
                name: true,
                type: true
              }
            }
          },
          orderBy: {
            balance: 'desc'
          }
        });

        data = ledgers.map(l => ({
          'حساب': l.account.name,
          'نوع حساب': l.account.type,
          'مانده': l.balance,
          'وضعیت': l.balance > 0 ? 'بدهکار' : l.balance < 0 ? 'بستانکار' : 'صفر'
        }));
        filename = 'مانده حساب‌ها';
        break;

      default:
        return NextResponse.json(
          { error: 'نوع خروجی نامعتبر است' },
          { status: 400 }
        );
    }

    // Create Excel workbook with proper encoding
    const ws = XLSX.utils.json_to_sheet(data, {
      header: Object.keys(data[0] || {}),
      skipHeader: false
    });
    
    // Set column widths
    const colWidths = Object.keys(data[0] || {}).map(() => ({ wch: 20 }));
    ws['!cols'] = colWidths;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Generate buffer with proper encoding
    const buffer = XLSX.write(wb, { 
      type: 'array', 
      bookType: 'xlsx',
      compression: true
    });

    // Convert array to buffer
    const uint8Array = new Uint8Array(buffer);
    
    // Return Excel file
    const response = new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Cache-Control': 'no-cache',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      },
    });
    
    return response;
  } catch (error) {
    console.error('Error exporting accounting data:', error);
    return NextResponse.json(
      { error: 'خطا در خروجی Excel' },
      { status: 500 }
    );
  }
}
