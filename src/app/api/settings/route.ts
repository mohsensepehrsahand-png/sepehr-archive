import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";

export async function GET(request: NextRequest) {
  try {
    // بررسی احراز هویت
    const authToken = request.cookies.get('authToken')?.value;
    if (!authToken) {
      return NextResponse.json(
        { error: 'لطفاً وارد سیستم شوید' },
        { status: 401 }
      );
    }

    const settings = await prisma.appSettings.findFirst();
    return NextResponse.json(settings ?? null);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // بررسی احراز هویت
    const authToken = req.cookies.get('authToken')?.value;
    if (!authToken) {
      return NextResponse.json(
        { error: 'لطفاً وارد سیستم شوید' },
        { status: 401 }
      );
    }

    // بررسی نقش کاربر - فقط Admin می‌تواند تنظیمات را ویرایش کند
    const userRole = req.cookies.get('userRole')?.value;
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'فقط Admin می‌تواند تنظیمات را ویرایش کند' },
        { status: 403 }
      );
    }

    const body = await req.json();
    console.log('Settings update request:', body);
    
    const updated = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: body,
      create: { id: 1, ...body },
    });
    
    console.log('Settings updated successfully:', updated);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', details: error.message },
      { status: 500 }
    );
  }
}

