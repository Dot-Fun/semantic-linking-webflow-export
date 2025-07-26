import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { initializeJobProcessor } from "@/lib/job-processor";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Get all blog posts
    const posts = await prisma.blogPost.findMany({
      select: { id: true }
    });

    // Clear any existing jobs and links (for fresh analysis)
    await prisma.analysisJob.deleteMany();
    await prisma.semanticLink.deleteMany();

    // Create analysis jobs for each post
    const jobs = await Promise.all(
      posts.map(post =>
        prisma.analysisJob.create({
          data: {
            postId: post.id,
            status: "queued",
            progress: 0
          }
        })
      )
    );

    // Start job processing in background
    const queue = initializeJobProcessor();
    if (!queue.isRunning()) {
      // Start processing jobs asynchronously
      queue.start().catch(error => {
        console.error("Queue processing error:", error);
      });
    }

    return NextResponse.json({
      success: true,
      message: `Created ${jobs.length} analysis jobs and started processing`,
      jobCount: jobs.length
    });
  } catch (error) {
    console.error("Error starting analysis:", error);
    return NextResponse.json(
      { success: false, error: "Failed to start analysis" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}