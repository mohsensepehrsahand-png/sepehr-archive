import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";

// GET /api/accounting/reports - دریافت گزارش‌های حسابداری
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const reportType = searchParams.get('type') || 'summary';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const filterType = searchParams.get('filterType'); // 'project', 'customer', 'supplier'
    const filterId = searchParams.get('filterId');

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

    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Helper function to get hierarchical account data
    const getHierarchicalAccounts = async (projectId: string, accountType?: string) => {
      const accounts = await prisma.account.findMany({
        where: {
          projectId,
          isActive: true,
          ...(accountType && { type: accountType })
        },
        include: {
          children: {
            where: { isActive: true },
            include: {
              children: {
                where: { isActive: true },
                include: {
                  children: {
                    where: { isActive: true }
                  }
                }
              }
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
        orderBy: { code: 'asc' }
      });

      return accounts.filter(account => !account.parentId); // Only root accounts
    };

    // Helper function to get account balances with hierarchy
    const getAccountBalances = async (projectId: string, accountType?: string) => {
      const accounts = await getHierarchicalAccounts(projectId, accountType);
      
      const getAccountBalance = async (account: any): Promise<any> => {
        const ledger = await prisma.ledger.findUnique({
          where: {
            projectId_accountId: {
              projectId,
              accountId: account.id
            }
          }
        });

        const balance = ledger?.balance || 0;
        const children = await Promise.all(
          account.children.map((child: any) => getAccountBalance(child))
        );

        const totalChildrenBalance = children.reduce((sum, child) => sum + child.totalBalance, 0);
        const totalBalance = balance + totalChildrenBalance;

        return {
          ...account,
          balance,
          totalBalance,
          children: children,
          level: account.level || 1
        };
      };

      return Promise.all(accounts.map(account => getAccountBalance(account)));
    };

    // Helper function to apply filters
    const applyFilters = (baseWhere: any) => {
      let where = { ...baseWhere };

      if (filterType === 'customer' && filterId) {
        where.account = {
          ...where.account,
          type: 'CUSTOMER',
          id: filterId
        };
      } else if (filterType === 'supplier' && filterId) {
        where.account = {
          ...where.account,
          type: 'SUPPLIER',
          id: filterId
        };
      } else if (filterType === 'project' && filterId) {
        where.projectId = filterId;
      }

      return where;
    };

    switch (reportType) {
      case 'summary':
        // گزارش خلاصه مالی
        const [totalIncome, totalExpense, accountBalances, recentTransactions] = await Promise.all([
          // مجموع درآمد
          prisma.transaction.aggregate({
            where: {
              projectId,
              type: 'CREDIT',
              account: {
                type: 'INCOME'
              },
              ...dateFilter
            },
            _sum: {
              amount: true
            }
          }),
          // مجموع هزینه
          prisma.transaction.aggregate({
            where: {
              projectId,
              type: 'DEBIT',
              account: {
                type: 'EXPENSE'
              },
              ...dateFilter
            },
            _sum: {
              amount: true
            }
          }),
          // مانده حساب‌ها
          prisma.ledger.findMany({
            where: { projectId },
            include: {
              account: {
                select: {
                  name: true,
                  type: true
                }
              }
            },
            orderBy: {
              balance: 'desc'
            }
          }),
          // تراکنش‌های اخیر
          prisma.transaction.findMany({
            where: {
              projectId,
              ...dateFilter
            },
            include: {
              account: {
                select: {
                  name: true,
                  type: true
                }
              }
            },
            orderBy: {
              date: 'desc'
            },
            take: 10
          })
        ]);

        return NextResponse.json({
          totalIncome: totalIncome._sum.amount || 0,
          totalExpense: totalExpense._sum.amount || 0,
          netIncome: (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0),
          accountBalances,
          recentTransactions
        });

      case 'income_expense':
        // گزارش درآمد و هزینه
        const incomeTransactions = await prisma.transaction.findMany({
          where: {
            projectId,
            type: 'CREDIT',
            account: {
              type: 'INCOME'
            },
            ...dateFilter
          },
          include: {
            account: {
              select: {
                name: true,
                type: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        });

        const expenseTransactions = await prisma.transaction.findMany({
          where: {
            projectId,
            type: 'DEBIT',
            account: {
              type: 'EXPENSE'
            },
            ...dateFilter
          },
          include: {
            account: {
              select: {
                name: true,
                type: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        });

        return NextResponse.json({
          income: incomeTransactions,
          expenses: expenseTransactions
        });

      case 'invoices':
        // گزارش فاکتورها
        const invoices = await prisma.invoice.findMany({
          where: {
            projectId,
            ...dateFilter
          },
          include: {
            account: {
              select: {
                name: true,
                type: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        });

        const invoiceStats = {
          total: invoices.length,
          paid: invoices.filter(i => i.status === 'PAID').length,
          partial: invoices.filter(i => i.status === 'PARTIAL').length,
          unpaid: invoices.filter(i => i.status === 'UNPAID').length,
          totalAmount: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
          paidAmount: invoices
            .filter(i => i.status === 'PAID')
            .reduce((sum, i) => sum + i.totalAmount, 0)
        };

        return NextResponse.json({
          invoices,
          stats: invoiceStats
        });

      case 'bills':
        // گزارش قبض‌ها
        const bills = await prisma.bill.findMany({
          where: {
            projectId,
            ...dateFilter
          },
          include: {
            account: {
              select: {
                name: true,
                type: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        });

        const billStats = {
          total: bills.length,
          paid: bills.filter(b => b.status === 'PAID').length,
          partial: bills.filter(b => b.status === 'PARTIAL').length,
          unpaid: bills.filter(b => b.status === 'UNPAID').length,
          totalAmount: bills.reduce((sum, b) => sum + b.totalAmount, 0),
          paidAmount: bills
            .filter(b => b.status === 'PAID')
            .reduce((sum, b) => sum + b.totalAmount, 0)
        };

        return NextResponse.json({
          bills,
          stats: billStats
        });

      case 'financial':
        // گزارش‌های مالی کامل با کدینگ سلسله‌مراتبی
        const [hierarchicalAssets, hierarchicalLiabilities, hierarchicalEquity, income, expenses, bankTransactions] = await Promise.all([
          // دارایی‌ها با سلسله‌مراتب
          getAccountBalances(projectId, 'ASSET'),
          // بدهی‌ها با سلسله‌مراتب
          getAccountBalances(projectId, 'LIABILITY'),
          // سرمایه با سلسله‌مراتب
          getAccountBalances(projectId, 'EQUITY'),
          // درآمد
          prisma.transaction.aggregate({
            where: applyFilters({
              projectId,
              type: 'CREDIT',
              account: {
                type: 'INCOME'
              },
              ...dateFilter
            }),
            _sum: {
              amount: true
            }
          }),
          // هزینه
          prisma.transaction.aggregate({
            where: applyFilters({
              projectId,
              type: 'DEBIT',
              account: {
                type: 'EXPENSE'
              },
              ...dateFilter
            }),
            _sum: {
              amount: true
            }
          }),
          // تراکنش‌های بانکی
          prisma.bankTransaction.findMany({
            where: {
              bank: {
                projectId
              },
              ...dateFilter
            },
            include: {
              bank: {
                select: {
                  name: true
                }
              }
            }
          })
        ]);

        // Helper function to flatten hierarchical data for balance sheet
        const flattenHierarchicalData = (accounts: any[]): any[] => {
          const result: any[] = [];
          
          const flatten = (account: any, level = 0) => {
            result.push({
              name: account.name,
              code: account.code,
              amount: account.balance,
              totalAmount: account.totalBalance,
              type: account.type,
              level: level,
              hasChildren: account.children && account.children.length > 0,
              transactionCount: account._count?.transactions || 0
            });
            
            if (account.children && account.children.length > 0) {
              account.children.forEach((child: any) => flatten(child, level + 1));
            }
          };
          
          accounts.forEach(account => flatten(account));
          return result;
        };

        const balanceSheet = {
          assets: flattenHierarchicalData(hierarchicalAssets),
          liabilities: flattenHierarchicalData(hierarchicalLiabilities),
          equity: flattenHierarchicalData(hierarchicalEquity)
        };

        const incomeStatement = {
          revenue: income._sum.amount || 0,
          expenses: expenses._sum.amount || 0,
          netIncome: (income._sum.amount || 0) - (expenses._sum.amount || 0),
          period: startDate && endDate ? `${startDate} تا ${endDate}` : 'کل دوره'
        };

        const cashFlow = {
          operating: bankTransactions
            .filter(t => t.type === 'DEPOSIT' || t.type === 'WITHDRAWAL')
            .reduce((sum, t) => t.type === 'DEPOSIT' ? sum + t.amount : sum - t.amount, 0),
          investing: 0, // در آینده می‌تواند پیاده‌سازی شود
          financing: 0, // در آینده می‌تواند پیاده‌سازی شود
          netCashFlow: bankTransactions
            .reduce((sum, t) => t.type === 'DEPOSIT' ? sum + t.amount : sum - t.amount, 0)
        };

        return NextResponse.json({
          balanceSheet,
          incomeStatement,
          cashFlow,
          hierarchicalData: {
            assets: hierarchicalAssets,
            liabilities: hierarchicalLiabilities,
            equity: hierarchicalEquity
          }
        });

      case 'hierarchical_chart':
        // گزارش نمودار حساب‌ها با کدینگ سلسله‌مراتبی
        const allAccounts = await getHierarchicalAccounts(projectId);
        const accountsWithBalances = await Promise.all(
          allAccounts.map(async (account) => {
            const ledger = await prisma.ledger.findUnique({
              where: {
                projectId_accountId: {
                  projectId,
                  accountId: account.id
                }
              }
            });

            return {
              ...account,
              balance: ledger?.balance || 0,
              children: account.children
            };
          })
        );

        return NextResponse.json({
          accounts: accountsWithBalances,
          totalAccounts: allAccounts.length,
          activeAccounts: allAccounts.filter(a => a.isActive).length
        });

      case 'project_analysis':
        // تحلیل پروژه‌ای
        const projects = await prisma.project.findMany({
          where: {
            id: filterId || undefined
          },
          include: {
            accounts: {
              where: { isActive: true },
              include: {
                _count: {
                  select: {
                    transactions: true,
                    invoices: true,
                    bills: true
                  }
                }
              }
            }
          }
        });

        const projectAnalysis = await Promise.all(
          projects.map(async (project) => {
            const [totalIncome, totalExpense, accountCount] = await Promise.all([
              prisma.transaction.aggregate({
                where: {
                  projectId: project.id,
                  type: 'CREDIT',
                  account: { type: 'INCOME' },
                  ...dateFilter
                },
                _sum: { amount: true }
              }),
              prisma.transaction.aggregate({
                where: {
                  projectId: project.id,
                  type: 'DEBIT',
                  account: { type: 'EXPENSE' },
                  ...dateFilter
                },
                _sum: { amount: true }
              }),
              prisma.account.count({
                where: {
                  projectId: project.id,
                  isActive: true
                }
              })
            ]);

            return {
              projectId: project.id,
              projectName: project.name,
              totalIncome: totalIncome._sum.amount || 0,
              totalExpense: totalExpense._sum.amount || 0,
              netIncome: (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0),
              accountCount,
              accounts: project.accounts
            };
          })
        );

        return NextResponse.json({
          projects: projectAnalysis,
          summary: {
            totalProjects: projects.length,
            totalIncome: projectAnalysis.reduce((sum, p) => sum + p.totalIncome, 0),
            totalExpense: projectAnalysis.reduce((sum, p) => sum + p.totalExpense, 0),
            totalNetIncome: projectAnalysis.reduce((sum, p) => sum + p.netIncome, 0)
          }
        });

      default:
        return NextResponse.json(
          { error: 'نوع گزارش نامعتبر است' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching accounting reports:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت گزارش‌ها' },
      { status: 500 }
    );
  }
}
