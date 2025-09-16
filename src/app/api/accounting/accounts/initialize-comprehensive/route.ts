import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../_lib/db';

const COMPREHENSIVE_CHART_OF_ACCOUNTS = [
  // دارایی‌ها (1000-1999)
  {
    name: 'دارایی‌های جاری',
    code: '1000',
    type: 'ASSET',
    level: 1,
    children: [
      {
        name: 'صندوق',
        code: '1100',
        type: 'ASSET',
        level: 2,
        children: [
          { name: 'صندوق نقدی', code: '1101', type: 'ASSET', level: 3 },
          { name: 'صندوق چک', code: '1102', type: 'ASSET', level: 3 }
        ]
      },
      {
        name: 'بانک‌ها',
        code: '1200',
        type: 'ASSET',
        level: 2,
        children: [
          { name: 'بانک ملی', code: '1201', type: 'ASSET', level: 3 },
          { name: 'بانک ملت', code: '1202', type: 'ASSET', level: 3 },
          { name: 'بانک صادرات', code: '1203', type: 'ASSET', level: 3 },
          { name: 'بانک پارسیان', code: '1204', type: 'ASSET', level: 3 },
          { name: 'بانک تجارت', code: '1205', type: 'ASSET', level: 3 }
        ]
      },
      {
        name: 'حساب‌های دریافتنی',
        code: '1300',
        type: 'ASSET',
        level: 2,
        children: [
          { name: 'مشتریان', code: '1301', type: 'CUSTOMER', level: 3 },
          { name: 'پیش‌پرداخت‌ها', code: '1302', type: 'ASSET', level: 3 },
          { name: 'سایر مطالبات', code: '1303', type: 'ASSET', level: 3 }
        ]
      },
      {
        name: 'موجودی کالا',
        code: '1400',
        type: 'ASSET',
        level: 2,
        children: [
          { name: 'موجودی مصالح', code: '1401', type: 'ASSET', level: 3 },
          { name: 'موجودی تجهیزات', code: '1402', type: 'ASSET', level: 3 },
          { name: 'موجودی کالای نیمه‌ساخته', code: '1403', type: 'ASSET', level: 3 }
        ]
      }
    ]
  },
  {
    name: 'دارایی‌های ثابت',
    code: '1500',
    type: 'ASSET',
    level: 1,
    children: [
      {
        name: 'زمین و ساختمان',
        code: '1510',
        type: 'ASSET',
        level: 2,
        children: [
          { name: 'زمین', code: '1511', type: 'ASSET', level: 3 },
          { name: 'ساختمان', code: '1512', type: 'ASSET', level: 3 },
          { name: 'استهلاک انباشته ساختمان', code: '1513', type: 'ASSET', level: 3 }
        ]
      },
      {
        name: 'ماشین‌آلات و تجهیزات',
        code: '1520',
        type: 'ASSET',
        level: 2,
        children: [
          { name: 'ماشین‌آلات', code: '1521', type: 'ASSET', level: 3 },
          { name: 'تجهیزات', code: '1522', type: 'ASSET', level: 3 },
          { name: 'استهلاک انباشته ماشین‌آلات', code: '1523', type: 'ASSET', level: 3 }
        ]
      },
      {
        name: 'وسایل نقلیه',
        code: '1530',
        type: 'ASSET',
        level: 2,
        children: [
          { name: 'خودرو', code: '1531', type: 'ASSET', level: 3 },
          { name: 'استهلاک انباشته وسایل نقلیه', code: '1532', type: 'ASSET', level: 3 }
        ]
      }
    ]
  },

  // بدهی‌ها (2000-2999)
  {
    name: 'بدهی‌های جاری',
    code: '2000',
    type: 'LIABILITY',
    level: 1,
    children: [
      {
        name: 'حساب‌های پرداختنی',
        code: '2100',
        type: 'LIABILITY',
        level: 2,
        children: [
          { name: 'تأمین‌کنندگان', code: '2101', type: 'SUPPLIER', level: 3 },
          { name: 'پیمانکاران', code: '2102', type: 'CONTRACTOR', level: 3 },
          { name: 'سایر بدهی‌ها', code: '2103', type: 'LIABILITY', level: 3 }
        ]
      },
      {
        name: 'وام‌ها و تسهیلات',
        code: '2200',
        type: 'LIABILITY',
        level: 2,
        children: [
          { name: 'وام کوتاه‌مدت', code: '2201', type: 'LIABILITY', level: 3 },
          { name: 'وام بلندمدت', code: '2202', type: 'LIABILITY', level: 3 }
        ]
      },
      {
        name: 'پیش‌دریافت‌ها',
        code: '2300',
        type: 'LIABILITY',
        level: 2,
        children: [
          { name: 'پیش‌دریافت از مشتریان', code: '2301', type: 'LIABILITY', level: 3 },
          { name: 'سایر پیش‌دریافت‌ها', code: '2302', type: 'LIABILITY', level: 3 }
        ]
      }
    ]
  },

  // سرمایه (3000-3999)
  {
    name: 'سرمایه',
    code: '3000',
    type: 'EQUITY',
    level: 1,
    children: [
      { name: 'سرمایه اولیه', code: '3100', type: 'EQUITY', level: 2 },
      { name: 'سود انباشته', code: '3200', type: 'EQUITY', level: 2 },
      { name: 'سود سال جاری', code: '3300', type: 'EQUITY', level: 2 }
    ]
  },

  // درآمدها (4000-4999)
  {
    name: 'درآمدها',
    code: '4000',
    type: 'INCOME',
    level: 1,
    children: [
      { name: 'درآمد فروش', code: '4100', type: 'INCOME', level: 2 },
      { name: 'درآمد خدمات', code: '4200', type: 'INCOME', level: 2 },
      { name: 'سایر درآمدها', code: '4300', type: 'INCOME', level: 2 }
    ]
  },

  // هزینه‌ها (5000-5999)
  {
    name: 'هزینه‌ها',
    code: '5000',
    type: 'EXPENSE',
    level: 1,
    children: [
      {
        name: 'هزینه‌های عملیاتی',
        code: '5100',
        type: 'EXPENSE',
        level: 2,
        children: [
          { name: 'هزینه حقوق و دستمزد', code: '5101', type: 'EXPENSE', level: 3 },
          { name: 'هزینه اجاره', code: '5102', type: 'EXPENSE', level: 3 },
          { name: 'هزینه برق و آب', code: '5103', type: 'EXPENSE', level: 3 },
          { name: 'هزینه تلفن و اینترنت', code: '5104', type: 'EXPENSE', level: 3 }
        ]
      },
      {
        name: 'هزینه‌های مالی',
        code: '5200',
        type: 'EXPENSE',
        level: 2,
        children: [
          { name: 'هزینه بهره', code: '5201', type: 'EXPENSE', level: 3 },
          { name: 'هزینه کارمزد بانکی', code: '5202', type: 'EXPENSE', level: 3 }
        ]
      },
      {
        name: 'هزینه‌های استهلاک',
        code: '5300',
        type: 'EXPENSE',
        level: 2,
        children: [
          { name: 'استهلاک ساختمان', code: '5301', type: 'EXPENSE', level: 3 },
          { name: 'استهلاک ماشین‌آلات', code: '5302', type: 'EXPENSE', level: 3 },
          { name: 'استهلاک وسایل نقلیه', code: '5303', type: 'EXPENSE', level: 3 }
        ]
      }
    ]
  }
];

