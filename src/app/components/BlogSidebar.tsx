"use client";

import { useEffect, useState } from "react";
import { ChevronRight, ChevronDown, FileText } from "lucide-react";

interface BlogPost {
  id: number;
  name: string;
  slug: string;
  date: string | null;
  draft: boolean;
}

interface BlogSidebarProps {
  currentPostId: number | null;
  onSelectPost: (index: number) => void;
}

export function BlogSidebar({ currentPostId, onSelectPost }: BlogSidebarProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

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
        <div className="flex-1 overflow-y-auto">
          <ul className="py-2">
            {posts.map((post, index) => (
              <li key={post.id}>
                <button
                  onClick={() => onSelectPost(index)}
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
      )}
    </div>
  );
}