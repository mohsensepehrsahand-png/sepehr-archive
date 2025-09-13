import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return request.ip || '127.0.0.1';
}

// Helper function to check if IP is in blacklist
function isIPBlacklisted(ip: string, blacklist: string): boolean {
  if (!blacklist) return false;
  
  const blacklistedIPs = blacklist.split('\n').map(ip => ip.trim()).filter(ip => ip);
  
  for (const blacklistedIP of blacklistedIPs) {
    if (blacklistedIP === ip) return true;
    
    // Check for CIDR notation (e.g., 192.168.1.0/24)
    if (blacklistedIP.includes('/')) {
      const [network, prefixLength] = blacklistedIP.split('/');
      if (isIPInCIDR(ip, network, parseInt(prefixLength))) {
        return true;
      }
    }
  }
  
  return false;
}

// Helper function to check if IP is in CIDR range
function isIPInCIDR(ip: string, network: string, prefixLength: number): boolean {
  const ipParts = ip.split('.').map(Number);
  const networkParts = network.split('.').map(Number);
  
  const ipNum = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
  const networkNum = (networkParts[0] << 24) + (networkParts[1] << 16) + (networkParts[2] << 8) + networkParts[3];
  const mask = (0xFFFFFFFF << (32 - prefixLength)) >>> 0;
  
  return (ipNum & mask) === (networkNum & mask);
}

// Helper function to add IP to blacklist
async function addIPToBlacklist(ip: string): Promise<void> {
  const settings = await prisma.appSettings.findFirst();
  if (!settings) return;
  
  const currentBlacklist = settings.ipBlacklist || '';
  const blacklistedIPs = currentBlacklist.split('\n').map(ip => ip.trim()).filter(ip => ip);
  
  if (!blacklistedIPs.includes(ip)) {
    blacklistedIPs.push(ip);
    const newBlacklist = blacklistedIPs.join('\n');
    
    await prisma.appSettings.update({
      where: { id: 1 },
      data: { ipBlacklist: newBlacklist }
    });
  }
}

// Helper function to deactivate user
async function deactivateUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false }
  });
}

