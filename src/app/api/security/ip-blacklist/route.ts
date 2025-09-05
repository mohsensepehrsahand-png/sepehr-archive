import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";

// GET /api/security/ip-blacklist - دریافت لیست IP های مسدود شده
export async function GET() {
  try {
    const settings = await prisma.appSettings.findFirst();
    const blacklist = settings?.ipBlacklist || '';
    
    const blacklistedIPs = blacklist
      .split('\n')
      .map(ip => ip.trim())
      .filter(ip => ip)
      .map(ip => ({
        ip,
        blockedAt: 'نامشخص' // می‌توانید از LoginAttempt استفاده کنید تا زمان دقیق را پیدا کنید
      }));

    return NextResponse.json(blacklistedIPs);
  } catch (error) {
    console.error('Error fetching IP blacklist:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست IP های مسدود شده' },
      { status: 500 }
    );
  }
}

// DELETE /api/security/ip-blacklist - حذف IP از لیست سیاه
export async function DELETE(request: NextRequest) {
  try {
    const { ip } = await request.json();
    
    if (!ip) {
      return NextResponse.json(
        { error: 'آدرس IP الزامی است' },
        { status: 400 }
      );
    }

    const settings = await prisma.appSettings.findFirst();
    if (!settings) {
      return NextResponse.json(
        { error: 'تنظیمات یافت نشد' },
        { status: 404 }
      );
    }

    const currentBlacklist = settings.ipBlacklist || '';
    const blacklistedIPs = currentBlacklist
      .split('\n')
      .map(ip => ip.trim())
      .filter(ip => ip);

    const updatedBlacklist = blacklistedIPs
      .filter(blacklistedIP => blacklistedIP !== ip)
      .join('\n');

    await prisma.appSettings.update({
      where: { id: 1 },
      data: { ipBlacklist: updatedBlacklist }
    });

    return NextResponse.json({ 
      success: true, 
      message: `IP ${ip} از لیست سیاه حذف شد` 
    });
  } catch (error) {
    console.error('Error removing IP from blacklist:', error);
    return NextResponse.json(
      { error: 'خطا در حذف IP از لیست سیاه' },
      { status: 500 }
    );
  }
}
