import { PrismaClient } from "@/generated/prisma";
import { NextRequest } from "next/server";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export async function getCurrentUser(request?: NextRequest) {
  try {
    // Get user data from cookies
    const userData = request?.cookies.get('userData')?.value;
    
    if (!userData) {
      return null;
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

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

