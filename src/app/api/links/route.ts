import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const status = searchParams.get("status");

    // Build where clause
    const where: any = {};
    if (postId) {
      where.OR = [
        { sourcePostId: parseInt(postId) },
        { targetPostId: parseInt(postId) }
      ];
    }
    if (status) {
      where.status = status;
    }

    const links = await prisma.semanticLink.findMany({
      where,
      include: {
        sourcePost: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        targetPost: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: [
        { confidence: "desc" },
        { createdAt: "desc" }
      ]
    });

    return NextResponse.json({
      success: true,
      links,
      count: links.length
    });
  } catch (error) {
    console.error("Error fetching links:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch links" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}