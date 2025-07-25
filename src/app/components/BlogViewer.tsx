"use client";

import { useEffect, useState } from "react";
import { Navigation } from "./Navigation";
import { BlogSidebar } from "./BlogSidebar";

interface BlogPost {
  id: number;
  name: string;
  slug: string;
  authorName: string | null;
  date: string | null;
  content: string | null;
  description: string | null;
  readTime: string | null;
  categories: string | null;
  categoriesPlainText: string | null;
  featuredImage: string | null;
  metaDescription: string | null;
}

interface BlogViewerProps {
  initialIndex?: number;
}

export function BlogViewer({ initialIndex = 0 }: BlogViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPost(currentIndex);
  }, [currentIndex]);

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
    // Don't set loading to true if we already have a post (prevents flash)
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <BlogSidebar
        currentPostId={post?.id || null}
        onSelectPost={setCurrentIndex}
      />
      
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Navigation
            currentIndex={currentIndex}
            total={total}
            onPrevious={handlePrevious}
            onNext={handleNext}
            hasPrevious={currentIndex > 0}
            hasNext={currentIndex < total - 1}
          />

          <article className="bg-white rounded-lg shadow-sm p-8 mt-6">
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
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                )}
              </>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}