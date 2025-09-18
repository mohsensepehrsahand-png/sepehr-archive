import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../_lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const description = await prisma.commonDescription.update({
      where: { id: id },
      data: { text: text }
    });

    return NextResponse.json(description);
  } catch (error) {
    console.error('Error updating common description:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.commonDescription.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: 'Description deleted successfully' });
  } catch (error) {
    console.error('Error deleting common description:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
