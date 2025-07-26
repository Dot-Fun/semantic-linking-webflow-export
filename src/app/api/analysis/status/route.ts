import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get job statistics
    const [total, queued, processing, completed, failed] = await Promise.all([
      prisma.analysisJob.count(),
      prisma.analysisJob.count({ where: { status: "queued" } }),
      prisma.analysisJob.count({ where: { status: "processing" } }),
      prisma.analysisJob.count({ where: { status: "completed" } }),
      prisma.analysisJob.count({ where: { status: "failed" } })
    ]);

    // Calculate overall progress
    const progress = total > 0 ? (completed / total) * 100 : 0;

    // Get recent jobs for details
    const recentJobs = await prisma.analysisJob.findMany({
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: {
        post: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      status: {
        total,
        queued,
        processing,
        completed,
        failed,
        progress
      },
      recentJobs
    });
  } catch (error) {
    console.error("Error getting analysis status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get analysis status" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}