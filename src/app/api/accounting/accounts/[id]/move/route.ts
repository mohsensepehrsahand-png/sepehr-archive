import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { logActivity } from "@/lib/activityLogger";

// PUT /api/accounting/accounts/[id]/move - جابجایی حساب
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params;
    const body = await request.json();
    const { newParentId } = body;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can move accounts
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز جابجایی حساب ندارید' },
        { status: 403 }
      );
    }

    // Get the account to move
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        project: {
          select: {
            name: true
          }
        }
      }
    });

    if (!account) {
      return NextResponse.json(
        { error: 'حساب یافت نشد' },
        { status: 404 }
      );
    }

    // If newParentId is provided, validate it exists and is not the same as the account
    if (newParentId) {
      if (newParentId === accountId) {
        return NextResponse.json(
          { error: 'حساب نمی‌تواند والد خودش باشد' },
          { status: 400 }
        );
      }

      const parentAccount = await prisma.account.findUnique({
        where: { id: newParentId }
      });

      if (!parentAccount) {
        return NextResponse.json(
          { error: 'حساب والد یافت نشد' },
          { status: 404 }
        );
      }

      // Check if moving would create a circular reference
      if (await wouldCreateCircularReference(accountId, newParentId)) {
        return NextResponse.json(
          { error: 'جابجایی باعث ایجاد مرجع دایره‌ای می‌شود' },
          { status: 400 }
        );
      }
    }

    // Update the account's parent and level
    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: {
        parentId: newParentId || null,
        level: newParentId ? 
          (await prisma.account.findUnique({ where: { id: newParentId } }))?.level! + 1 || 1
          : 1
      },
      include: {
        project: {
          select: {
            name: true
          }
        }
      }
    });

    // Log the move activity
    if (userId) {
      await logActivity({
        userId,
        action: 'UPDATE',
        resourceType: 'PROJECT',
        resourceId: account.projectId,
        resourceName: account.project.name,
        description: `حساب "${account.name}" جابجا شد`,
        metadata: {
          accountId: account.id,
          accountType: account.type,
          newParentId: newParentId || null
        }
      });
    }

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error('Error moving account:', error);
    return NextResponse.json(
      { error: 'خطا در جابجایی حساب' },
      { status: 500 }
    );
  }
}

// Helper function to check for circular references
async function wouldCreateCircularReference(accountId: string, newParentId: string): Promise<boolean> {
  let currentParentId = newParentId;
  
  while (currentParentId) {
    if (currentParentId === accountId) {
      return true;
    }
    
    const parent = await prisma.account.findUnique({
      where: { id: currentParentId },
      select: { parentId: true }
    });
    
    currentParentId = parent?.parentId || null;
  }
  
  return false;
}
