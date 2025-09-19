import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';

// GET /api/custom-roles - دریافت لیست نقش‌های سفارشی
export async function GET() {
  try {
    const customRoles = await prisma.customRole.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(customRoles);
  } catch (error) {
    console.error('Error fetching custom roles:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت نقش‌های سفارشی' },
      { status: 500 }
    );
  }
}

// POST /api/custom-roles - ایجاد نقش سفارشی جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, label, description, color } = body;

    // بررسی فیلدهای الزامی
    if (!name || !label) {
      return NextResponse.json(
        { error: 'نام و برچسب نقش الزامی است' },
        { status: 400 }
      );
    }

    // بررسی وجود نقش با همین نام
    const existingRole = await prisma.customRole.findUnique({
      where: { name }
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'نقش با این نام قبلاً وجود دارد' },
        { status: 400 }
      );
    }

    // ایجاد نقش جدید
    const newRole = await prisma.customRole.create({
      data: {
        name,
        label,
        description,
        color: color || '#1976d2'
      }
    });

    return NextResponse.json(newRole);
  } catch (error) {
    console.error('Error creating custom role:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد نقش سفارشی' },
      { status: 500 }
    );
  }
}
