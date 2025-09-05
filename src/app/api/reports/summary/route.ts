import { NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";

export async function GET() {
  const projectsCount = await prisma.project.count();
  const documents = await prisma.document.findMany({ select: { sizeBytes: true, mimeType: true } });
  const totalSize = documents.reduce((acc, d) => acc + (d.sizeBytes ?? 0), 0);
  const typeBreakdown = documents.reduce<Record<string, number>>((acc, d) => {
    const key = d.mimeType.startsWith("image/") ? "image" : d.mimeType === "application/pdf" ? "pdf" : "other";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  return NextResponse.json({ projectsCount, totalSize, typeBreakdown });
}

