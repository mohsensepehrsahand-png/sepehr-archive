import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Fetch account groups to understand the coding structure
    const accountGroups = await prisma.accountGroup.findMany({
      where: {
        projectId,
        isActive: true
      },
      include: {
        classes: {
          include: {
            subClasses: {
              include: {
                details: {
                  include: {
                    accounts: {
                      include: {
                        transactions: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    // Also fetch direct accounts (not through the hierarchy)
    const directAccounts = await prisma.account.findMany({
      where: {
        projectId,
        isActive: true,
        detailId: null // Accounts not linked to details
      },
      include: {
        transactions: true
      }
    });

    // Function to calculate account balance
    const calculateBalance = (account: any) => {
      const debitTotal = account.transactions
        .filter((t: any) => t.type === 'DEBIT')
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      
      const creditTotal = account.transactions
        .filter((t: any) => t.type === 'CREDIT')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      // For assets and expenses: balance = debit - credit
      // For liabilities, equity, and income: balance = credit - debit
      if (account.type === 'ASSET' || account.type === 'EXPENSE') {
        return debitTotal - creditTotal;
      } else {
        return creditTotal - debitTotal;
      }
    };

    // Process accounts from hierarchy
    const processedAccounts: any[] = [];
    
    accountGroups.forEach(group => {
      group.classes.forEach(accountClass => {
        accountClass.subClasses.forEach(subClass => {
          subClass.details.forEach(detail => {
            detail.accounts.forEach(account => {
              const balance = calculateBalance(account);
              processedAccounts.push({
                id: account.id,
                code: account.code || `${group.code}${accountClass.code}${subClass.code}${detail.code}`,
                name: account.name,
                type: account.type,
                balance: balance,
                groupCode: group.code,
                groupName: group.name
              });
            });
          });
        });
      });
    });

    // Process direct accounts
    directAccounts.forEach(account => {
      const balance = calculateBalance(account);
      processedAccounts.push({
        id: account.id,
        code: account.code || '000',
        name: account.name,
        type: account.type,
        balance: balance,
        groupCode: '0',
        groupName: 'مستقیم'
      });
    });

    // Categorize accounts based on their group codes and types
    const assets: any[] = [];
    const liabilities: any[] = [];
    const equity: any[] = [];

    processedAccounts.forEach(account => {
      if (account.type === 'ASSET') {
        // Group 1: Current Assets (دارایی‌های جاری)
        if (account.groupCode === '1') {
          assets.push({
            code: account.code,
            name: account.name,
            balance: account.balance
          });
        }
        // Group 2: Non-Current Assets (دارایی‌های غیر جاری)
        else if (account.groupCode === '2') {
          assets.push({
            code: account.code,
            name: account.name,
            balance: account.balance
          });
        }
        // Default: put in current assets if no specific group
        else {
          assets.push({
            code: account.code,
            name: account.name,
            balance: account.balance
          });
        }
      } else if (account.type === 'LIABILITY') {
        liabilities.push({
          code: account.code,
          name: account.name,
          balance: account.balance
        });
      } else if (account.type === 'EQUITY') {
        equity.push({
          code: account.code,
          name: account.name,
          balance: account.balance
        });
      }
    });

    // Separate current and non-current assets based on group codes
    const currentAssets = assets.filter(acc => 
      acc.code.startsWith('1') || 
      acc.name.includes('جاری') || 
      acc.name.includes('صندوق') || 
      acc.name.includes('بانک') ||
      acc.name.includes('موجودی') ||
      acc.name.includes('دریافتنی')
    );

    const nonCurrentAssets = assets.filter(acc => 
      acc.code.startsWith('2') || 
      acc.name.includes('غیر جاری') || 
      acc.name.includes('زمین') || 
      acc.name.includes('ساختمان') ||
      acc.name.includes('ماشین') ||
      acc.name.includes('تجهیزات')
    );

    const balanceSheetData = {
      assets: {
        current: currentAssets.filter(acc => acc.balance !== 0),
        nonCurrent: nonCurrentAssets.filter(acc => acc.balance !== 0)
      },
      liabilities: liabilities.filter(acc => acc.balance !== 0),
      equity: equity.filter(acc => acc.balance !== 0)
    };

    return NextResponse.json(balanceSheetData);

  } catch (error) {
    console.error('Error fetching balance sheet data:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات ترازنامه' },
      { status: 500 }
    );
  }
}
