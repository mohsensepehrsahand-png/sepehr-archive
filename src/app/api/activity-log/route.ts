import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, action, documentId, documentName, projectId, details } = body;

    // Get current user from session/cookie
    const authToken = request.cookies.get('authToken')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user info
    const currentUser = await getCurrentUser(authToken);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Determine resource type and ID
    let resourceType = 'DOCUMENT';
    let resourceId = documentId;
    let resourceName = documentName;

    if (type === 'project') {
      resourceType = 'PROJECT';
      resourceId = projectId;
      resourceName = details?.projectName || 'پروژه';
    } else if (type === 'folder') {
      resourceType = 'FOLDER';
      resourceId = details?.folderId || '';
      resourceName = details?.folderName || 'پوشه';
    }

    // Create activity log entry
    const activityLog = await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: action.toUpperCase(),
        resourceType: resourceType as any,
        resourceId,
        resourceName,
        description: details?.action || action,
        metadata: JSON.stringify(details),
      },
    });

    return NextResponse.json(activityLog);
  } catch (error) {
    console.error('Error creating activity log:', error);
    return NextResponse.json(
      { error: 'Failed to create activity log' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const actionFilter = searchParams.get('action') || '';

    // Build where clause
    const where: any = {};
    if (projectId) {
      where.resourceId = projectId;
      where.resourceType = 'PROJECT';
    }
    if (search) {
      where.OR = [
        { resourceName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { metadata: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (actionFilter) {
      where.action = actionFilter.toUpperCase();
    }

    // Get activity logs with user information
    const activityLogs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.activityLog.count({ where });

    // Get project names for activities
    const projectIds = [...new Set(activityLogs
      .filter(log => log.resourceType === 'PROJECT' || log.metadata?.includes('projectId'))
      .map(log => {
        try {
          const metadata = JSON.parse(log.metadata || '{}');
          return metadata.projectId;
        } catch {
          return log.resourceType === 'PROJECT' ? log.resourceId : null;
        }
      })
      .filter(Boolean)
    )];
    
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true }
    });

    // Map project names to activities
    const activitiesWithProjectNames = activityLogs.map(activity => {
      let projectName = 'پروژه نامشخص';
      let folderName = null;
      let documentName = null;
      
      if (activity.resourceType === 'PROJECT') {
        projectName = projects.find(p => p.id === activity.resourceId)?.name || 'پروژه نامشخص';
      } else {
        try {
          const metadata = JSON.parse(activity.metadata || '{}');
          if (metadata.projectId) {
            projectName = projects.find(p => p.id === metadata.projectId)?.name || 'پروژه نامشخص';
          }
          if (metadata.folderName) {
            folderName = metadata.folderName;
          }
          if (metadata.documentName) {
            documentName = metadata.documentName;
          }
        } catch {
          // Keep default project name
        }
      }

      return {
        id: activity.id,
        type: activity.resourceType.toLowerCase(),
        action: activity.action.toLowerCase(),
        userId: activity.userId,
        userName: activity.user.firstName && activity.user.lastName 
          ? `${activity.user.firstName} ${activity.user.lastName}`
          : activity.user.username,
        projectId: activity.resourceType === 'PROJECT' ? activity.resourceId : 
          (() => {
            try {
              const metadata = JSON.parse(activity.metadata || '{}');
              return metadata.projectId;
            } catch {
              return null;
            }
          })(),
        projectName,
        documentId: activity.resourceType === 'DOCUMENT' ? activity.resourceId : null,
        documentName: activity.resourceType === 'DOCUMENT' ? activity.resourceName : documentName,
        folderName,
        details: activity.description,
        metadata: activity.metadata,
        timestamp: activity.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      activities: activitiesWithProjectNames,
      totalCount,
      hasMore: offset + limit < totalCount,
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: `Failed to fetch activity logs: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get current user from session/cookie
    const authToken = request.cookies.get('authToken')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user info
    const currentUser = await getCurrentUser(authToken);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    // Delete all activity logs
    const result = await prisma.activityLog.deleteMany({});

    return NextResponse.json({
      message: 'All activities deleted successfully',
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error deleting activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to delete activity logs' },
      { status: 500 }
    );
  }
}

// Helper function to get current user (implement based on your auth system)
async function getCurrentUser(authToken: string) {
  try {
    // For now, return a default user for testing
    // You should implement proper authentication based on your system
    const defaultUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true
      }
    });
    
    return defaultUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
