import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { logActivity } from "@/lib/activityLogger";

// POST /api/accounting/accounts/initialize - ایجاد کدینگ پیش‌فرض
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, structure } = body;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can initialize coding
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ایجاد کدینگ ندارید' },
        { status: 403 }
      );
    }

    if (!projectId || !structure) {
      return NextResponse.json(
        { error: 'شناسه پروژه و ساختار کدینگ الزامی است' },
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

    // Check if accounts already exist for this project
    const existingAccounts = await prisma.account.findFirst({
      where: { projectId }
    });

    if (existingAccounts) {
      return NextResponse.json(
        { error: 'کدینگ قبلاً برای این پروژه ایجاد شده است' },
        { status: 400 }
      );
    }

    // Helper function to create accounts recursively
    const createAccountRecursively = async (
      accountData: any,
      parentId: string | null = null,
      level: number = 1
    ): Promise<string> => {
      const account = await prisma.account.create({
        data: {
          projectId,
          name: accountData.name,
          code: accountData.code,
          type: accountData.type,
          level,
          parentId,
          contact: accountData.contact || null,
          description: accountData.description || null,
          isActive: true
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

      // Create child accounts if they exist
      if (accountData.children && accountData.children.length > 0) {
        for (const child of accountData.children) {
          await createAccountRecursively(child, account.id, level + 1);
        }
      }

      return account.id;
    };

    // Create all accounts from the structure
    const createdAccounts: string[] = [];
    for (const rootAccount of structure) {
      const accountId = await createAccountRecursively(rootAccount);
      createdAccounts.push(accountId);
    }

    // Log the initialization activity
    if (userId) {
      await logActivity({
        userId,
        action: 'CREATE',
        resourceType: 'PROJECT',
        resourceId: projectId,
        resourceName: project.name,
        description: `کدینگ سلسله‌مراتبی حسابداری برای پروژه "${project.name}" ایجاد شد`,
        metadata: {
          accountsCreated: createdAccounts.length,
          structure: 'hierarchical_coding'
        }
      });
    }

    return NextResponse.json({
      message: 'کدینگ سلسله‌مراتبی با موفقیت ایجاد شد',
      accountsCreated: createdAccounts.length
    }, { status: 201 });

  } catch (error) {
    console.error('Error initializing coding:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد کدینگ پیش‌فرض' },
      { status: 500 }
    );
  }
}
