import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { logActivity } from "@/lib/activityLogger";

// GET /api/accounting/accounts - دریافت لیست حساب‌ها
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type');

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
    if (type) {
      where.type = type;
    }

    const accounts = await prisma.account.findMany({
      where,
      include: {
        project: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            transactions: true,
            invoices: true,
            bills: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت حساب‌ها' },
      { status: 500 }
    );
  }
}

// POST /api/accounting/accounts - ایجاد حساب جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, code, type, level, parentId, contact, description, customType, isActive } = body;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can create accounts
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ایجاد حساب ندارید' },
        { status: 403 }
      );
    }

    if (!projectId || !name || !type || !code) {
      return NextResponse.json(
        { error: 'شناسه پروژه، نام، کد و نوع کدینگ الزامی است' },
        { status: 400 }
      );
    }

    // اگر نوع سفارشی است، بررسی کن که اطلاعات کامل باشد
    if (type === 'CUSTOM' && (!customType || !customType.name || !customType.code)) {
      return NextResponse.json(
        { error: 'برای نوع سفارشی، نام و کد نوع کدینگ الزامی است' },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      );
    }

    // اگر نوع جدید تعریف شده، آن را در description ذخیره کن
    let finalDescription = description || '';
    if (customType && type === 'CUSTOM') {
      finalDescription = `نوع سفارشی: ${customType.name} (${customType.code}) - ${customType.description}`;
    }

    const account = await prisma.account.create({
      data: {
        projectId,
        name,
        code,
        type: (customType && type === 'CUSTOM') ? customType.code : type,
        level: level || 1,
        parentId: parentId || null,
        contact: contact || null,
        description: finalDescription,
        isActive: isActive !== undefined ? isActive : true
      },
      include: {
        project: {
          select: {
            name: true
          }
        }
      }
    });

    // Create initial ledger entry
    await prisma.ledger.create({
      data: {
        projectId,
        accountId: account.id,
        balance: 0
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
        description: `حساب جدید "${account.name}" ایجاد شد`,
        metadata: {
          accountId: account.id,
          accountType: account.type
        }
      });
    }

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد حساب' },
      { status: 500 }
    );
  }
}
