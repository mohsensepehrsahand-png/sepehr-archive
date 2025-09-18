import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../_lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const descriptions = await prisma.commonDescription.findMany({
      where: {
        projectId: projectId
      },
      orderBy: [
        { usageCount: 'desc' },
        { text: 'asc' }
      ]
    });

    return NextResponse.json(descriptions);
  } catch (error) {
    console.error('Error fetching common descriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, text } = body;

    if (!projectId || !text) {
      return NextResponse.json({ error: 'Project ID and text are required' }, { status: 400 });
    }

    // Check if description already exists
    const existing = await prisma.commonDescription.findFirst({
      where: {
        projectId: projectId,
        text: text
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'This description already exists' }, { status: 400 });
    }

    const description = await prisma.commonDescription.create({
      data: {
        projectId: projectId,
        text: text,
        usageCount: 0
      }
    });

    return NextResponse.json(description);
  } catch (error) {
    console.error('Error creating common description:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
