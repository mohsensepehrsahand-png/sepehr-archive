import { NextRequest, NextResponse } from "next/server";
import { deleteCookie } from "cookies-next";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: "خروج موفقیت‌آمیز" });
    
    // Clear authentication cookies
    deleteCookie("authToken", { path: "/" });
    deleteCookie("userRole", { path: "/" });
    deleteCookie("userData", { path: "/" });
    
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در خروج از سیستم" },
      { status: 500 }
    );
  }
}
