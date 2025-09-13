import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getCurrentUser } from "@/app/api/_lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let projects;

    if (user.role === "ADMIN") {
      // Admin can see all projects with financial data
      projects = await prisma.project.findMany({
        where: {
          status: "ACTIVE"
        },
        include: {
          units: {
            include: {
              userInstallments: {
                include: {
                  payments: true,
                  penalties: true
                }
              }
            }
          },
          installmentDefinitions: true
        }
      });
    } else {
      // Regular users can only see their own projects
      projects = await prisma.project.findMany({
        where: {
          status: "ACTIVE",
          units: {
            some: {
              userId: user.id
            }
          }
        },
        include: {
          units: {
            where: {
              userId: user.id
            },
            include: {
              userInstallments: {
                include: {
                  payments: true,
                  penalties: true
                }
              }
            }
          },
          installmentDefinitions: true
        }
      });
    }

    // Transform data for frontend
    const transformedProjects = projects.map(project => {
      const allUserInstallments = project.units.flatMap(unit => unit.userInstallments);
      const totalInstallments = project.installmentDefinitions.length;
      const totalAmount = allUserInstallments.reduce((sum, installment) => sum + installment.shareAmount, 0);
      const paidAmount = allUserInstallments.reduce((sum, installment) => 
        sum + installment.payments.reduce((paymentSum, payment) => {
          // Only count payments without receipt (actual payments, not receipt links)
          return paymentSum + (payment.amount > 0 && !payment.receiptImagePath ? payment.amount : 0);
        }, 0), 0
      );
      const remainingAmount = totalAmount - paidAmount;
      
      // Get unique user count
      const uniqueUsers = new Set(project.units.map(unit => unit.userId));
      const userCount = uniqueUsers.size;

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        unitsCount: project.units.length,
        userCount,
        totalInstallments,
        totalAmount,
        paidAmount,
        remainingAmount
      };
    });

    return NextResponse.json(transformedProjects);
  } catch (error) {
    console.error("Error fetching finance projects:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات پروژه‌ها" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: "شناسه پروژه الزامی است" }, { status: 400 });
    }

    console.log("Attempting to delete project:", projectId);

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        units: {
          include: {
            userInstallments: {
              include: {
                payments: true,
                penalties: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "پروژه یافت نشد" }, { status: 404 });
    }

    // Check if project has any payments
    const hasPayments = project.units.some(unit => 
      unit.userInstallments.some(installment => installment.payments.length > 0)
    );

    if (hasPayments) {
      return NextResponse.json({ 
        error: "امکان حذف پروژه وجود ندارد زیرا پرداخت‌هایی ثبت شده است",
        suggestion: "ابتدا تمام پرداخت‌ها و اقساط پروژه را حذف کنید"
      }, { status: 400 });
    }

    // Count records that will be deleted
    const totalUnits = project.units.length;
    const totalInstallments = project.units.reduce((sum, unit) => sum + unit.userInstallments.length, 0);
    const totalPenalties = project.units.reduce((sum, unit) => 
      sum + unit.userInstallments.reduce((unitSum, installment) => unitSum + installment.penalties.length, 0), 0);

    console.log(`Will delete ${totalUnits} units, ${totalInstallments} installments, ${totalPenalties} penalties`);

    // Delete all penalties first
    await prisma.penalty.deleteMany({
      where: {
        userInstallment: {
          unit: {
            projectId
          }
        }
      }
    });

    // Delete all user installments
    await prisma.userInstallment.deleteMany({
      where: {
        unit: {
          projectId
        }
      }
    });

    // Delete all installment definitions
    await prisma.installmentDefinition.deleteMany({
      where: {
        projectId
      }
    });

    // Delete all units
    await prisma.unit.deleteMany({
      where: {
        projectId
      }
    });

    // Finally delete the project
    await prisma.project.delete({
      where: { id: projectId }
    });

    console.log(`Successfully deleted project ${projectId}`);

    return NextResponse.json({
      message: "پروژه با موفقیت حذف شد",
      deletedUnits: totalUnits,
      deletedInstallments: totalInstallments,
      deletedPenalties: totalPenalties
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { 
        error: "خطا در حذف پروژه",
        details: error instanceof Error ? error.message : 'خطای نامشخص',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
