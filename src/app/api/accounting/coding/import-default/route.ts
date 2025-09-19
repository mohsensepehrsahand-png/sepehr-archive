import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';

// Default coding structure for construction companies
const defaultCodingStructure = {
  groups: [
    {
      code: "1",
      name: "دارایی‌های جاری",
      isDefault: true,
      isProtected: true,
      sortOrder: 1,
      classes: [
        {
          code: "1",
          name: "صندوق",
          nature: "DEBIT",
          isDefault: true,
          isProtected: true,
          sortOrder: 1,
          subClasses: [
            {
              code: "01",
              name: "صندوق دفتر مرکزی",
              hasDetails: true,
              isDefault: true,
              isProtected: true,
              sortOrder: 1,
              details: [
                { code: "01", name: "صندوق پروژه A", isDefault: true, isProtected: true, sortOrder: 1 },
                { code: "02", name: "صندوق پروژه B", isDefault: true, isProtected: true, sortOrder: 2 }
              ]
            }
          ]
        },
        {
          code: "2",
          name: "بانک",
          nature: "DEBIT",
          isDefault: true,
          isProtected: true,
          sortOrder: 2,
          subClasses: [
            {
              code: "01",
              name: "بانک ملت",
              hasDetails: true,
              isDefault: true,
              isProtected: true,
              sortOrder: 1,
              details: [
                { code: "01", name: "بانک ملت حساب جاری پروژه A", isDefault: true, isProtected: true, sortOrder: 1 },
                { code: "02", name: "بانک صادرات حساب پروژه B", isDefault: true, isProtected: true, sortOrder: 2 }
              ]
            }
          ]
        },
        {
          code: "3",
          name: "مشتریان / اقساط",
          nature: "DEBIT",
          isDefault: true,
          isProtected: true,
          sortOrder: 3,
          subClasses: [
            {
              code: "01",
              name: "اقساط خریدار واحد 1 پروژه A",
              hasDetails: true,
              isDefault: true,
              isProtected: true,
              sortOrder: 1,
              details: [
                { code: "01", name: "قسط اول", isDefault: true, isProtected: true, sortOrder: 1 },
                { code: "02", name: "قسط دوم", isDefault: true, isProtected: true, sortOrder: 2 }
              ]
            },
            {
              code: "02",
              name: "اقساط خریدار واحد 2 پروژه A",
              hasDetails: true,
              isDefault: true,
              isProtected: true,
              sortOrder: 2,
              details: [
                { code: "01", name: "قسط اول", isDefault: true, isProtected: true, sortOrder: 1 },
                { code: "02", name: "قسط دوم", isDefault: true, isProtected: true, sortOrder: 2 }
              ]
            }
          ]
        }
      ]
    },
    {
      code: "2",
      name: "دارایی‌های غیرجاری",
      isDefault: true,
      isProtected: true,
      sortOrder: 2,
      classes: [
        {
          code: "1",
          name: "زمین",
          nature: "DEBIT",
          isDefault: true,
          isProtected: true,
          sortOrder: 1,
          subClasses: [
            {
              code: "01",
              name: "زمین آورده مالک",
              hasDetails: true,
              isDefault: true,
              isProtected: true,
              sortOrder: 1,
              details: [
                { code: "01", name: "زمین پروژه A", isDefault: true, isProtected: true, sortOrder: 1 }
              ]
            },
            {
              code: "02",
              name: "زمین فروخته شده به خریداران",
              hasDetails: true,
              isDefault: true,
              isProtected: true,
              sortOrder: 2,
              details: [
                { code: "01", name: "زمین واحد 1", isDefault: true, isProtected: true, sortOrder: 1 }
              ]
            }
          ]
        },
        {
          code: "2",
          name: "ساختمان در جریان تکمیل",
          nature: "DEBIT",
          isDefault: true,
          isProtected: true,
          sortOrder: 2,
          subClasses: [
            {
              code: "01",
              name: "پروژه A",
              hasDetails: true,
              isDefault: true,
              isProtected: true,
              sortOrder: 1,
              details: [
                { code: "01", name: "واحدهای پروژه A", isDefault: true, isProtected: true, sortOrder: 1 }
              ]
            },
            {
              code: "02",
              name: "پروژه B",
              hasDetails: true,
              isDefault: true,
              isProtected: true,
              sortOrder: 2,
              details: [
                { code: "01", name: "واحدهای پروژه B", isDefault: true, isProtected: true, sortOrder: 1 }
              ]
            }
          ]
        },
        {
          code: "3",
          name: "ماشین‌آلات و ابزار",
          nature: "DEBIT",
          isDefault: true,
          isProtected: true,
          sortOrder: 3,
          subClasses: [
            {
              code: "01",
              name: "ماشین‌آلات سنگین",
              hasDetails: false,
              isDefault: true,
              isProtected: true,
              sortOrder: 1,
              details: []
            },
            {
              code: "02",
              name: "ابزار کارگاهی",
              hasDetails: false,
              isDefault: true,
              isProtected: true,
              sortOrder: 2,
              details: []
            }
          ]
        }
      ]
    },
    {
      code: "3",
      name: "بدهی‌ها",
      isDefault: true,
      isProtected: true,
      sortOrder: 3,
      classes: [
        {
          code: "1",
          name: "حساب‌های پرداختنی",
          nature: "CREDIT",
          isDefault: true,
          isProtected: true,
          sortOrder: 1,
          subClasses: [
            {
              code: "01",
              name: "پیمانکاران جزء",
              hasDetails: true,
              isDefault: true,
              isProtected: true,
              sortOrder: 1,
              details: [
                { code: "01", name: "پیمانکار A", isDefault: true, isProtected: true, sortOrder: 1 }
              ]
            },
            {
              code: "02",
              name: "تأمین‌کنندگان مصالح",
              hasDetails: true,
              isDefault: true,
              isProtected: true,
              sortOrder: 2,
              details: [
                { code: "01", name: "تأمین‌کننده سیمان", isDefault: true, isProtected: true, sortOrder: 1 }
              ]
            }
          ]
        },
        {
          code: "2",
          name: "وام بانکی",
          nature: "CREDIT",
          isDefault: true,
          isProtected: true,
          sortOrder: 2,
          subClasses: [
            {
              code: "01",
              name: "وام بانکی پروژه A",
              hasDetails: false,
              isDefault: true,
              isProtected: true,
              sortOrder: 1,
              details: []
            }
          ]
        }
      ]
    },
    {
      code: "4",
      name: "حقوق صاحبان سرمایه / سهام",
      isDefault: true,
      isProtected: true,
      sortOrder: 4,
      classes: [
        {
          code: "1",
          name: "سرمایه / آورده",
          nature: "CREDIT",
          isDefault: true,
          isProtected: true,
          sortOrder: 1,
          subClasses: [
            {
              code: "01",
              name: "سرمایه اولیه شخصی",
              hasDetails: false,
              isDefault: true,
              isProtected: true,
              sortOrder: 1,
              details: []
            },
            {
              code: "02",
              name: "آورده مالک زمین",
              hasDetails: true,
              isDefault: true,
              isProtected: true,
              sortOrder: 2,
              details: [
                { code: "01", name: "زمین پروژه A", isDefault: true, isProtected: true, sortOrder: 1 }
              ]
            },
            {
              code: "03",
              name: "آورده خریداران",
              hasDetails: true,
              isDefault: true,
              isProtected: true,
              sortOrder: 3,
              details: [
                { code: "01", name: "خریدار واحد 1", isDefault: true, isProtected: true, sortOrder: 1 },
                { code: "02", name: "خریدار واحد 2", isDefault: true, isProtected: true, sortOrder: 2 }
              ]
            },
            {
              code: "04",
              name: "پیش‌پرداخت خریداران پروژه A",
              hasDetails: true,
              isDefault: true,
              isProtected: true,
              sortOrder: 4,
              details: [
                { code: "01", name: "واحد 1", isDefault: true, isProtected: true, sortOrder: 1 },
                { code: "02", name: "واحد 2", isDefault: true, isProtected: true, sortOrder: 2 }
              ]
            }
          ]
        },
        {
          code: "2",
          name: "سود/زیان انباشته",
          nature: "CREDIT",
          isDefault: true,
          isProtected: true,
          sortOrder: 2,
          subClasses: [
            {
              code: "01",
              name: "سود انباشته",
              hasDetails: false,
              isDefault: true,
              isProtected: true,
              sortOrder: 1,
              details: []
            },
            {
              code: "02",
              name: "زیان انباشته",
              hasDetails: false,
              isDefault: true,
              isProtected: true,
              sortOrder: 2,
              details: []
            }
          ]
        },
        {
          code: "3",
          name: "تسویه با مالک و خریداران",
          nature: "DEBIT_CREDIT",
          isDefault: true,
          isProtected: true,
          sortOrder: 3,
          subClasses: [
            {
              code: "01",
              name: "تسویه با مالک زمین",
              hasDetails: false,
              isDefault: true,
              isProtected: true,
              sortOrder: 1,
              details: []
            },
            {
              code: "02",
              name: "تسویه با خریداران",
              hasDetails: false,
              isDefault: true,
              isProtected: true,
              sortOrder: 2,
              details: []
            }
          ]
        }
      ]
    },
    {
      code: "5",
      name: "خرید",
      isDefault: true,
      isProtected: true,
      sortOrder: 5,
      classes: [
        {
          code: "1",
          name: "خرید مصالح",
          nature: "DEBIT",
          isDefault: true,
          isProtected: true,
          sortOrder: 1,
          subClasses: [
            {
              code: "01",
              name: "خرید سیمان",
              hasDetails: false,
              isDefault: true,
              isProtected: true,
              sortOrder: 1,
              details: []
            },
            {
              code: "02",
              name: "خرید آجر",
              hasDetails: false,
              isDefault: true,
              isProtected: true,
              sortOrder: 2,
              details: []
            }
          ]
        }
      ]
    },
    {
      code: "6",
      name: "فروش",
      isDefault: true,
      isProtected: true,
      sortOrder: 6,
      classes: [
        {
          code: "1",
          name: "فروش قدرالسهم زمین",
          nature: "CREDIT",
          isDefault: true,
          isProtected: true,
          sortOrder: 1,
          subClasses: [
            {
              code: "01",
              name: "فروش قدرالسهم زمین پروژه A",
              hasDetails: false,
              isDefault: true,
              isProtected: true,
              sortOrder: 1,
              details: []
            }
          ]
        },
        {
          code: "2",
          name: "فروش واحدها",
          nature: "CREDIT",
          isDefault: true,
          isProtected: true,
          sortOrder: 2,
          subClasses: [
            {
              code: "01",
              name: "فروش واحدهای پروژه A",
              hasDetails: false,
              isDefault: true,
              isProtected: true,
              sortOrder: 1,
              details: []
            }
          ]
        }
      ]
    },
    {
      code: "7",
      name: "درآمدها",
      isDefault: true,
      isProtected: true,
      sortOrder: 7,
      classes: [
        {
          code: "1",
          name: "سود پیمانکاری",
          nature: "CREDIT",
          isDefault: true,
          isProtected: true,
          sortOrder: 1,
          subClasses: [
            {
              code: "01",
              name: "سود پروژه A",
              hasDetails: false,
              isDefault: true,
              isProtected: true,
              sortOrder: 1,
              details: []
            }
          ]
        }
      ]
    },
    {
      code: "8",
      name: "هزینه‌ها",
      isDefault: true,
      isProtected: true,
      sortOrder: 8,
      classes: [
        {
          code: "1",
          name: "هزینه ساخت",
          nature: "DEBIT",
          isDefault: true,
          isProtected: true,
          sortOrder: 1,
          subClasses: [
            {
              code: "01",
              name: "هزینه ساخت پروژه A",
              hasDetails: false,
              isDefault: true,
              isProtected: true,
              sortOrder: 1,
              details: []
            }
          ]
        }
      ]
    },
    {
      code: "9",
      name: "حساب‌های انتظامی",
      isDefault: true,
      isProtected: true,
      sortOrder: 9,
      classes: [
        {
          code: "1",
          name: "حساب‌های انتظامی",
          nature: "DEBIT_CREDIT",
          isDefault: true,
          isProtected: true,
          sortOrder: 1,
          subClasses: [
            {
              code: "01",
              name: "حساب انتظامی A",
              hasDetails: false,
              isDefault: true,
              isProtected: true,
              sortOrder: 1,
              details: []
            }
          ]
        }
      ]
    }
  ]
};

