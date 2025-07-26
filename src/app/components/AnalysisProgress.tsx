"use client";

interface AnalysisStatus {
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  progress: number;
}

interface AnalysisProgressProps {
  status: AnalysisStatus;
}

export function AnalysisProgress({ status }: AnalysisProgressProps) {
  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-700">
            Analysis Progress
          </div>
          <div className="text-sm text-gray-600">
            {status.completed} / {status.total} posts analyzed
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${status.progress}%` }}
          ></div>
        </div>
        
        {/* Status details */}
        <div className="flex gap-6 mt-2 text-xs text-gray-600">
          <span>Queued: {status.queued}</span>
          <span className="text-blue-600">Processing: {status.processing}</span>
          <span className="text-green-600">Completed: {status.completed}</span>
          {status.failed > 0 && (
            <span className="text-red-600">Failed: {status.failed}</span>
          )}
        </div>
      </div>
    </div>
  );
}