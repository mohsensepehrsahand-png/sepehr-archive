import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';

// GET /api/archived-financial - دریافت لیست اطلاعات مالی آرشیو شده
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // ساخت شرط جستجو
    const whereClause = search ? {
      OR: [
        { username: { contains: search, mode: 'insensitive' as const } },
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    const [archivedUsers, total] = await Promise.all([
      prisma.archivedUser.findMany({
        where: whereClause,
        include: {
          archivedUnits: {
            include: {
              archivedUserInstallments: {
                include: {
                  archivedPayments: true,
                  archivedPenalties: true
                }
              }
            }
          },
          archivedUserInstallments: {
            include: {
              archivedPayments: true,
              archivedPenalties: true
            }
          }
        },
        orderBy: { archivedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.archivedUser.count({ where: whereClause })
    ]);

    // محاسبه آمار
    const stats = {
      totalArchivedUsers: total,
      totalArchivedUnits: await prisma.archivedUnit.count(),
      totalArchivedInstallments: await prisma.archivedUserInstallment.count(),
      totalArchivedPayments: await prisma.archivedPayment.count(),
      totalArchivedPenalties: await prisma.archivedPenalty.count()
    };

    return NextResponse.json({
      archivedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching archived financial data:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات آرشیو' },
      { status: 500 }
    );
  }
}
