"use client";

import React, { useEffect, useState, useRef } from "react";
import type { KeyboardEvent } from "react";
import { ChevronRight, ChevronDown, FileText } from "lucide-react";

interface BlogPost {
  id: number;
  name: string;
  slug: string;
  date: string | null;
  draft: boolean;
}

interface AnalysisStatus {
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  progress: number;
}

interface EnhancedBlogSidebarProps {
  currentPostId: number | null;
  onSelectPost: (index: number) => void;
  analysisStatus: AnalysisStatus | null;
  isAnalyzing: boolean;
}

export function EnhancedBlogSidebar({ 
  currentPostId, 
  onSelectPost, 
  analysisStatus,
  isAnalyzing 
}: EnhancedBlogSidebarProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    // Set focused index when currentPostId changes
    if (currentPostId !== null && posts.length > 0) {
      const index = posts.findIndex(post => post.id === currentPostId);
      if (index !== -1) {
        setFocusedIndex(index);
      }
    }
  }, [currentPostId, posts]);

  useEffect(() => {
    // Focus the element when focusedIndex changes
    if (focusedIndex !== null && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/blogs/list");
      const data = await response.json();
      setPosts(data.posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = Math.min(index + 1, posts.length - 1);
      setFocusedIndex(nextIndex);
      onSelectPost(nextIndex);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = Math.max(index - 1, 0);
      setFocusedIndex(prevIndex);
      onSelectPost(prevIndex);
    }
  };

  if (loading) {
    return (
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
        <div className="text-sm text-gray-500">Loading posts...</div>
      </div>
    );
  }

  return (
    <div
      className={`${
        isCollapsed ? "w-12" : "w-64"
      } bg-gray-50 border-r border-gray-200 transition-all duration-300 flex flex-col h-full`}
    >
      <div className="p-3 border-b border-gray-200">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronDown className="w-5 h-5" />
              <span className="font-medium">Blog Posts ({posts.length})</span>
            </>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Analysis Progress */}
          {analysisStatus && analysisStatus.total > 0 && (
            <div className="px-3 py-2 border-b border-gray-200 bg-gray-100">
              <div className="text-xs font-medium text-gray-700 mb-1">
                Analysis Progress
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2 mb-1">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analysisStatus.progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-600">
                {analysisStatus.completed} / {analysisStatus.total} completed
                {analysisStatus.processing > 0 && (
                  <span className="ml-2 text-blue-600">
                    ({analysisStatus.processing} processing)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Post List */}
          <div className="flex-1 overflow-y-auto">
            <ul className="py-2">
              {posts.map((post, index) => (
                <li key={post.id}>
                  <button
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    onClick={() => onSelectPost(index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                      currentPostId === post.id ? "bg-blue-50 text-blue-700" : "text-gray-700"
                    }`}
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">
                        {post.draft && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded mr-1">
                            Draft
                          </span>
                        )}
                        {post.name}
                      </div>
                      {post.date && (
                        <div className="text-xs text-gray-500">
                          {new Date(post.date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}