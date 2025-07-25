# Semantic Linking Webflow Export

A Next.js application for viewing and browsing blog posts exported from Webflow. This tool allows you to import CSV data into a local SQLite database and browse through posts with a clean, paginated interface.

## Features

- 📊 CSV import from Webflow blog exports
- 💾 Local SQLite database storage
- 📱 Responsive blog viewer with sidebar navigation
- ⌨️ Keyboard navigation (arrow keys)
- 🔍 Collapsible sidebar with all posts
- 📝 Draft post indicators
- ⚡ Fast page-by-page browsing

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Dot-Fun/semantic-linking-webflow-export.git
cd semantic-linking-webflow-export/blog-viewer
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma migrate dev
```

4. Import your CSV data:
```bash
npm run import-csv
```

The import script expects the CSV file at: `../output/Xurrent - Blogs (27)-latest-100.csv`

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
blog-viewer/
├── src/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── components/   # React components
│   │   └── page.tsx      # Main page
│   └── lib/
│       ├── db.ts         # Prisma client
│       └── utils.ts      # Utility functions
├── prisma/
│   └── schema.prisma     # Database schema
├── scripts/
│   └── import-csv.ts     # CSV import script
└── database/
    └── blog.db           # SQLite database (generated)
```

## Usage

### Navigating Posts

- Use the **Previous/Next** buttons to browse posts
- Press **Arrow Left/Right** keys for keyboard navigation
- Click any post in the sidebar to jump directly to it
- Toggle the sidebar with the chevron button

### Importing New Data

To import a new CSV file:

1. Place your CSV file in the expected location
2. Run: `npm run import-csv`
3. The script will clear existing data and import the new posts

## API Endpoints

- `GET /api/blogs/count` - Get total post count
- `GET /api/blogs/[index]` - Get post by index (0-based)
- `GET /api/blogs/post/[id]` - Get post by ID
- `GET /api/blogs/list` - Get all posts (minimal data)

## Development

```bash
# Run development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## License

MIT