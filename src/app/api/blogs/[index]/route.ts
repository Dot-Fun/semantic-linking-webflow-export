import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ index: string }> }
) {
  try {
    const { index: indexStr } = await params;
    const index = parseInt(indexStr, 10);
    
    if (isNaN(index) || index < 0) {
      return NextResponse.json({ error: "Invalid index" }, { status: 400 });
    }

    const total = await prisma.blogPost.count();
    
    if (index >= total) {
      return NextResponse.json({ error: "Index out of range" }, { status: 404 });
    }

    const post = await prisma.blogPost.findFirst({
      skip: index,
      orderBy: { id: "asc" },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      post,
      total,
      currentIndex: index,
    });
  } catch (error) {
    console.error("Error getting blog post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}