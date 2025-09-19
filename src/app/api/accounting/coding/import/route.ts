import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';
import { logActivity } from '@/lib/activityLogger';

// POST /api/accounting/coding/import - ایمپورت کدینگ از پروژه دیگر
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetProjectId, targetFiscalYearId, sourceProjectId, sourceFiscalYearId } = body;

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userId = request.cookies.get('userData')?.value ? 
      JSON.parse(request.cookies.get('userData')?.value || '{}').id : null;

    // Only admin users can import coding
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز ایمپورت کدینگ ندارید' },
        { status: 403 }
      );
    }

    if (!targetProjectId || !targetFiscalYearId || !sourceProjectId || !sourceFiscalYearId) {
      return NextResponse.json(
        { error: 'تمام فیلدهای مورد نیاز باید پر شوند' },
        { status: 400 }
      );
    }

    // Check if target and source are the same
    if (targetProjectId === sourceProjectId && targetFiscalYearId === sourceFiscalYearId) {
      return NextResponse.json(
        { error: 'نمی‌توان کدینگ را از همان پروژه و سال مالی کپی کرد' },
        { status: 400 }
      );
    }

    // Verify source fiscal year exists and has coding data
    const sourceFiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        id: sourceFiscalYearId,
        projectId: sourceProjectId
      },
      include: {
        // Check for old account structure
        accounts: {
          orderBy: [
            { level: 'asc' },
            { code: 'asc' }
          ]
        },
        // Check for new hierarchical structure
        accountGroups: {
          include: {
            classes: {
              include: {
                subClasses: {
                  include: {
                    details: true
                  }
                }
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        },
        project: {
          select: {
            name: true
          }
        }
      }
    });

    if (!sourceFiscalYear) {
      return NextResponse.json(
        { error: 'سال مالی مبدأ یافت نشد' },
        { status: 404 }
      );
    }

    // Check if source has any coding data
    const hasOldStructure = sourceFiscalYear.accounts.length > 0;
    const hasNewStructure = sourceFiscalYear.accountGroups.length > 0;

    if (!hasOldStructure && !hasNewStructure) {
      return NextResponse.json(
        { error: 'سال مالی مبدأ هیچ کدینگی ندارد' },
        { status: 400 }
      );
    }

    // Verify target fiscal year exists
    const targetFiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        id: targetFiscalYearId,
        projectId: targetProjectId
      },
      include: {
        project: {
          select: {
            name: true
          }
        }
      }
    });

    if (!targetFiscalYear) {
      return NextResponse.json(
        { error: 'سال مالی مقصد یافت نشد' },
        { status: 404 }
      );
    }

    // Check if target fiscal year already has coding data
    const existingAccounts = await prisma.account.findFirst({
      where: {
        fiscalYearId: targetFiscalYearId
      }
    });

    const existingGroups = await prisma.accountGroup.findFirst({
      where: {
        fiscalYearId: targetFiscalYearId
      }
    });

    if (existingAccounts || existingGroups) {
      return NextResponse.json(
        { error: 'سال مالی مقصد قبلاً کدینگ دارد. ابتدا کدینگ موجود را حذف کنید' },
        { status: 400 }
      );
    }

    // Start transaction to import coding
    const result = await prisma.$transaction(async (tx) => {
      let totalImported = 0;

      if (hasNewStructure) {
        // Import new hierarchical structure (AccountGroups, Classes, SubClasses, Details)
        const groupMapping = new Map<string, string>();
        const classMapping = new Map<string, string>();
        const subClassMapping = new Map<string, string>();
        const detailMapping = new Map<string, string>();

        // Import Account Groups
        for (const sourceGroup of sourceFiscalYear.accountGroups) {
          const newGroup = await tx.accountGroup.create({
            data: {
              projectId: targetProjectId,
              fiscalYearId: targetFiscalYearId,
              code: sourceGroup.code,
              name: sourceGroup.name,
              isDefault: sourceGroup.isDefault,
              isProtected: false, // Don't protect imported items
              sortOrder: sourceGroup.sortOrder
            }
          });
          groupMapping.set(sourceGroup.id, newGroup.id);
          totalImported++;
        }

        // Import Account Classes
        for (const sourceGroup of sourceFiscalYear.accountGroups) {
          for (const sourceClass of sourceGroup.classes) {
            const newClass = await tx.accountClass.create({
              data: {
                projectId: targetProjectId,
                fiscalYearId: targetFiscalYearId,
                groupId: groupMapping.get(sourceGroup.id)!,
                code: sourceClass.code,
                name: sourceClass.name,
                nature: sourceClass.nature,
                isDefault: sourceClass.isDefault,
                isProtected: false,
                sortOrder: sourceClass.sortOrder
              }
            });
            classMapping.set(sourceClass.id, newClass.id);
            totalImported++;
          }
        }

        // Import Account Sub Classes
        for (const sourceGroup of sourceFiscalYear.accountGroups) {
          for (const sourceClass of sourceGroup.classes) {
            for (const sourceSubClass of sourceClass.subClasses) {
              const newSubClass = await tx.accountSubClass.create({
                data: {
                  projectId: targetProjectId,
                  fiscalYearId: targetFiscalYearId,
                  classId: classMapping.get(sourceClass.id)!,
                  code: sourceSubClass.code,
                  name: sourceSubClass.name,
                  hasDetails: sourceSubClass.hasDetails,
                  isDefault: sourceSubClass.isDefault,
                  isProtected: false,
                  sortOrder: sourceSubClass.sortOrder
                }
              });
              subClassMapping.set(sourceSubClass.id, newSubClass.id);
              totalImported++;
            }
          }
        }

        // Import Account Details
        for (const sourceGroup of sourceFiscalYear.accountGroups) {
          for (const sourceClass of sourceGroup.classes) {
            for (const sourceSubClass of sourceClass.subClasses) {
              for (const sourceDetail of sourceSubClass.details) {
                const newDetail = await tx.accountDetail.create({
                  data: {
                    projectId: targetProjectId,
                    fiscalYearId: targetFiscalYearId,
                    subClassId: subClassMapping.get(sourceSubClass.id)!,
                    userId: sourceDetail.userId, // Keep user reference if exists
                    code: sourceDetail.code,
                    name: sourceDetail.name,
                    description: sourceDetail.description,
                    isDefault: sourceDetail.isDefault,
                    isProtected: false,
                    sortOrder: sourceDetail.sortOrder
                  }
                });
                detailMapping.set(sourceDetail.id, newDetail.id);
                totalImported++;
              }
            }
          }
        }
      } else if (hasOldStructure) {
        // Import old account structure
        const accountMapping = new Map<string, string>();

        // Sort accounts by level to ensure parents are created first
        const sortedAccounts = [...sourceFiscalYear.accounts].sort((a, b) => {
          if (a.level !== b.level) return a.level - b.level;
          return a.code.localeCompare(b.code);
        });

        // Create accounts recursively
        for (const sourceAccount of sortedAccounts) {
          const newAccount = await tx.account.create({
            data: {
              projectId: targetProjectId,
              fiscalYearId: targetFiscalYearId,
              name: sourceAccount.name,
              code: sourceAccount.code,
              type: sourceAccount.type,
              level: sourceAccount.level,
              description: sourceAccount.description,
              contact: sourceAccount.contact,
              isActive: sourceAccount.isActive,
              parentId: sourceAccount.parentId ? accountMapping.get(sourceAccount.parentId) || null : null
            }
          });

          // Map old ID to new ID for parent relationships
          accountMapping.set(sourceAccount.id, newAccount.id);
          totalImported++;
        }
      }

      // Log activity
      await logActivity(
        userId || 'system',
        'IMPORT_CODING',
        `کدینگ از پروژه ${sourceFiscalYear.project.name} (سال ${sourceFiscalYear.year}) به پروژه ${targetFiscalYear.project.name} (سال ${targetFiscalYear.year}) ایمپورت شد`,
        {
          sourceProjectId,
          sourceFiscalYearId,
          targetProjectId,
          targetFiscalYearId,
          itemsImported: totalImported
        }
      );

      return {
        itemsImported: totalImported,
        sourceProject: sourceFiscalYear.project.name,
        sourceYear: sourceFiscalYear.year,
        targetProject: targetFiscalYear.project.name,
        targetYear: targetFiscalYear.year
      };
    });

    return NextResponse.json({
      message: 'کدینگ با موفقیت ایمپورت شد',
      accountsImported: result.itemsImported,
      ...result
    }, { status: 201 });

  } catch (error) {
    console.error('Error importing coding:', error);
    return NextResponse.json(
      { error: 'خطا در ایمپورت کدینگ' },
      { status: 500 }
    );
  }
}
