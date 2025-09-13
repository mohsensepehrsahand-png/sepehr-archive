import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json();
    
    // Revalidate the specific path
    if (path) {
      revalidatePath(path);
    } else {
      // Revalidate common paths
      revalidatePath('/finance');
      revalidatePath('/dashboard');
    }
    
    return NextResponse.json({
      message: "Cache cleared successfully",
      path: path || "all common paths"
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      { error: "خطا در پاک کردن cache" },
      { status: 500 }
    );
  }
}
