import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";

// GET /api/accounting/banks/[id]/transactions - دریافت تراکنش‌های بانکی
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bankId = params.id;

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

    const transactions = await prisma.bankTransaction.findMany({
      where: { bankId },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching bank transactions:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تراکنش‌های بانکی' },
      { status: 500 }
    );
  }
}

// POST /api/accounting/banks/[id]/transactions - ایجاد تراکنش بانکی جدید
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bankId = params.id;
    const body = await request.json();
    const { type, amount, description, reference } = body;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can create bank transactions
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ایجاد تراکنش بانکی ندارید' },
        { status: 403 }
      );
    }

    if (!type || !amount) {
      return NextResponse.json(
        { error: 'نوع تراکنش و مبلغ الزامی است' },
        { status: 400 }
      );
    }

    // Check if bank exists
    const bank = await prisma.bank.findUnique({
      where: { id: bankId },
      include: {
        project: {
          select: {
            name: true
          }
        }
      }
    });

    if (!bank) {
      return NextResponse.json(
        { error: 'حساب بانکی یافت نشد' },
        { status: 404 }
      );
    }

    // Create transaction
    const transaction = await prisma.bankTransaction.create({
      data: {
        bankId,
        type,
        amount: parseFloat(amount.toString()),
        description: description || null,
        reference: reference || null,
        date: new Date()
      }
    });

    // Update bank balance
    let newBalance = bank.balance;
    if (type === 'DEPOSIT') {
      newBalance += parseFloat(amount.toString());
    } else if (type === 'WITHDRAWAL') {
      newBalance -= parseFloat(amount.toString());
    }

    await prisma.bank.update({
      where: { id: bankId },
      data: { balance: newBalance }
    });

    // Log the creation activity
    if (userId) {
      await logActivity({
        userId,
        action: 'CREATE',
        resourceType: 'PROJECT',
        resourceId: bank.projectId,
        resourceName: bank.project.name,
        description: `تراکنش بانکی ${type === 'DEPOSIT' ? 'واریز' : 'برداشت'} ${amount} تومان ثبت شد`,
        metadata: {
          bankId: bank.id,
          transactionId: transaction.id,
          transactionType: transaction.type
        }
      });
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating bank transaction:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد تراکنش بانکی' },
      { status: 500 }
    );
  }
}