// POST /api/auth/login - ورود کاربر
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';

    // بررسی فیلدهای الزامی
    if (!username || !password) {
      return NextResponse.json(
        { error: 'نام کاربری و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    // دریافت تنظیمات امنیتی
    const settings = await prisma.appSettings.findFirst();
    const maxLoginAttempts = settings?.maxLoginAttempts || 5;

    // بررسی لیست سیاه IP
    if (settings?.ipBlacklist && isIPBlacklisted(clientIP, settings.ipBlacklist)) {
      // ثبت تلاش ورود ناموفق
      await prisma.loginAttempt.create({
        data: {
          ipAddress: clientIP,
          username,
          success: false,
          userAgent
        }
      });

      return NextResponse.json(
        { error: 'آدرس IP شما مسدود شده است. لطفاً با مدیر سیستم تماس بگیرید.' },
        { status: 403 }
      );
    }

    // جستجوی کاربر در دیتابیس
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        passwordHash: true,
        isActive: true
      }
    });

    // بررسی وجود کاربر
    if (!user) {
      // ثبت تلاش ورود ناموفق
      await prisma.loginAttempt.create({
        data: {
          ipAddress: clientIP,
          username,
          success: false,
          userAgent
        }
      });

      // بررسی تعداد تلاش‌های ناموفق برای این IP (فقط برای نام کاربری‌های ناموجود)
      const recentFailedAttempts = await prisma.loginAttempt.count({
        where: {
          ipAddress: clientIP,
          success: false,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 ساعت گذشته
          }
        }
      });

      // اگر تعداد تلاش‌های ناموفق از حد مجاز بیشتر شد، IP را بلاک کن
      // اما اگر این IP متعلق به ادمین است، بلاک نکن
      if (recentFailedAttempts >= maxLoginAttempts) {
        // بررسی اینکه آیا این IP متعلق به ادمین است یا نه
        const adminUser = await prisma.user.findFirst({
          where: { role: 'ADMIN' },
          select: { id: true }
        });
        
        if (adminUser) {
          // بررسی آخرین ورود موفق ادمین از این IP
          const lastAdminLogin = await prisma.loginAttempt.findFirst({
            where: {
              username: { contains: 'admin' }, // یا می‌توانید نام کاربری ادمین را مستقیماً چک کنید
              ipAddress: clientIP,
              success: true
            },
            orderBy: { createdAt: 'desc' }
          });
          
          // اگر ادمین اخیراً از این IP وارد شده، IP را بلاک نکن
          if (lastAdminLogin && 
              (Date.now() - lastAdminLogin.createdAt.getTime()) < 7 * 24 * 60 * 60 * 1000) { // 7 روز گذشته
            return NextResponse.json(
              { error: 'نام کاربری یا رمز عبور اشتباه است' },
              { status: 401 }
            );
          }
        }
        
        await addIPToBlacklist(clientIP);
        
        return NextResponse.json(
          { error: 'تعداد تلاش‌های ناموفق بیش از حد مجاز است. آدرس IP شما مسدود شد.' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'نام کاربری یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    // بررسی فعال بودن کاربر
    if (!user.isActive) {
      // ثبت تلاش ورود ناموفق
      await prisma.loginAttempt.create({
        data: {
          ipAddress: clientIP,
          username,
          success: false,
          userAgent
        }
      });

      return NextResponse.json(
        { error: 'شما فعلاً اجازه ورود ندارید. لطفاً با مدیر سیستم تماس بگیرید.' },
        { status: 401 }
      );
    }

    // بررسی رمز عبور
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      // ثبت تلاش ورود ناموفق
      await prisma.loginAttempt.create({
        data: {
          ipAddress: clientIP,
          username,
          success: false,
          userAgent
        }
      });

      // بررسی تعداد تلاش‌های ناموفق برای این کاربر (فقط برای کاربران غیر ادمین)
      if (user.role !== 'ADMIN') {
        const userFailedAttempts = await prisma.loginAttempt.count({
          where: {
            username,
            success: false,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 ساعت گذشته
            }
          }
        });

        // اگر تعداد تلاش‌های ناموفق کاربر از حد مجاز بیشتر شد، کاربر را غیرفعال کن
        if (userFailedAttempts >= maxLoginAttempts) {
          await deactivateUser(user.id);
          
          return NextResponse.json(
            { error: 'تعداد تلاش‌های ناموفق بیش از حد مجاز است. حساب کاربری شما غیرفعال شد.' },
            { status: 403 }
          );
        }
      }

      return NextResponse.json(
        { error: 'نام کاربری یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    // ورود موفق - ثبت تلاش موفق
    await prisma.loginAttempt.create({
      data: {
        ipAddress: clientIP,
        username,
        success: true,
        userAgent
      }
    });

    // ریست کردن تلاش‌های ناموفق قبلی برای این کاربر (برای شروع شمارش جدید)
    // این کار باعث می‌شود که اگر کاربر دوباره رمز اشتباه بزند، از صفر شروع به شمارش کند
    await prisma.loginAttempt.deleteMany({
      where: {
        username,
        success: false,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 ساعت گذشته
        }
      }
    });

    // حذف رمز عبور از پاسخ
    const { passwordHash, ...userWithoutPassword } = user;

    // ایجاد response با کوکی‌ها
    const response = NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: 'ورود موفقیت‌آمیز'
    });

    // تنظیم کوکی‌ها
    response.cookies.set('authToken', 'user-token', {
      maxAge: 60 * 60 * 24 * 7, // 7 روز
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'lax'
    });

    response.cookies.set('userRole', user.role, {
      maxAge: 60 * 60 * 24 * 7, // 7 روز
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'lax'
    });

    response.cookies.set('userData', JSON.stringify(userWithoutPassword), {
      maxAge: 60 * 60 * 24 * 7, // 7 روز
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'lax'
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'خطا در ورود به سیستم' },
      { status: 500 }
    );
  }
}
