import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";

// GET /api/accounting/transactions/[id] - دریافت اطلاعات تراکنش
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transactionId = params.id;

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

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
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

    if (!transaction) {
      return NextResponse.json(
        { error: 'تراکنش یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات تراکنش' },
      { status: 500 }
    );
  }
}

// PUT /api/accounting/transactions/[id] - ویرایش تراکنش
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transactionId = params.id;
    const body = await request.json();
    const { 
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

    // Only admin users can edit transactions
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ویرایش تراکنش ندارید' },
        { status: 403 }
      );
    }

    if (!accountId || !date || !amount || !type || !journalType) {
      return NextResponse.json(
        { error: 'تمام فیلدهای الزامی باید پر شوند' },
        { status: 400 }
      );
    }

    // Get current transaction to update ledger
    const currentTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        project: {
          select: {
            name: true
          }
        }
      }
    });

    if (!currentTransaction) {
      return NextResponse.json(
        { error: 'تراکنش یافت نشد' },
        { status: 404 }
      );
    }

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
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

    // Update ledger balance (simplified - in production you'd want more sophisticated ledger management)
    const ledger = await prisma.ledger.findUnique({
      where: {
        projectId_accountId: {
          projectId: transaction.projectId,
          accountId: transaction.accountId
        }
      }
    });

    if (ledger) {
      // Recalculate balance based on all transactions for this account
      const allTransactions = await prisma.transaction.findMany({
        where: {
          projectId: transaction.projectId,
          accountId: transaction.accountId
        }
      });

      const newBalance = allTransactions.reduce((balance, t) => {
        return t.type === 'DEBIT' 
          ? balance + t.amount
          : balance - t.amount;
      }, 0);

      await prisma.ledger.update({
        where: { id: ledger.id },
        data: { balance: newBalance }
      });
    }

    // Log the update activity
    if (userId) {
      await logActivity({
        userId,
        action: 'UPDATE',
        resourceType: 'PROJECT',
        resourceId: transaction.projectId,
        resourceName: currentTransaction.project.name,
        description: `تراکنش ${type === 'DEBIT' ? 'بدهکار' : 'بستانکار'} ${amount} تومان ویرایش شد`,
        metadata: {
          transactionId: transaction.id,
          accountId: transaction.accountId,
          journalType: transaction.journalType
        }
      });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'خطا در ویرایش تراکنش' },
      { status: 500 }
    );
  }
}

// DELETE /api/accounting/transactions/[id] - حذف تراکنش
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transactionId = params.id;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can delete transactions
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز حذف تراکنش ندارید' },
        { status: 403 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        project: {
          select: {
            name: true
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'تراکنش یافت نشد' },
        { status: 404 }
      );
    }

    await prisma.transaction.delete({
      where: { id: transactionId }
    });

    // Update ledger balance after deletion
    const ledger = await prisma.ledger.findUnique({
      where: {
        projectId_accountId: {
          projectId: transaction.projectId,
          accountId: transaction.accountId
        }
      }
    });

    if (ledger) {
      // Recalculate balance based on remaining transactions
      const remainingTransactions = await prisma.transaction.findMany({
        where: {
          projectId: transaction.projectId,
          accountId: transaction.accountId
        }
      });

      const newBalance = remainingTransactions.reduce((balance, t) => {
        return t.type === 'DEBIT' 
          ? balance + t.amount
          : balance - t.amount;
      }, 0);

      await prisma.ledger.update({
        where: { id: ledger.id },
        data: { balance: newBalance }
      });
    }

    // Log the deletion activity
    if (userId) {
      await logActivity({
        userId,
        action: 'DELETE',
        resourceType: 'PROJECT',
        resourceId: transaction.projectId,
        resourceName: transaction.project.name,
        description: `تراکنش ${transaction.type === 'DEBIT' ? 'بدهکار' : 'بستانکار'} ${transaction.amount} تومان حذف شد`,
        metadata: {
          transactionId: transaction.id,
          accountId: transaction.accountId,
          journalType: transaction.journalType
        }
      });
    }

    return NextResponse.json({ message: 'تراکنش با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: 'خطا در حذف تراکنش' },
      { status: 500 }
    );
  }
}
