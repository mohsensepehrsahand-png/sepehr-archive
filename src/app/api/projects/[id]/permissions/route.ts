import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET /api/projects/[id]/permissions - دریافت دسترسی‌های پروژه
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;

    // Only admin users can view project permissions
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز مشاهده دسترسی‌های پروژه ندارید' },
        { status: 403 }
      );
    }
    
    const permissions = await prisma.permission.findMany({
      where: {
        resourceType: 'PROJECT',
        resourceId: id
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error fetching project permissions:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت دسترسی‌ها' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/permissions - افزودن یا بروزرسانی دسترسی
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, accessLevel } = await request.json();

    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;

    // Only admin users can manage project permissions
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز مدیریت دسترسی‌های پروژه ندارید' },
        { status: 403 }
      );
    }

    // بررسی وجود پروژه
    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'پروژه یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی وجود کاربر
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // افزودن یا بروزرسانی دسترسی
    const permission = await prisma.permission.upsert({
      where: {
        userId_resourceType_resourceId: {
          userId,
          resourceType: 'PROJECT',
          resourceId: id
        }
      },
      update: {
        accessLevel
      },
      create: {
        userId,
        resourceType: 'PROJECT',
        resourceId: id,
        accessLevel
      }
    });

    return NextResponse.json(permission);
  } catch (error) {
    console.error('Error updating project permission:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی دسترسی' },
      { status: 500 }
    );
  }
}