export async function POST(request: NextRequest) {
  try {
    console.log('Import default coding API called');
    const body = await request.json();
    console.log('Request body:', body);
    const { projectId } = body;

    if (!projectId) {
      console.log('No projectId provided');
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    console.log('ProjectId:', projectId);

    // Check if default coding already exists for this project and fiscal year
    console.log('Checking for existing groups...');
    const whereClause: any = { projectId, isDefault: true };
    if (body.fiscalYearId) {
      whereClause.fiscalYearId = body.fiscalYearId;
    } else {
      whereClause.fiscalYearId = null;
    }
    
    const existingGroups = await prisma.accountGroup.findMany({
      where: whereClause
    });
    console.log('Existing groups found:', existingGroups.length);

    if (existingGroups.length > 0) {
      return NextResponse.json({ 
        error: 'Default coding structure already exists for this project' 
      }, { status: 400 });
    }

    // Start transaction to import all default coding
    const result = await prisma.$transaction(async (tx) => {
      const importedGroups = [];

      for (const groupData of defaultCodingStructure.groups) {
        // Create group
        const group = await tx.accountGroup.create({
          data: {
            projectId,
            fiscalYearId: body.fiscalYearId || null,
            code: groupData.code,
            name: groupData.name,
            isDefault: groupData.isDefault,
            isProtected: groupData.isProtected,
            isActive: true,
            sortOrder: groupData.sortOrder
          }
        });

        const importedClasses = [];

        for (const classData of groupData.classes) {
          // Create class
          const accountClass = await tx.accountClass.create({
            data: {
              projectId,
              fiscalYearId: body.fiscalYearId || null,
              groupId: group.id,
              code: classData.code,
              name: classData.name,
              nature: classData.nature,
              isDefault: classData.isDefault,
              isProtected: classData.isProtected,
              isActive: true,
              sortOrder: classData.sortOrder
            }
          });

          const importedSubClasses = [];

          for (const subClassData of classData.subClasses) {
            // Create subclass
            const subClass = await tx.accountSubClass.create({
              data: {
                projectId,
                fiscalYearId: body.fiscalYearId || null,
                classId: accountClass.id,
                code: subClassData.code,
                name: subClassData.name,
                hasDetails: subClassData.hasDetails,
                isDefault: subClassData.isDefault,
                isProtected: subClassData.isProtected,
                isActive: true,
                sortOrder: subClassData.sortOrder
              }
            });

            const importedDetails = [];

            for (const detailData of subClassData.details) {
              // Create detail
              const detail = await tx.accountDetail.create({
                data: {
                  projectId,
                  fiscalYearId: body.fiscalYearId || null,
                  subClassId: subClass.id,
                  code: detailData.code,
                  name: detailData.name,
                  isDefault: detailData.isDefault,
                  isProtected: detailData.isProtected,
                  isActive: true,
                  sortOrder: detailData.sortOrder
                }
              });

              importedDetails.push(detail);
            }

            importedSubClasses.push({
              ...subClass,
              details: importedDetails
            });
          }

          importedClasses.push({
            ...accountClass,
            subClasses: importedSubClasses
          });
        }

        importedGroups.push({
          ...group,
          classes: importedClasses
        });
      }

      return importedGroups;
    });

    return NextResponse.json({ 
      message: 'Default coding structure imported successfully',
      data: result
    });

  } catch (error) {
    console.error('Error importing default coding structure:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/accounting/coding/import-default?projectId=...
// Removes all default coding items (isDefault=true) for a project
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Delete details that belong to default subclasses
      await tx.accountDetail.deleteMany({
        where: {
          projectId,
          isDefault: true
        }
      });

      // Delete subclasses
      await tx.accountSubClass.deleteMany({
        where: {
          projectId,
          isDefault: true
        }
      });

      // Delete classes
      await tx.accountClass.deleteMany({
        where: {
          projectId,
          isDefault: true
        }
      });

      // Delete groups
      await tx.accountGroup.deleteMany({
        where: {
          projectId,
          isDefault: true
        }
      });
    });

    return NextResponse.json({ message: 'Default coding removed successfully' });
  } catch (error) {
    console.error('Error deleting default coding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

