# Semantic Linking System - Product Requirements Document

## Executive Summary

A sophisticated web-based system for analyzing and managing semantic links between blog posts. The system analyzes content relationships, suggests contextual links between articles, and provides an intuitive interface for reviewing and approving these links before exporting them back to Webflow.

## Problem Statement

Currently, creating meaningful semantic links between blog posts is a manual, time-consuming process that:
- Requires reading and understanding all content
- Lacks consistency in link placement
- Misses valuable connection opportunities
- Provides no systematic way to review and approve links
- Has no efficient workflow for Webflow integration

## Solution Overview

### Core Features

1. **Parallel Content Analysis Engine**
   - Analyzes all 100 blog posts simultaneously
   - Identifies bidirectional semantic relationships
   - Suggests specific link placements with confidence scores
   - Uses AI to ensure high-quality, contextual links

2. **Link Review Dashboard**
   - Split-screen view showing original and updated content
   - Visual diff highlighting proposed changes
   - Batch approval/rejection capabilities
   - Link preview on hover

3. **Bidirectional Link Management**
   - "Links From" panel: Shows incoming links from other posts
   - "Links To" panel: Shows outgoing links to other posts
   - Individual approval controls for each direction
   - Relationship visualization

4. **Export System**
   - Export the existing database in Webflow CSV format
   - Update only the 'Content' field with approved links
   - Maintain all other fields unchanged
   - One-click download of the complete dataset

## User Stories

### As a Content Manager
- I want to analyze all blog posts for semantic links with one click
- I want to see exactly where links will be placed before approving
- I want to approve/reject links individually or in batches
- I want to export approved changes in a Webflow-ready format

### As a Content Reviewer
- I want to see the original and updated versions side-by-side
- I want to understand why each link was suggested
- I want to filter links by confidence score
- I want to track review progress

## Technical Architecture

### Frontend Stack
- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- React Query for data management
- Monaco Editor for syntax-highlighted content display

### Backend Architecture
- API Routes for processing endpoints
- Queue system for parallel job management
- WebSocket for real-time progress updates
- Prisma with PostgreSQL for data persistence

### AI Integration
- Claude API for semantic analysis
- Parallel processing with rate limiting
- Result caching for efficiency
- Retry mechanism for failed analyses

## User Interface Design

### Integrated Blog Viewer
The semantic linking system is fully integrated into the main blog viewer at the root URL (`/`). No separate pages or navigation required.

```
┌─────────────────────────────────────────────────────────────┐
│ Blog Viewer                                      [Export CSV]│
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────────────────────────────┐│
│ │ Blog Posts  │ │ Content Viewer                          ││
│ │             │ ├─────────────────────────────────────────┤│
│ │ ▼ Post 1 ●  │ │ Content │ Updated │ Links From │ To    ││
│ │   Post 2    │ ├─────────────────────────────────────────┤│
│ │   Post 3    │ │                                         ││
│ │   ...       │ │ [Dynamic content area with tabs]       ││
│ │             │ │                                         ││
│ │ ─────────   │ │                                         ││
│ │ Analysis:   │ │                                         ││
│ │ ████░░ 67%  │ │                                         ││
│ └─────────────┘ └─────────────────────────────────────────┘│
│                                                             │
│ [Analyze All Posts] [Approve All High Confidence] [← →]   │
└─────────────────────────────────────────────────────────────┘
```

### Key Integration Points
1. **Single URL**: Everything at `http://localhost:3001/` 
2. **Progressive UI**: Tabs appear only after analysis starts
3. **Seamless Experience**: No page navigation required
4. **Persistent State**: Analysis continues in background while browsing

### Link Review Interface
- **Original Content**: Clean view with existing links highlighted
- **Updated Content**: Shows proposed links in context with visual indicators
- **Links From Panel**: List of incoming links with approve/reject toggles
- **Links To Panel**: List of outgoing links with approve/reject toggles

### Visual Indicators
- 🟢 Approved link (green highlight)
- 🟡 Pending review (yellow highlight)
- 🔴 Rejected link (red strikethrough)
- 🔵 High confidence suggestion (blue badge)
- ⚪ Low confidence suggestion (gray badge)

## Data Models

### SemanticLink
```typescript
interface SemanticLink {
  id: string;
  sourcePostId: number;
  targetPostId: number;
  linkText: string;
  linkPosition: number;
  altText: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
  reasoning: string;
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}
```

### AnalysisJob
```typescript
interface AnalysisJob {
  id: string;
  postId: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}
```

### Export Format
The export will maintain the exact same CSV structure as the original Webflow export, with only the 'Content' field updated to include approved semantic links. All other fields (Name, Slug, Collection ID, Meta Description, etc.) remain unchanged.

