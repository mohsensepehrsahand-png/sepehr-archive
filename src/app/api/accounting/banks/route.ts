import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { logActivity } from "@/lib/activityLogger";

// GET /api/accounting/banks - دریافت لیست حساب‌های بانکی
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

    const banks = await prisma.bank.findMany({
      where: { projectId },
      include: {
        transactions: {
          orderBy: {
            date: 'desc'
          },
          take: 10
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(banks);
  } catch (error) {
    console.error('Error fetching banks:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت حساب‌های بانکی' },
      { status: 500 }
    );
  }
}

// POST /api/accounting/banks - ایجاد حساب بانکی جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, branch, accountNumber, accountName, balance = 0 } = body;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can create banks
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ایجاد حساب بانکی ندارید' },
        { status: 403 }
      );
    }

    if (!projectId || !name || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: 'شناسه پروژه، نام بانک، شماره حساب و نام صاحب حساب الزامی است' },
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

    const bank = await prisma.bank.create({
      data: {
        projectId,
        name,
        branch: branch || null,
        accountNumber,
        accountName,
        balance: parseFloat(balance.toString())
      },
      include: {
        transactions: true
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
        description: `حساب بانکی جدید "${bank.name}" ایجاد شد`,
        metadata: {
          bankId: bank.id,
          accountNumber: bank.accountNumber
        }
      });
    }

    return NextResponse.json(bank, { status: 201 });
  } catch (error) {
    console.error('Error creating bank:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد حساب بانکی' },
      { status: 500 }
    );
  }
}
