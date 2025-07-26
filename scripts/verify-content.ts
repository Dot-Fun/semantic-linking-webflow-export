import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// Using require for csv-parser as it doesn't have proper ESM exports
const csvParser = require("csv-parser");

async function verifyContent() {
  const csvPath = "/Users/alvinycheung/Desktop/Personal Projects/DotFun/Greendbridge/Greenbridge Internal/find-semantic-links/webflow-links/output/Xurrent - Blogs (27)-latest-100.csv";
  
  // Read first few posts from CSV
  const csvPosts: any[] = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csvParser())
      .on("data", (row: any) => {
        if (csvPosts.length < 10) {
          csvPosts.push({
            name: row["Name"],
            content: row["Content"]
          });
        }
      })
      .on("end", resolve)
      .on("error", reject);
  });

  console.log("Checking content match between CSV and database...\n");

  // Compare with database
  for (const csvPost of csvPosts) {
    const dbPost = await prisma.blogPost.findFirst({
      where: { name: csvPost.name },
      select: { name: true, content: true }
    });

    if (!dbPost) {
      console.log(`❌ Post "${csvPost.name}" not found in database`);
      continue;
    }

    const csvContent = csvPost.content || "";
    const dbContent = dbPost.content || "";

    console.log(`Post: "${csvPost.name}"`);
    console.log(`CSV content length: ${csvContent.length}`);
    console.log(`DB content length: ${dbContent.length}`);
    
    if (csvContent === dbContent) {
      console.log(`✅ Content matches exactly`);
    } else {
      console.log(`❌ Content does NOT match`);
      console.log(`CSV first 100 chars: ${csvContent.substring(0, 100)}`);
      console.log(`DB first 100 chars: ${dbContent.substring(0, 100)}`);
    }
    console.log("---");
  }

  await prisma.$disconnect();
}

verifyContent().catch(console.error);