## API Endpoints

### Analysis Endpoints
- `POST /api/analysis/start` - Initiate full analysis
- `GET /api/analysis/status` - Get current analysis progress
- `GET /api/analysis/job/:id` - Get specific job status

### Link Management
- `GET /api/links` - Get all semantic links
- `GET /api/links/post/:id` - Get links for specific post
- `PATCH /api/links/:id` - Update link status (approve/reject)
- `POST /api/links/bulk-update` - Batch update link statuses

### Content Endpoints
- `GET /api/posts/:id/preview` - Get post with applied links
- `GET /api/posts/:id/diff` - Get content diff

### Export Endpoints
- `POST /api/export/csv` - Generate CSV export
- `GET /api/export/preview` - Preview export data

## Processing Workflow

### Phase 1: Analysis Initialization
1. User clicks "Analyze All Posts"
2. System creates 100 analysis jobs
3. Jobs are queued for parallel processing
4. WebSocket connection established for progress updates

### Phase 2: Parallel Processing
1. Worker threads pick up jobs from queue
2. Each job analyzes one post against all others
3. AI evaluates semantic relationships
4. Results stored with confidence scores
5. Progress updates sent via WebSocket

### Phase 3: Review Process
1. User navigates through posts
2. Reviews suggested links in context
3. Approves/rejects individual links
4. System updates link statuses
5. Preview shows real-time changes

### Phase 4: Export Generation
1. User clicks "Export CSV"
2. System applies approved links to content field
3. Exports entire database in original Webflow CSV format
4. All fields preserved except updated content
5. Downloads complete CSV to user's computer

## Quality Criteria

### Link Quality
- Minimum 70% confidence threshold
- 2-4 word link text requirement
- No duplicate links on same page
- Contextually relevant placement
- Natural reading flow maintained

### Performance Requirements
- Complete analysis of 100 posts in < 5 minutes
- Real-time UI updates (< 100ms)
- Smooth scrolling in content viewer
- Instant link preview on hover

### User Experience
- One-click analysis initiation
- Clear progress indicators
- Intuitive approve/reject controls
- Keyboard shortcuts for efficiency
- Undo/redo functionality

## Implementation Approach

### Integration Strategy
1. **Enhance BlogViewer Component**
   - Add state management for semantic links
   - Integrate tabs into the content area
   - Handle analysis status and progress
   
2. **Upgrade BlogSidebar**
   - Add collapsible analysis progress section
   - Show real-time job status during analysis
   - Maintain existing navigation functionality

3. **Unified Action Bar**
   - Place main actions at bottom of interface
   - Include: Analyze All Posts, Approve High Confidence, Export CSV
   - Add Previous/Next navigation buttons

4. **Progressive Enhancement**
   - Default view shows normal blog content
   - After analysis starts, tabs appear
   - Links panel populated as analysis completes
   - Export only enabled when links approved

### Component Architecture
```
App (/)
├── BlogViewer (enhanced)
│   ├── BlogSidebar
│   │   ├── PostList
│   │   └── AnalysisProgress (when active)
│   ├── ContentArea
│   │   ├── ContentTab (default)
│   │   ├── UpdatedTab (with approved links)
│   │   ├── LinksFromTab
│   │   └── LinksToTab
│   └── ActionBar
│       ├── AnalyzeButton
│       ├── ApproveAllButton
│       ├── ExportButton
│       └── NavigationButtons
└── API Routes (existing)

## Success Metrics

### Efficiency Metrics
- Time to analyze 100 posts: < 5 minutes
- Time to review one post: < 30 seconds
- Links reviewed per hour: > 200

### Quality Metrics
- False positive rate: < 10%
- User satisfaction score: > 4.5/5
- Export success rate: > 99%

### Business Impact
- Content interconnectivity: +300%
- User engagement: +25%
- Page views per session: +40%
- Time on site: +15%

## Future Enhancements

### Version 2.0
- Link performance analytics
- A/B testing for link placements
- Custom link rules and filters
- Team collaboration features

### Version 3.0
- Multi-language support
- External site link suggestions
- SEO impact predictions
- Content gap analysis

## Technical Considerations

### Scalability
- Horizontal scaling for worker processes
- CDN for static assets
- Database connection pooling
- Redis for job queue management

### Security
- Authentication required for all operations
- Rate limiting on API endpoints
- Input sanitization for content
- Secure CSV generation

### Monitoring
- Error tracking with Sentry
- Performance monitoring
- Usage analytics
- Audit logging

## Conclusion

This semantic linking system transforms the manual, error-prone process of creating content connections into an efficient, AI-powered workflow. By combining intelligent analysis with intuitive review tools, content managers can create a richly interconnected content ecosystem that enhances user experience and drives engagement.