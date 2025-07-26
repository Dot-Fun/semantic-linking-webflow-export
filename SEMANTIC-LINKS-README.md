# Semantic Links System

## Overview

The Semantic Links System analyzes blog posts to identify and suggest contextual links between related content. It uses Claude AI to analyze semantic relationships and provides an intuitive interface for reviewing and approving these links.

## Features

- **Parallel Analysis**: Analyzes all 100 blog posts simultaneously using 10 parallel workers
- **AI-Powered**: Uses Claude to identify high-quality semantic relationships
- **Split-Screen Review**: View original and updated content side-by-side
- **Bidirectional Links**: Manage both incoming and outgoing links
- **Confidence Scoring**: Links are scored 0-100% with only 70%+ suggested
- **Bulk Operations**: Approve all high-confidence links with one click
- **CSV Export**: Export the entire database with approved links in Webflow format

## Getting Started

### 1. Set up Anthropic API Key

Edit the `.env` file and add your Anthropic API key:
```
ANTHROPIC_API_KEY="your-api-key-here"
```

### 2. Access the Semantic Links Manager

Navigate to: http://localhost:3000/semantic-links

### 3. Start Analysis

Click "Analyze All Posts" to begin the semantic analysis. This will:
- Create 100 analysis jobs (one per blog post)
- Process them in parallel (10 at a time)
- Identify potential semantic links between posts

The analysis typically takes 3-5 minutes for 100 posts.

### 4. Review Links

Once analysis is complete:

1. **Select a post** from the left sidebar
2. **Review suggested links** using the tabs:
   - **Original**: View the original content
   - **Updated**: Preview content with approved links highlighted
   - **Links From**: Review incoming links from other posts
   - **Links To**: Review outgoing links to other posts

3. **For each link**, you can:
   - ✅ **Approve**: Add the link to the content
   - ❌ **Reject**: Dismiss the suggestion
   - 🔗 **View**: Open the linked post in a new tab

### 5. Bulk Approve High-Confidence Links

Click "Approve All High Confidence" to automatically approve all links with 85%+ confidence scores.

### 6. Export to CSV

Once you've reviewed and approved the desired links:
1. Click "Export CSV" in the top-right corner
2. The system will generate a Webflow-compatible CSV with:
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