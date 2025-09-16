import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userData = request.cookies.get('userData')?.value;

    if (!userRole || !userData) {
      return NextResponse.json(
        { error: 'کاربر وارد نشده است' },
        { status: 401 }
      );
    }

    const userInfo = JSON.parse(userData);
    
    // Get full user information from database
    const user = await prisma.user.findUnique({
      where: { id: userInfo.id },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات کاربر' },
      { status: 500 }
    );
  }
}

