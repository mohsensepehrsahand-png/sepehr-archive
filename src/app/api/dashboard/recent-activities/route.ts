import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard/recent-activities - دریافت فعالیت‌های اخیر
export async function GET(request: NextRequest) {
  try {
    // Get user role from cookies
    const userRole = request.cookies.get('userRole')?.value;
    const userDataCookie = request.cookies.get('userData')?.value;
    
    let userId = null;
    if (userDataCookie) {
      try {
        const userData = JSON.parse(userDataCookie);
        userId = userData.id;
      } catch (error) {
        console.error('Error parsing userData cookie:', error);
      }
    }

    // Only admin users can access dashboard data
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما مجوز دسترسی به این اطلاعات ندارید' },
        { status: 403 }
      );
    }

    // Get recent activities (last 7 days) - ONLY from activityLog table
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get recent activity logs ONLY
    const recentActivityLogs = await prisma.activityLog.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    // Format activities from activity logs only
    const activities = [];

    recentActivityLogs.forEach(log => {
      let title = '';
      let icon = '';
      let color = '';

      switch (log.action) {
        case 'CREATE':
          title = `${log.resourceType === 'PROJECT' ? 'پروژه' : 
                   log.resourceType === 'FOLDER' ? 'پوشه' : 'سند'} "${log.resourceName}" ایجاد شد`;
          icon = log.resourceType === 'PROJECT' ? 'folder_add' : 
                 log.resourceType === 'FOLDER' ? 'create_new_folder' : 'upload_file';
          color = 'success';
          break;
        case 'UPDATE':
          title = `${log.resourceType === 'PROJECT' ? 'پروژه' : 
                   log.resourceType === 'FOLDER' ? 'پوشه' : 'سند'} "${log.resourceName}" ویرایش شد`;
          icon = 'edit';
          color = 'warning';
          break;
        case 'DELETE':
          title = `${log.resourceType === 'PROJECT' ? 'پروژه' : 
                   log.resourceType === 'FOLDER' ? 'پوشه' : 'سند'} "${log.resourceName}" حذف شد`;
          icon = 'delete';
          color = 'error';
          break;
        default:
          title = log.description || `فعالیت روی ${log.resourceName}`;
          icon = 'info';
          color = 'info';
      }

      activities.push({
        id: `log-${log.id}`,
        type: `${log.resourceType.toLowerCase()}_${log.action.toLowerCase()}`,
        title,
        description: log.description || 'بدون توضیحات',
        user: log.user ? 
          `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || 
          log.user.username : 
          'نامشخص',
        timestamp: log.createdAt,
        icon,
        color
      });
    });

    // Return top 10 activities with no-cache headers
    return NextResponse.json(activities.slice(0, 10), {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت فعالیت‌های اخیر' },
      { status: 500 }
    );
  }
}
