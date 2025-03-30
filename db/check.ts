import { db } from "./index";
import { config } from "dotenv";

config({ path: ".env" });

async function checkDatabase() {
  try {
    console.log("Checking database state...");

    // Check users
    const users = await db.query.userTable.findMany();
    console.log("\nUsers:", users.length);
    console.log(users);

    // Check batches
    const batches = await db.query.batchTable.findMany();
    console.log("\nBatches:", batches.length);
    console.log(batches);

    // Check image batches
    const imageBatches = await db.query.imageBatchTable.findMany();
    console.log("\nImage Batches:", imageBatches.length);
    console.log(imageBatches);

    // Check images
    const images = await db.query.imageTable.findMany();
    console.log("\nImages:", images.length);
    console.log(images);

    // Check results
    const results = await db.query.resultsTable.findMany();
    console.log("\nResults:", results.length);
    console.log(results);

  } catch (error) {
    console.error("Error checking database:", error);
  }
}

checkDatabase(); 