# Semantic Links System

## Overview

The Semantic Links System is fully integrated into the main blog viewer interface. It analyzes blog posts to identify and suggest contextual links between related content using Claude AI, with an intuitive tabbed interface for reviewing and approving these links.

## Features

- **Integrated Experience**: All functionality built into the main blog viewer at `/`
- **Parallel Analysis**: Analyzes all 100 blog posts simultaneously using 10 parallel workers
- **AI-Powered**: Uses Claude to identify high-quality semantic relationships
- **Progressive UI**: Tabs appear only after analysis is initiated
- **Tabbed Interface**: Switch between Content, Updated, Links From, and Links To views
- **Sidebar Progress**: Real-time analysis progress shown in the sidebar
- **Confidence Scoring**: Links are scored 0-100% with only 70%+ suggested
- **Bulk Operations**: Approve all high-confidence links with one click
- **CSV Export**: Export the entire database with approved links in Webflow format

## Getting Started

### 1. Set up Anthropic API Key

Edit the `.env` file and add your Anthropic API key:
```
ANTHROPIC_API_KEY="your-api-key-here"
```

### 2. Access the Blog Viewer

Navigate to: http://localhost:3001/

### 3. Start Analysis

Click "Analyze All Posts" button at the bottom of the interface. This will:
- Create 100 analysis jobs (one per blog post)
- Process them in parallel (10 at a time)
- Show real-time progress in the sidebar
- Automatically enable tabs when analysis begins

The analysis typically takes 3-5 minutes for 100 posts.

### 4. Progressive Interface

The interface adapts based on analysis state:

**Before Analysis:**
- Normal blog viewer with content display
- "Analyze All Posts" button at bottom

**During/After Analysis:**
- Progress indicator appears in sidebar
- Tabs appear above content: Content | Updated | Links From | Links To
- Link counts shown in tab labels
- Export CSV button appears in header

### 5. Review Links

Once analysis starts:

1. **Navigate posts** using the sidebar (with keyboard support)
2. **Switch tabs** to review different aspects:
   - **Content**: Original post content
   - **Updated**: Preview with approved links highlighted (green) and pending links (yellow)
   - **Links From**: Incoming links from other posts
   - **Links To**: Outgoing links to other posts

3. **For each link**, you can:
   - ✅ **Approve**: Add the link to the content
   - ❌ **Reject**: Dismiss the suggestion
   - 🔗 **View**: Open the linked post in a new tab

### 6. Bulk Operations

Use the action buttons at the bottom:
- **Approve All High Confidence**: Automatically approve links with 85%+ confidence
- **Re-analyze All**: Clear existing analysis and start fresh

### 7. Export to CSV

Once you've reviewed and approved links:
1. Click "Export CSV" in the top-right header
2. The system generates a Webflow-compatible CSV with:
   - All original fields preserved
   - Content field updated with approved links
   - Proper HTML formatting for Webflow

## Link Quality Criteria

The AI only suggests links that meet ALL of these criteria:

1. **Strong Semantic Relevance**: Direct topical connection
2. **User Value**: Reader would benefit from the link
3. **Natural Context**: Link fits naturally in the text
4. **Specific Connection**: Not just generic mentions
5. **Clear Intent**: Supports user's goal on the page
6. **No Existing Link**: Text isn't already linked
7. **Proper Length**: Link text is 2-4 words

## Visual Indicators

- 🟢 **Green highlight**: Approved link
- 🟡 **Yellow highlight**: Pending review
- 🔵 **Blue badge**: High confidence (85%+)
- 🟡 **Yellow badge**: Medium confidence (70-84%)

## API Endpoints

- `POST /api/analysis/start` - Start analysis of all posts
- `GET /api/analysis/status` - Check analysis progress
- `GET /api/links?postId=X` - Get links for a specific post
- `PATCH /api/links/:id` - Update link status
- `POST /api/links/bulk-update` - Bulk update multiple links
- `POST /api/export/csv` - Generate CSV export

## Troubleshooting

### Analysis is slow
- Ensure your Anthropic API key is valid
- Check the console for rate limiting errors
- The system processes 10 posts in parallel by default

### Links aren't showing
- Ensure analysis has completed
- Check that posts have content
- Verify links meet the 70% confidence threshold

### Export fails
- Ensure you have approved at least some links
- Check browser console for errors
- Verify database connection