"use client";

import { useState, useEffect } from "react";
import { BlogPost } from "@prisma/client";
import { LinkReviewPanel } from "./LinkReviewPanel";

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

export function SemanticLinksViewer() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [links, setLinks] = useState<SemanticLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (selectedPost) {
      fetchLinksForPost(selectedPost.id);
    }
  }, [selectedPost]);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/blogs/list");
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts);
        if (data.posts.length > 0 && !selectedPost) {
          setSelectedPost(data.posts[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
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

  const handleLinkUpdate = async (linkId: string, status: string) => {
    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        // Refresh links
        if (selectedPost) {
          fetchLinksForPost(selectedPost.id);
        }
      }
    } catch (error) {
      console.error("Error updating link:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-12rem)]">
      {/* Blog List Sidebar */}
      <div className="w-64 bg-white border-r overflow-y-auto">
        <div className="p-3 border-b">
          <h3 className="font-medium text-gray-700">Blog Posts</h3>
        </div>
        <ul className="py-2">
          {posts.map((post) => (
            <li key={post.id}>
              <button
                onClick={() => setSelectedPost(post)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors ${
                  selectedPost?.id === post.id ? "bg-blue-50 text-blue-700" : "text-gray-700"
                }`}
              >
                <div className="text-sm font-medium truncate">{post.name}</div>
                {post.date && (
                  <div className="text-xs text-gray-500">
                    {new Date(post.date).toLocaleDateString()}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Link Review Panel */}
      {selectedPost && (
        <LinkReviewPanel
          post={selectedPost}
          links={links}
          onLinkUpdate={handleLinkUpdate}
        />
      )}
    </div>
  );
}