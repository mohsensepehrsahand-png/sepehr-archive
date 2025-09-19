import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const fiscalYearId = searchParams.get('fiscalYearId');
    const reportType = searchParams.get('reportType') || 'summary';
    const userId = searchParams.get('userId');
    const stageId = searchParams.get('stageId');
    const accountDetailId = searchParams.get('accountDetailId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const currentUserId = request.cookies.get('userData')?.value ? 
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

    // Build where conditions
    const whereConditions: any = {
      projectId,
      ...(fiscalYearId && { fiscalYearId })
    };

    // Date filter
    if (startDate && endDate) {
      whereConditions.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // User filter
    if (userId) {
      whereConditions.account = {
        detail: {
          userId: userId
        }
      };
    }

    // Stage filter
    if (stageId) {
      whereConditions.accountingDocument = {
        stageId: stageId
      };
    }

    // Account detail filter
    if (accountDetailId) {
      whereConditions.account = {
        detailId: accountDetailId
      };
    }

    switch (reportType) {
      case 'summary':
        return await generateSummaryReport(whereConditions, projectId, fiscalYearId);
      
      case 'documents':
        return await generateDocumentsReport(whereConditions, projectId, fiscalYearId);
      
      case 'financial':
        return await generateFinancialReport(whereConditions, projectId, fiscalYearId);
      
      default:
        return NextResponse.json(
          { error: 'نوع گزارش نامعتبر است' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error generating detailed report:', error);
    return NextResponse.json(
      { error: 'خطا در تولید گزارش' },
      { status: 500 }
    );
  }
}

async function generateSummaryReport(whereConditions: any, projectId: string, fiscalYearId?: string) {
  try {
    // Get transactions with account details
    const transactions = await prisma.transaction.findMany({
      where: whereConditions,
      include: {
        account: {
          include: {
            detail: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Calculate totals
    const totalDebits = transactions
      .filter(t => t.type === 'DEBIT')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCredits = transactions
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalCredits - totalDebits;

    // Get related documents
    const documentIds = [...new Set(transactions.map(t => t.accountingDocument?.id).filter(Boolean))];
    const documents = documentIds.length > 0 ? await prisma.accountingDocument.findMany({
      where: {
        id: { in: documentIds }
      },
      include: {
        stage: true
      }
    }) : [];

    return NextResponse.json({
      documents,
      debts: totalDebits,
      credits: totalCredits,
      balance,
      transactions: transactions.slice(0, 50) // Limit for performance
    });
  } catch (error) {
    console.error('Error generating summary report:', error);
    throw error;
  }
}

async function generateDocumentsReport(whereConditions: any, projectId: string, fiscalYearId?: string) {
  try {
    // Get accounting documents with related data
    const documents = await prisma.accountingDocument.findMany({
      where: {
        projectId,
        ...(fiscalYearId && { fiscalYearId }),
        ...(whereConditions.accountingDocument?.stageId && { stageId: whereConditions.accountingDocument.stageId })
      },
      include: {
        stage: true,
        entries: {
          include: {
            // Note: AccountingEntry doesn't have direct user relation, 
            // we'll need to get this from account details
          }
        }
      },
      orderBy: { documentDate: 'desc' }
    });

    // Filter by user if specified
    let filteredDocuments = documents;
    if (whereConditions.account?.detail?.userId) {
      const userId = whereConditions.account.detail.userId;
      
      // Get account details for this user
      const userAccountDetails = await prisma.accountDetail.findMany({
        where: { userId },
        select: { id: true }
      });
      
      const userAccountDetailIds = userAccountDetails.map(ad => ad.id);
      
      // Filter documents that have entries with user's account details
      filteredDocuments = documents.filter(doc => 
        doc.entries.some(entry => 
          userAccountDetailIds.includes(entry.accountCode) // This might need adjustment based on your schema
        )
      );
    }

    // Add user information to entries
    const documentsWithUserInfo = await Promise.all(
      filteredDocuments.map(async (doc) => {
        const entriesWithUserInfo = await Promise.all(
          doc.entries.map(async (entry) => {
            // Find the account detail for this entry
            const accountDetail = await prisma.accountDetail.findFirst({
              where: {
                code: entry.accountCode,
                projectId
              },
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true
                  }
                }
              }
            });

            return {
              ...entry,
              accountDetail,
              user: accountDetail?.user
            };
          })
        );

        return {
          ...doc,
          entries: entriesWithUserInfo
        };
      })
    );

    return NextResponse.json({
      documents: documentsWithUserInfo,
      debts: 0,
      credits: 0,
      balance: 0,
      transactions: []
    });
  } catch (error) {
    console.error('Error generating documents report:', error);
    throw error;
  }
}

async function generateFinancialReport(whereConditions: any, projectId: string, fiscalYearId?: string) {
  try {
    // Get account details with user information
    const accountDetails = await prisma.accountDetail.findMany({
      where: {
        projectId,
        ...(fiscalYearId && { fiscalYearId }),
        ...(whereConditions.account?.detail?.userId && { userId: whereConditions.account.detail.userId })
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        accounts: {
          include: {
            transactions: {
              where: whereConditions.date ? {
                date: whereConditions.date
              } : {}
            }
          }
        }
      }
    });

    // Calculate balances for each account detail
    const transactions = accountDetails.flatMap(accountDetail => {
      const allTransactions = accountDetail.accounts.flatMap(account => account.transactions);
      
      const totalDebit = allTransactions
        .filter(t => t.type === 'DEBIT')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalCredit = allTransactions
        .filter(t => t.type === 'CREDIT')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const balance = totalCredit - totalDebit;

      return {
        accountDetail: {
          id: accountDetail.id,
          name: accountDetail.name,
          code: accountDetail.code
        },
        user: accountDetail.user,
        stage: null, // This would need to be determined from transactions
        debit: totalDebit,
        credit: totalCredit,
        balance: balance
      };
    });

    return NextResponse.json({
      documents: [],
      debts: transactions.reduce((sum, t) => sum + t.debit, 0),
      credits: transactions.reduce((sum, t) => sum + t.credit, 0),
      balance: transactions.reduce((sum, t) => sum + t.balance, 0),
      transactions
    });
  } catch (error) {
    console.error('Error generating financial report:', error);
    throw error;
  }
}
