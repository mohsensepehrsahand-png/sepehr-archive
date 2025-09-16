import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";

// GET /api/accounting/transactions - دریافت لیست تراکنش‌ها
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const accountId = searchParams.get('accountId');
    const journalType = searchParams.get('journalType');
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

    const where: any = { projectId };
    if (accountId) {
      where.accountId = accountId;
    }
    if (journalType) {
      where.journalType = journalType;
    }
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: {
            name: true,
            type: true
          }
        },
        project: {
          select: {
            name: true
          }
        },
        document: {
          select: {
            name: true,
            filePath: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تراکنش‌ها' },
      { status: 500 }
    );
  }
}

// POST /api/accounting/transactions - ایجاد تراکنش جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      projectId, 
      accountId, 
      date, 
      amount, 
      type, 
      journalType, 
      description, 
      documentId 
    } = body;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can create transactions
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ایجاد تراکنش ندارید' },
        { status: 403 }
      );
    }

    if (!projectId || !accountId || !date || !amount || !type || !journalType) {
      return NextResponse.json(
        { error: 'تمام فیلدهای الزامی باید پر شوند' },
        { status: 400 }
      );
    }

    // Check if project and account exist
    const [project, account] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.account.findUnique({ where: { id: accountId } })
    ]);

    if (!project) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      );
    }

    if (!account) {
      return NextResponse.json(
        { error: 'حساب یافت نشد' },
        { status: 404 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        projectId,
        accountId,
        date: new Date(date),
        amount: parseFloat(amount),
        type,
        journalType,
        description: description || null,
        documentId: documentId || null
      },
      include: {
        account: {
          select: {
            name: true,
            type: true
          }
        },
        project: {
          select: {
            name: true
          }
        },
        document: {
          select: {
            name: true,
            filePath: true
          }
        }
      }
    });

    // Update ledger balance
    const ledger = await prisma.ledger.findUnique({
      where: {
        projectId_accountId: {
          projectId,
          accountId
        }
      }
    });

    if (ledger) {
      const newBalance = type === 'DEBIT' 
        ? ledger.balance + parseFloat(amount)
        : ledger.balance - parseFloat(amount);
      
      await prisma.ledger.update({
        where: { id: ledger.id },
        data: { balance: newBalance }
      });
    }

    // Log the creation activity
    if (userId) {
      await logActivity({
        userId,
        action: 'CREATE',
        resourceType: 'PROJECT',
        resourceId: projectId,
        resourceName: project.name,
        description: `تراکنش جدید ${type === 'DEBIT' ? 'بدهکار' : 'بستانکار'} ${amount} تومان ثبت شد`,
        metadata: {
          transactionId: transaction.id,
          accountName: account.name,
          journalType: transaction.journalType
        }
      });
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد تراکنش' },
      { status: 500 }
    );
  }
}
