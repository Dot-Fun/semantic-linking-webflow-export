import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { linkIds, status, reviewedBy } = body;

    // Validate inputs
    if (!Array.isArray(linkIds) || linkIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No link IDs provided" },
        { status: 400 }
      );
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    // Update all links
    const result = await prisma.semanticLink.updateMany({
      where: {
        id: { in: linkIds }
      },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: reviewedBy || "user"
      }
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      message: `Updated ${result.count} links to ${status}`
    });
  } catch (error) {
    console.error("Error bulk updating links:", error);
    return NextResponse.json(
      { success: false, error: "Failed to bulk update links" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}