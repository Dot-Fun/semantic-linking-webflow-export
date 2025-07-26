import { PrismaClient, AnalysisJob } from "@prisma/client";
import { SemanticAnalyzer } from "./semantic-analyzer";
import { getJobQueue } from "./job-queue";

const prisma = new PrismaClient();

export async function processAnalysisJob(job: AnalysisJob): Promise<void> {
  const analyzer = new SemanticAnalyzer();
  
  try {
    // Get the source post
    const sourcePost = await prisma.blogPost.findUnique({
      where: { id: job.postId }
    });

    if (!sourcePost || !sourcePost.content) {
      throw new Error("Source post not found or has no content");
    }

    // Get all other posts to analyze against
    const targetPosts = await prisma.blogPost.findMany({
      where: {
        id: { not: job.postId },
        content: { not: null }
      }
    });

    const totalTargets = targetPosts.length;
    let processedTargets = 0;

    // Analyze against each target post
    for (const targetPost of targetPosts) {
      if (!targetPost.content) continue;

      try {
        // Check if link already exists
        const existingLink = await prisma.semanticLink.findFirst({
          where: {
            sourcePostId: sourcePost.id,
            targetPostId: targetPost.id
          }
        });

        if (!existingLink) {
          // Analyze semantic relationship
          const result = await analyzer.analyzeSemanticLink(
            sourcePost.content,
            targetPost.content,
            sourcePost.name,
            targetPost.name
          );

          if (result.shouldLink && result.confidence >= 70) {
            // Find exact position of link text
            const position = analyzer.findLinkPosition(
              sourcePost.content,
              result.linkText
            );

            if (position !== -1) {
              // Check if text is already linked
              const alreadyLinked = analyzer.isAlreadyLinked(
                sourcePost.content,
                position,
                result.linkText.length
              );

              if (!alreadyLinked) {
                // Create semantic link record
                await prisma.semanticLink.create({
                  data: {
                    sourcePostId: sourcePost.id,
                    targetPostId: targetPost.id,
                    linkText: result.linkText,
                    linkPosition: position,
                    altText: result.altText,
                    confidence: result.confidence,
                    reasoning: result.reasoning,
                    status: "pending"
                  }
                });
              }
            }
          }
        }

        processedTargets++;

        // Update job progress
        const progress = (processedTargets / totalTargets) * 100;
        await prisma.analysisJob.update({
          where: { id: job.id },
          data: { progress }
        });
      } catch (error) {
        console.error(
          `Error analyzing ${sourcePost.name} -> ${targetPost.name}:`,
          error
        );
        // Continue with next target
      }
    }

    // Mark job as completed
    await prisma.analysisJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        progress: 100,
        completedAt: new Date()
      }
    });
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    
    // Mark job as failed
    await prisma.analysisJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date()
      }
    });
    
    throw error;
  }
}

// Initialize the job queue with the processor
export function initializeJobProcessor() {
  const queue = getJobQueue();
  queue.setProcessor(processAnalysisJob);
  return queue;
}