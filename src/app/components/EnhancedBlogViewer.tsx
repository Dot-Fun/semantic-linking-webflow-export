"use client";

import { useEffect, useState } from "react";
import { Navigation } from "./Navigation";
import { EnhancedBlogSidebar } from "./EnhancedBlogSidebar";
import { BlogPost } from "@prisma/client";
import { Check, X, ExternalLink } from "lucide-react";

interface SemanticLink {
  id: string;
  sourcePostId: number;
  targetPostId: number;
  linkText: string;
  linkPosition: number;
  altText: string;
  confidence: number;
  status: string;
  reasoning: string;
  sourcePost: {
    id: number;
    name: string;
    slug: string;
  };
  targetPost: {
    id: number;
    name: string;
    slug: string;
  };
}

interface AnalysisStatus {
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  progress: number;
}

interface EnhancedBlogViewerProps {
  initialIndex?: number;
}

export function EnhancedBlogViewer({ initialIndex = 0 }: EnhancedBlogViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Semantic linking state
  const [links, setLinks] = useState<SemanticLink[]>([]);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "updated" | "from" | "to">("content");
  const [updatedContent, setUpdatedContent] = useState("");

  // Check if any analysis has been performed
  const hasAnalysis = analysisStatus && analysisStatus.total > 0;

  useEffect(() => {
    fetchPost(currentIndex);
    checkAnalysisStatus();
  }, [currentIndex]);

  useEffect(() => {
    if (post && hasAnalysis) {
      fetchLinksForPost(post.id);
    }
  }, [post, hasAnalysis]);

  useEffect(() => {
    // Apply approved links to content
    if (post && post.content) {
      applyLinksToContent();
    }
  }, [post, links]);

  useEffect(() => {
    // Poll for analysis status if analyzing
    if (isAnalyzing) {
      const interval = setInterval(checkAnalysisStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        handlePrevious();
      } else if (e.key === "ArrowRight" && currentIndex < total - 1) {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex, total]);

  const fetchPost = async (index: number) => {
    if (!post) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(`/api/blogs/${index}`);
      if (!response.ok) {
        throw new Error("Failed to fetch post");
      }

      const data = await response.json();
      setPost(data.post);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const checkAnalysisStatus = async () => {
    try {
      const response = await fetch("/api/analysis/status");
      const data = await response.json();
      
      if (data.success) {
        setAnalysisStatus(data.status);
        const inProgress = data.status.processing > 0 || data.status.queued > 0;
        setIsAnalyzing(inProgress);
      }
    } catch (error) {
      console.error("Error checking analysis status:", error);
    }
  };

  const fetchLinksForPost = async (postId: number) => {
    try {
      const response = await fetch(`/api/links?postId=${postId}`);
      const data = await response.json();
      
      if (data.success) {
        setLinks(data.links);
      }
    } catch (error) {
      console.error("Error fetching links:", error);
    }
  };

  const applyLinksToContent = () => {
    if (!post?.content) return;

    let content = post.content;
    const approvedLinks = links.filter(l => l.sourcePostId === post.id && l.status === "approved");
    
    // Sort by position descending to avoid position shifts
    approvedLinks.sort((a, b) => b.linkPosition - a.linkPosition);
    
    for (const link of approvedLinks) {
      const before = content.substring(0, link.linkPosition);
      const linkTextInContent = content.substring(
        link.linkPosition,
        link.linkPosition + link.linkText.length
      );
      const after = content.substring(link.linkPosition + link.linkText.length);
      
      if (linkTextInContent.toLowerCase() === link.linkText.toLowerCase()) {
        const linkedText = `<a href="/blog/${link.targetPost.slug}" class="text-blue-600 underline" title="${link.altText}">${linkTextInContent}</a>`;
        content = before + linkedText + after;
      }
    }
    
    setUpdatedContent(content);
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

  const handleLinkUpdate = async (linkId: string, status: string) => {
    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      
      if (response.ok && post) {
        fetchLinksForPost(post.id);
      }
    } catch (error) {
      console.error("Error updating link:", error);
    }
  };

  const approveAllHighConfidence = async () => {
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
          if (post) fetchLinksForPost(post.id);
        }
      } else {
        alert("No high confidence links to approve");
      }
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

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Separate links by direction
  const linksFrom = links.filter(l => l.targetPostId === post?.id);
  const linksTo = links.filter(l => l.sourcePostId === post?.id);

  const renderContent = (content: string, showLinks: boolean) => {
    if (!showLinks || !hasAnalysis) {
      return <div dangerouslySetInnerHTML={{ __html: content }} className="prose max-w-none" />;
    }

    // Highlight pending and approved links
    let highlightedContent = content;
    const relevantLinks = linksTo.filter(l => l.status !== "rejected");
    
    // Sort by position descending
    relevantLinks.sort((a, b) => b.linkPosition - a.linkPosition);
    
    for (const link of relevantLinks) {
      const className = link.status === "approved" 
        ? "bg-green-200 border-b-2 border-green-500" 
        : "bg-yellow-200 border-b-2 border-yellow-500";
      
      const regex = new RegExp(`(${link.linkText})`, "gi");
      highlightedContent = highlightedContent.replace(regex, `<span class="${className}">$1</span>`);
    }
    
    return <div dangerouslySetInnerHTML={{ __html: highlightedContent }} className="prose max-w-none" />;
  };

  const LinkItem = ({ link, type }: { link: SemanticLink; type: "from" | "to" }) => {
    const isFrom = type === "from";
    const relatedPost = isFrom ? link.sourcePost : link.targetPost;
    
    return (
      <div className="border rounded-lg p-4 mb-3 bg-white">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm text-gray-900">
              {isFrom ? "From: " : "To: "}{relatedPost.name}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Link text: <span className="font-mono bg-gray-100 px-1">{link.linkText}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">{link.reasoning}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded ${
              link.confidence >= 85 ? "bg-blue-100 text-blue-700" :
              link.confidence >= 70 ? "bg-yellow-100 text-yellow-700" :
              "bg-gray-100 text-gray-700"
            }`}>
              {link.confidence}%
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => handleLinkUpdate(link.id, "approved")}
            disabled={link.status === "approved"}
            className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
              link.status === "approved"
                ? "bg-green-100 text-green-700 cursor-not-allowed"
                : "bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700"
            }`}
          >
            <Check className="w-4 h-4" />
            Approve
          </button>
          <button
            onClick={() => handleLinkUpdate(link.id, "rejected")}
            disabled={link.status === "rejected"}
            className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
              link.status === "rejected"
                ? "bg-red-100 text-red-700 cursor-not-allowed"
                : "bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700"
            }`}
          >
            <X className="w-4 h-4" />
            Reject
          </button>
          <a
            href={`/blog/${relatedPost.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1 rounded text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-full px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Blog Viewer</h1>
          {hasAnalysis && (
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
        <EnhancedBlogSidebar
          currentPostId={post?.id || null}
          onSelectPost={setCurrentIndex}
          analysisStatus={analysisStatus}
          isAnalyzing={isAnalyzing}
        />
        
        <div className="flex-1 flex flex-col">
          <div className="max-w-4xl w-full mx-auto px-4 py-6 flex-1">
            {/* Tabs - only show if analysis has been performed */}
            {hasAnalysis && post && (
              <div className="bg-white border-b mb-6">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("content")}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === "content"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Content
                  </button>
                  <button
                    onClick={() => setActiveTab("updated")}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === "updated"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Updated
                  </button>
                  <button
                    onClick={() => setActiveTab("from")}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === "from"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Links From ({linksFrom.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("to")}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === "to"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Links To ({linksTo.length})
                  </button>
                </div>
              </div>
            )}

            {/* Content Area */}
            <article className="bg-white rounded-lg shadow-sm p-8">
              {loading && !post ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-lg text-gray-500">Loading...</div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-red-500">Error: {error}</div>
                </div>
              ) : !post ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-gray-500">No post found</div>
                </div>
              ) : (
                <>
                  {(!hasAnalysis || activeTab === "content" || activeTab === "updated") && (
                    <>
                      <header className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.name}</h1>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {post.authorName && <span>By {post.authorName}</span>}
                          {post.date && (
                            <span>{new Date(post.date).toLocaleDateString()}</span>
                          )}
                          {post.readTime && <span>{post.readTime}</span>}
                        </div>
                        {post.categoriesPlainText && (
                          <div className="mt-4">
                            <div className="flex flex-wrap gap-2">
                              {post.categoriesPlainText.split(";").map((category, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                >
                                  {category.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </header>

                      {post.description && (
                        <div className="mb-8 text-lg text-gray-700 italic">
                          {post.description}
                        </div>
                      )}

                      {post.content && (
                        activeTab === "updated" 
                          ? renderContent(updatedContent || post.content, true)
                          : renderContent(post.content, false)
                      )}
                    </>
                  )}

                  {hasAnalysis && activeTab === "from" && (
                    <div>
                      {linksFrom.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No incoming links</p>
                      ) : (
                        linksFrom.map(link => <LinkItem key={link.id} link={link} type="from" />)
                      )}
                    </div>
                  )}

                  {hasAnalysis && activeTab === "to" && (
                    <div>
                      {linksTo.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No outgoing links</p>
                      ) : (
                        linksTo.map(link => <LinkItem key={link.id} link={link} type="to" />)
                      )}
                    </div>
                  )}
                </>
              )}
            </article>
          </div>

          {/* Action Bar */}
          <div className="bg-white border-t px-6 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex gap-3">
                {!hasAnalysis && (
                  <button
                    onClick={startAnalysis}
                    disabled={isAnalyzing}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Analyze All Posts
                  </button>
                )}
                {hasAnalysis && !isAnalyzing && (
                  <>
                    <button
                      onClick={approveAllHighConfidence}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Approve All High Confidence
                    </button>
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
                  </>
                )}
              </div>

              <Navigation
                currentIndex={currentIndex}
                total={total}
                onPrevious={handlePrevious}
                onNext={handleNext}
                hasPrevious={currentIndex > 0}
                hasNext={currentIndex < total - 1}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}