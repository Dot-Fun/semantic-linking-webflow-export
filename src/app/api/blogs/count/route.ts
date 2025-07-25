import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const count = await prisma.blogPost.count();
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error getting blog count:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}