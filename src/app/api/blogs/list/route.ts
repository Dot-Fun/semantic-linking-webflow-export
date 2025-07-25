import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const posts = await prisma.blogPost.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        date: true,
        draft: true,
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error getting blog list:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}