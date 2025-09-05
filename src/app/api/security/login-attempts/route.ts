import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";

// GET /api/security/login-attempts - دریافت تلاش‌های ورود
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const ipAddress = searchParams.get('ip');
    const username = searchParams.get('username');
    const success = searchParams.get('success');

    const where: any = {};
    
    if (ipAddress) {
      where.ipAddress = ipAddress;
    }
    
    if (username) {
      where.username = username;
    }
    
    if (success !== null && success !== undefined) {
      where.success = success === 'true';
    }

    const [attempts, total] = await Promise.all([
      prisma.loginAttempt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.loginAttempt.count({ where })
    ]);

    return NextResponse.json({
      attempts,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching login attempts:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تلاش‌های ورود' },
      { status: 500 }
    );
  }
}
