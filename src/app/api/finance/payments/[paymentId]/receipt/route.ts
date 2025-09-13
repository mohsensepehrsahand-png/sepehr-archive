import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/api/_lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can upload receipt images
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const paymentId = params.paymentId;

    // Check if payment exists
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        userInstallment: {
          include: {
            user: true,
            unit: {
              include: {
                project: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json(
        { error: "پرداخت یافت نشد" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("receipt") as File;

    if (!file) {
      return NextResponse.json(
        { error: "فایل فیش پرداخت الزامی است" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "نوع فایل مجاز نیست. فقط تصاویر JPEG, PNG و GIF مجاز است" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "حجم فایل نباید بیشتر از 5 مگابایت باشد" },
        { status: 400 }
      );
    }

    // Create directory structure
    const projectId = payment.userInstallment.unit.project.id;
    const userId = payment.userInstallment.user.id;
    const uploadDir = join(process.cwd(), "uploads", "receipts", projectId, userId);
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `receipt_${paymentId}_${timestamp}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);
    const relativePath = `receipts/${projectId}/${userId}/${fileName}`;

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update payment with receipt image path
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: { receiptImagePath: relativePath },
      include: {
        userInstallment: {
          include: {
            user: true,
            unit: {
              include: {
                project: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      message: "تصویر فیش پرداخت با موفقیت آپلود شد",
      payment: {
        id: updatedPayment.id,
        receiptImagePath: updatedPayment.receiptImagePath
      }
    });

  } catch (error) {
    console.error("Error uploading receipt image:", error);
    return NextResponse.json(
      { error: "خطا در آپلود تصویر فیش پرداخت" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can delete receipt images
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const paymentId = params.paymentId;

    // Get payment with receipt image path
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { receiptImagePath: true }
    });

    if (!payment) {
      return NextResponse.json(
        { error: "پرداخت یافت نشد" },
        { status: 404 }
      );
    }

    // Remove receipt image path from database
    await prisma.payment.update({
      where: { id: paymentId },
      data: { receiptImagePath: null }
    });

    // TODO: Optionally delete the actual file from filesystem

    return NextResponse.json({
      message: "تصویر فیش پرداخت با موفقیت حذف شد"
    });

  } catch (error) {
    console.error("Error deleting receipt image:", error);
    return NextResponse.json(
      { error: "خطا در حذف تصویر فیش پرداخت" },
      { status: 500 }
    );
  }
}

