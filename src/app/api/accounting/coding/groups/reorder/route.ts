import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/db';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, groups } = body;

    console.log('PUT /api/accounting/coding/groups/reorder - Request data:', {
      projectId,
      groups: groups?.map(g => ({ id: g.id, sortOrder: g.sortOrder, code: g.code }))
    });

    if (!projectId || !groups || !Array.isArray(groups)) {
      return NextResponse.json({ error: 'Project ID and groups array are required' }, { status: 400 });
    }

    // Use a transaction to ensure all updates succeed or fail together
    console.log('Starting groups reorder with transaction');
    
    await prisma.$transaction(async (tx) => {
      for (const group of groups) {
        console.log('Updating group:', { id: group.id, sortOrder: group.sortOrder, code: group.code });
        
        // Check if the new code conflicts with another group
        const conflictingGroup = await tx.accountGroup.findFirst({
          where: {
            projectId,
            code: group.code,
            id: { not: group.id }
          }
        });
        
        if (conflictingGroup) {
          console.log('Code conflict detected, updating conflicting group first:', conflictingGroup);
          // Update the conflicting group to a temporary code first
          await tx.accountGroup.update({
            where: { id: conflictingGroup.id },
            data: { code: `temp_${conflictingGroup.id}` }
          });
        }
        
        await tx.accountGroup.update({
          where: { id: group.id },
          data: {
            sortOrder: group.sortOrder,
            code: group.code
          }
        });
      }
      
      // Clean up any temporary codes
      const tempGroups = await tx.accountGroup.findMany({
        where: {
          projectId,
          code: { startsWith: 'temp_' }
        }
      });
      
      for (const tempGroup of tempGroups) {
        // Find an available code for this group
        const existingCodes = await tx.accountGroup.findMany({
          where: { projectId },
          select: { code: true }
        });
        
        const usedCodes = new Set(existingCodes.map(g => g.code));
        let newCode = '1';
        while (usedCodes.has(newCode)) {
          newCode = String(parseInt(newCode) + 1);
        }
        
        await tx.accountGroup.update({
          where: { id: tempGroup.id },
          data: { code: newCode }
        });
      }
    });
    
    console.log('Groups reorder completed successfully');

    console.log('Groups reordered successfully');
    return NextResponse.json({ message: 'Groups reordered successfully' });
  } catch (error) {
    console.error('Error reordering groups:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
