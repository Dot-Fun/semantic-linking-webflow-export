import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { stringify } from "csv-stringify/sync";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Get all blog posts with approved links
    const posts = await prisma.blogPost.findMany({
      include: {
        linksTo: {
          where: { status: "approved" },
          include: {
            targetPost: {
              select: {
                slug: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    // Apply approved links to content
    const processedPosts = posts.map(post => {
      let updatedContent = post.content || "";
      
      // Sort links by position descending to avoid position shifts
      const approvedLinks = [...post.linksTo].sort((a, b) => b.linkPosition - a.linkPosition);
      
      for (const link of approvedLinks) {
        const before = updatedContent.substring(0, link.linkPosition);
        const linkTextInContent = updatedContent.substring(
          link.linkPosition,
          link.linkPosition + link.linkText.length
        );
        const after = updatedContent.substring(link.linkPosition + link.linkText.length);
        
        // Only apply if text matches
        if (linkTextInContent.toLowerCase() === link.linkText.toLowerCase()) {
          const linkedText = `<a href="/blog/${link.targetPost.slug}" title="${link.altText}">${linkTextInContent}</a>`;
          updatedContent = before + linkedText + after;
        }
      }
      
      // Return the post data in the original CSV format
      return {
        "Name": post.name,
        "Slug": post.slug,
        "Collection ID": post.collectionId,
        "Locale ID": post.localeId,
        "Item ID": post.itemId,
        "Archived": post.archived,
        "Draft": post.draft,
        "Created On": post.createdOn?.toISOString() || "",
        "Updated On": post.updatedOn?.toISOString() || "",
        "Published On": post.publishedOn?.toISOString() || "",
        "Meta Description": post.metaDescription || "",
        "Featured Image": post.featuredImage || "",
        "Date": post.date?.toISOString() || "",
        "Description": post.description || "",
        "Author Name": post.authorName || "",
        "Categories": post.categories || "",
        "Categories Plain Text": post.categoriesPlainText || "",
        "Featured Category": post.featuredCategory || "",
        "Content": updatedContent,
        "Is Featured?": post.isFeatured,
        "Highlighted Blog?": post.highlightedBlog,
        "Read Time": post.readTime || ""
      };
    });

    // Generate CSV
    const csv = stringify(processedPosts, {
      header: true,
      columns: [
        "Name",
        "Slug",
        "Collection ID",
        "Locale ID",
        "Item ID",
        "Archived",
        "Draft",
        "Created On",
        "Updated On",
        "Published On",
        "Meta Description",
        "Featured Image",
        "Date",
        "Description",
        "Author Name",
        "Categories",
        "Categories Plain Text",
        "Featured Category",
        "Content",
        "Is Featured?",
        "Highlighted Blog?",
        "Read Time"
      ]
    });

    // Return CSV as response
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="webflow-blog-export-${new Date().toISOString().split("T")[0]}.csv"`
      }
    });
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export CSV" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}