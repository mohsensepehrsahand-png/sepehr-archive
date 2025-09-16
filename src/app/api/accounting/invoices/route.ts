import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";

// GET /api/accounting/invoices - دریافت لیست فاکتورها
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const accountId = searchParams.get('accountId');
    const status = searchParams.get('status');
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
    if (status) {
      where.status = status;
    }
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const invoices = await prisma.invoice.findMany({
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

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت فاکتورها' },
      { status: 500 }
    );
  }
}

// POST /api/accounting/invoices - ایجاد فاکتور جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      projectId, 
      accountId, 
      date, 
      totalAmount, 
      status = 'UNPAID', 
      description, 
      documentId 
    } = body;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can create invoices
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ایجاد فاکتور ندارید' },
        { status: 403 }
      );
    }

    if (!projectId || !accountId || !date || !totalAmount) {
      return NextResponse.json(
        { error: 'شناسه پروژه، حساب، تاریخ و مبلغ الزامی است' },
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

    const invoice = await prisma.invoice.create({
      data: {
        projectId,
        accountId,
        date: new Date(date),
        totalAmount: parseFloat(totalAmount),
        status,
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

    // Log the creation activity
    if (userId) {
      await logActivity({
        userId,
        action: 'CREATE',
        resourceType: 'PROJECT',
        resourceId: projectId,
        resourceName: project.name,
        description: `فاکتور جدید ${totalAmount} تومان برای ${account.name} ایجاد شد`,
        metadata: {
          invoiceId: invoice.id,
          accountName: account.name,
          status: invoice.status
        }
      });
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد فاکتور' },
      { status: 500 }
    );
  }
}
