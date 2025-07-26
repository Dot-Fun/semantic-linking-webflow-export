import { PrismaClient, AnalysisJob } from "@prisma/client";
import { EventEmitter } from "events";

const prisma = new PrismaClient();

export interface JobProcessor {
  (job: AnalysisJob): Promise<void>;
}

export class JobQueue extends EventEmitter {
  private isProcessing = false;
  private workerCount: number;
  private activeWorkers = 0;
  private processor: JobProcessor | null = null;

  constructor(workerCount = 10) {
    super();
    this.workerCount = workerCount;
  }

  setProcessor(processor: JobProcessor) {
    this.processor = processor;
  }

  async start() {
    if (this.isProcessing) return;
    if (!this.processor) {
      throw new Error("No processor set for job queue");
    }

    this.isProcessing = true;
    this.emit("started");

    // Start worker loops
    const workers = Array(this.workerCount)
      .fill(null)
      .map((_, index) => this.workerLoop(index));

    await Promise.all(workers);
  }

  stop() {
    this.isProcessing = false;
    this.emit("stopped");
  }

  private async workerLoop(workerId: number) {
    while (this.isProcessing) {
      try {
        // Get next available job
        const job = await this.getNextJob();
        
        if (!job) {
          // No jobs available, wait a bit
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        this.activeWorkers++;
        this.emit("job:started", { workerId, job });

        // Process the job
        await this.processor!(job);

        this.activeWorkers--;
        this.emit("job:completed", { workerId, job });
      } catch (error) {
        this.activeWorkers--;
        console.error(`Worker ${workerId} error:`, error);
        this.emit("job:failed", { workerId, error });
      }
    }
  }

  private async getNextJob(): Promise<AnalysisJob | null> {
    try {
      // Get and lock the next queued job
      const job = await prisma.analysisJob.findFirst({
        where: { status: "queued" },
        orderBy: { createdAt: "asc" }
      });

      if (!job) return null;

      // Try to claim the job by updating its status
      const claimed = await prisma.analysisJob.update({
        where: { 
          id: job.id,
          status: "queued" // Ensure it's still queued
        },
        data: {
          status: "processing",
          startedAt: new Date()
        }
      });

      return claimed;
    } catch (error) {
      // Job was already claimed by another worker
      return null;
    }
  }

  getActiveWorkerCount() {
    return this.activeWorkers;
  }

  isRunning() {
    return this.isProcessing;
  }
}

// Singleton instance
let queueInstance: JobQueue | null = null;

export function getJobQueue(workerCount = 10): JobQueue {
  if (!queueInstance) {
    queueInstance = new JobQueue(workerCount);
  }
  return queueInstance;
}