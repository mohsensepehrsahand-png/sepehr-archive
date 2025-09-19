import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// اطمینان از اتصال به دیتابیس
prisma.$connect();

// GET /api/users - دریافت لیست کاربران
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        customRoleId: true,
        customRole: {
          select: {
            id: true,
            name: true,
            label: true,
            color: true
          }
        },
        isActive: true,
        email: true,
        createdAt: true,
        passwordHash: true
      },
      // نمایش همه کاربران (فعال و غیرفعال)
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت کاربران' },
      { status: 500 }
    );
  }
}

// POST /api/users - ایجاد کاربر جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received user data:', { ...body, password: '[HIDDEN]' });
    
    const { username, password, firstName, lastName, email, role, customRoleId } = body;

    // بررسی فیلدهای الزامی
    if (!username || !password) {
      return NextResponse.json(
        { error: 'نام کاربری و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    // بررسی وجود کاربر با همین نام کاربری (فعال یا غیرفعال)
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      // حذف کاربر موجود (فعال یا غیرفعال)
      await prisma.user.delete({
        where: { id: existingUser.id }
      });
    }

    // بررسی وجود ایمیل تکراری (فقط اگر ایمیل ارائه شده باشد)
    if (email && email.trim()) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: email.trim() }
      });

      if (existingEmail) {
        if (existingEmail.isActive) {
          return NextResponse.json(
            { error: 'ایمیل قبلاً استفاده شده است' },
            { status: 400 }
          );
        } else {
          // اگر کاربر غیرفعال است، آن را حذف کنیم
          await prisma.user.delete({
            where: { id: existingEmail.id }
          });
        }
      }
    }

    // هش کردن رمز عبور
    const passwordHash = await bcrypt.hash(password, 10);

    // ایجاد کاربر جدید
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        firstName,
        lastName,
        email: email && email.trim() ? email.trim() : null,
        role,
        customRoleId: customRoleId || null
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        customRoleId: true,
        customRole: {
          select: {
            id: true,
            name: true,
            label: true,
            color: true
          }
        },
        email: true,
        isActive: true,
        createdAt: true
      }
    });

    return NextResponse.json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: `خطا در ایجاد کاربر: ${error instanceof Error ? error.message : 'خطای نامشخص'}` },
      { status: 500 }
    );
  }
}
