import { prisma } from "@/lib/prisma";

export interface ActivityLogData {
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  resourceType: 'PROJECT' | 'FOLDER' | 'DOCUMENT';
  resourceId: string;
  resourceName: string;
  description?: string;
  metadata?: any;
}

export async function logActivity(data: ActivityLogData) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        resourceName: data.resourceName,
        description: data.description,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null
      }
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error to avoid breaking the main operation
  }
}
