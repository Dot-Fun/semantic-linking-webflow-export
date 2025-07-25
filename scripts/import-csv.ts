import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const csvParser = require("csv-parser");
const prisma = new PrismaClient();

interface CsvRow {
  Name: string;
  Slug: string;
  "Collection ID": string;
  "Locale ID": string;
  "Item ID": string;
  Archived: string;
  Draft: string;
  "Created On": string;
  "Updated On": string;
  "Published On": string;
  "Meta Description": string;
  "Featured Image": string;
  Date: string;
  Description: string;
  "Author Name": string;
  Categories: string;
  "Categories Plain Text": string;
  "Featured Category": string;
  Content: string;
  "Is Featured?": string;
  "Highlighted Blog?": string;
  "Read Time": string;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === "") return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

function parseBoolean(value: string): boolean {
  return value?.toLowerCase() === "true";
}

async function importCsv() {
  const csvPath = path.join(process.cwd(), "../output/Xurrent - Blogs (27)-latest-100.csv");

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at: ${csvPath}`);
    process.exit(1);
  }

  console.log(`📄 Reading CSV from: ${csvPath}`);

  const rows: CsvRow[] = [];

  // Read and parse CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csvParser())
      .on("data", (data: CsvRow) => rows.push(data))
      .on("end", resolve)
      .on("error", reject);
  });

  console.log(`✅ Found ${rows.length} rows to import`);

  // Clear existing data
  console.log("🗑️  Clearing existing blog posts...");
  await prisma.blogPost.deleteMany();

  // Import each row
  let successCount = 0;
  let errorCount = 0;

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    try {
      await prisma.blogPost.create({
        data: {
          name: row.Name || "",
          slug: row.Slug || "",
          collectionId: row["Collection ID"] || "",
          localeId: row["Locale ID"] || "",
          itemId: row["Item ID"] || "",
          archived: parseBoolean(row.Archived),
          draft: parseBoolean(row.Draft),
          createdOn: parseDate(row["Created On"]),
          updatedOn: parseDate(row["Updated On"]),
          publishedOn: parseDate(row["Published On"]),
          metaDescription: row["Meta Description"] || null,
          featuredImage: row["Featured Image"] || null,
          date: parseDate(row.Date),
          description: row.Description || null,
          authorName: row["Author Name"] || null,
          categories: row.Categories || null,
          categoriesPlainText: row["Categories Plain Text"] || null,
          featuredCategory: row["Featured Category"] || null,
          content: row.Content || null,
          isFeatured: parseBoolean(row["Is Featured?"]),
          highlightedBlog: parseBoolean(row["Highlighted Blog?"]),
          readTime: row["Read Time"] || null,
        },
      });
      successCount++;
      process.stdout.write(`\r📝 Imported ${successCount}/${rows.length} posts`);
    } catch (error) {
      errorCount++;
      console.error(`\n❌ Error importing row ${index + 1}:`, error);
    }
  }

  console.log("\n\n✨ Import completed!");
  console.log(`✅ Successfully imported: ${successCount} posts`);
  console.log(`❌ Failed imports: ${errorCount}`);
}

importCsv()
  .catch((error) => {
    console.error("Fatal error during import:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });