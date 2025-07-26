"use client";

import { useState, useEffect } from "react";
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

interface LinkReviewPanelProps {
  post: BlogPost;
  links: SemanticLink[];
  onLinkUpdate: (linkId: string, status: string) => void;
}

export function LinkReviewPanel({ post, links, onLinkUpdate }: LinkReviewPanelProps) {
  const [activeTab, setActiveTab] = useState<"original" | "updated" | "from" | "to">("original");
  const [updatedContent, setUpdatedContent] = useState("");

  // Separate links by direction
  const linksFrom = links.filter(l => l.targetPostId === post.id);
  const linksTo = links.filter(l => l.sourcePostId === post.id);

  useEffect(() => {
    // Apply approved links to content
    applyLinksToContent();
  }, [post, links]);

  const applyLinksToContent = () => {
    if (!post.content) return;

    let content = post.content;
    const approvedLinks = linksTo.filter(l => l.status === "approved");
    
    // Sort by position descending to avoid position shifts
    approvedLinks.sort((a, b) => b.linkPosition - a.linkPosition);
    
    for (const link of approvedLinks) {
      const before = content.substring(0, link.linkPosition);
      const linkTextInContent = content.substring(
        link.linkPosition,
        link.linkPosition + link.linkText.length
      );
      const after = content.substring(link.linkPosition + link.linkText.length);
      
      // Only apply if text matches
      if (linkTextInContent.toLowerCase() === link.linkText.toLowerCase()) {
        const linkedText = `<a href="/blog/${link.targetPost.slug}" class="text-blue-600 underline" title="${link.altText}">${linkTextInContent}</a>`;
        content = before + linkedText + after;
      }
    }
    
    setUpdatedContent(content);
  };

  const renderContent = (content: string, showLinks: boolean) => {
    if (!showLinks) {
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
            onClick={() => onLinkUpdate(link.id, "approved")}
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
            onClick={() => onLinkUpdate(link.id, "rejected")}
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
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <h2 className="text-xl font-bold text-gray-900">{post.name}</h2>
        <div className="text-sm text-gray-600 mt-1">
          {linksFrom.length} incoming links • {linksTo.length} outgoing links
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab("original")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "original"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Original
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "original" && (
          <div className="p-6 bg-white m-6 rounded-lg shadow-sm">
            {post.content ? renderContent(post.content, false) : (
              <p className="text-gray-500">No content available</p>
            )}
          </div>
        )}
        
        {activeTab === "updated" && (
          <div className="p-6 bg-white m-6 rounded-lg shadow-sm">
            {post.content ? renderContent(updatedContent || post.content, true) : (
              <p className="text-gray-500">No content available</p>
            )}
          </div>
        )}
        
        {activeTab === "from" && (
          <div className="p-6">
            {linksFrom.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No incoming links</p>
            ) : (
              linksFrom.map(link => <LinkItem key={link.id} link={link} type="from" />)
            )}
          </div>
        )}
        
        {activeTab === "to" && (
          <div className="p-6">
            {linksTo.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No outgoing links</p>
            ) : (
              linksTo.map(link => <LinkItem key={link.id} link={link} type="to" />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}