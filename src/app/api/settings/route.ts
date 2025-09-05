import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";

export async function GET() {
  try {
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

