"use client";

import { useState, useEffect } from "react";
import { SemanticLinksViewer } from "@/app/components/SemanticLinksViewer";
import { AnalysisProgress } from "@/app/components/AnalysisProgress";

export default function SemanticLinksPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<any>(null);

  useEffect(() => {
    // Check analysis status on load
    checkAnalysisStatus();
    
    // Poll for status updates if analyzing
    if (isAnalyzing) {
      const interval = setInterval(checkAnalysisStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const checkAnalysisStatus = async () => {
    try {
      const response = await fetch("/api/analysis/status");
      const data = await response.json();
      
      if (data.success) {
        setAnalysisStatus(data.status);
        
        // Check if analysis is in progress
        const inProgress = data.status.processing > 0 || data.status.queued > 0;
        setIsAnalyzing(inProgress);
      }
    } catch (error) {
      console.error("Error checking analysis status:", error);
    }
  };

  const startAnalysis = async () => {
    if (isAnalyzing) return;

    const confirmed = confirm(
      "This will analyze all blog posts for semantic links. The process may take several minutes. Continue?"
    );
    
    if (!confirmed) return;

    try {
      setIsAnalyzing(true);
      const response = await fetch("/api/analysis/start", {
        method: "POST"
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`Started analyzing ${data.jobCount} blog posts`);
        checkAnalysisStatus();
      } else {
        alert("Failed to start analysis");
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error("Error starting analysis:", error);
      alert("Error starting analysis");
      setIsAnalyzing(false);
    }
  };

  const exportCSV = async () => {
    try {
      const response = await fetch("/api/export/csv", {
        method: "POST"
      });
      
      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Download the CSV
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `webflow-blog-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Failed to export CSV");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Semantic Link Analyzer</h1>
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Analysis Progress */}
      {analysisStatus && (
        <AnalysisProgress status={analysisStatus} />
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {!isAnalyzing && analysisStatus?.total === 0 && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              No analysis has been performed yet
            </h2>
            <button
              onClick={startAnalysis}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Analyze All Posts
            </button>
          </div>
        )}

        {(isAnalyzing || analysisStatus?.total > 0) && (
          <SemanticLinksViewer />
        )}
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-6 right-6 flex gap-3">
        {!isAnalyzing && analysisStatus?.total > 0 && (
          <>
            <button
              onClick={() => {
                if (confirm("This will clear all existing analysis and start fresh. Continue?")) {
                  startAnalysis();
                }
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Re-analyze All
            </button>
            <button
              onClick={async () => {
                // Approve all high confidence links
                const response = await fetch("/api/links?status=pending");
                const data = await response.json();
                
                if (data.success) {
                  const highConfidenceLinks = data.links
                    .filter((link: any) => link.confidence >= 85)
                    .map((link: any) => link.id);
                  
                  if (highConfidenceLinks.length > 0) {
                    const updateResponse = await fetch("/api/links/bulk-update", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        linkIds: highConfidenceLinks,
                        status: "approved"
                      })
                    });
                    
                    const updateData = await updateResponse.json();
                    if (updateData.success) {
                      alert(`Approved ${updateData.updatedCount} high confidence links`);
                      window.location.reload();
                    }
                  } else {
                    alert("No high confidence links to approve");
                  }
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Approve All High Confidence
            </button>
          </>
        )}
      </div>
    </div>
  );
}