async function createAccountHierarchy(projectId: string, accountData: any, parentId?: string): Promise<string> {
  const account = await prisma.account.create({
    data: {
      projectId,
      name: accountData.name,
      code: accountData.code,
      type: accountData.type as any,
      level: accountData.level,
      parentId: parentId || null,
      isActive: true
    }
  });

  if (accountData.children) {
    for (const child of accountData.children) {
      await createAccountHierarchy(projectId, child, account.id);
    }
  }

  return account.id;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Check if accounts already exist for this project
    const existingAccounts = await prisma.account.findFirst({
      where: { projectId }
    });

    if (existingAccounts) {
      return NextResponse.json(
        { error: 'Accounts already exist for this project' },
        { status: 400 }
      );
    }

    // Create the comprehensive chart of accounts
    const createdAccounts = [];
    
    for (const accountData of COMPREHENSIVE_CHART_OF_ACCOUNTS) {
      const accountId = await createAccountHierarchy(projectId, accountData);
      createdAccounts.push(accountId);
    }

    // Create initial ledger entries for all accounts
    const allAccounts = await prisma.account.findMany({
      where: { projectId }
    });

    for (const account of allAccounts) {
      await prisma.ledger.create({
        data: {
          projectId,
          accountId: account.id,
          balance: 0
        }
      });
    }

    return NextResponse.json({
      message: 'Comprehensive chart of accounts created successfully',
      accountsCreated: createdAccounts.length,
      totalAccounts: allAccounts.length
    });
  } catch (error) {
    console.error('Error creating comprehensive chart of accounts:', error);
    return NextResponse.json(
      { error: 'Failed to create chart of accounts' },
      { status: 500 }
    );
  }
}
