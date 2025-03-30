"use server";

import { db } from "@/db";
import { batchTable, imageBatchTable, imageTable } from "@/db/schema";
import { ListObjectsCommand, S3Client } from "@aws-sdk/client-s3";
import { eq, inArray, not } from "drizzle-orm";

const client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function* syncDataFromS3() {
  const filesInBucket = await client.send(
    new ListObjectsCommand({
      Bucket: process.env.AWS_BUCKET_NAME || "",
      Prefix: "Upload",
    })
  );


  const contents = filesInBucket.Contents?.filter(
    (image) =>
      image.Key?.endsWith(".jpg") ||
      image.Key?.endsWith(".jpeg") ||
      image.Key?.endsWith(".png")
  );

  // Get all image keys from S3, filtering out undefined values
  const s3ImageKeys = contents
    ?.map(content => content.Key)
    .filter((key): key is string => key !== undefined) || [];

  // Mark images as deleted if they're not in S3 anymore
  if (s3ImageKeys.length > 0) {
    await db
      .update(imageTable)
      .set({ deleted_from_s3: true })
      .where(not(inArray(imageTable.imageKey, s3ImageKeys)));
  }

  const batches: {
    [k: string]: [
      {
        class_name: string;
        images: Array<string>;
      }
    ];
  } = {};

  if (contents) {
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];
      if (content && content.Key) {
        const batch_id = content.Key.split("/")[1];
        const class_name = content.Key.split("/")[2]
          .split(".")[0]
          .split("_")[2][0];
        if (batches[batch_id] === undefined) {
          batches[batch_id] = [
            {
              class_name: class_name,
              images: [content.Key],
            },
          ];
        } else {
          if (
            batches[batch_id].findIndex(
              (item) => item.class_name === class_name
            ) === -1
          ) {
            batches[batch_id].push({
              class_name: class_name,
              images: [content.Key],
            });
          } else {
            const index = batches[batch_id].findIndex(
              (item) => item.class_name === class_name
            );
            batches[batch_id][index].images.push(content.Key);
          }
        }
      }
    }

    let count = 0;

    for (const key in batches) {
      count += 1;
      if (batches.hasOwnProperty(key)) {
        const batch = batches[key];
        
        // Check if any images from this batch already exist
        const existingImages = await db
          .select({ imageKey: imageTable.imageKey })
          .from(imageTable)
          .where(
            eq(imageTable.imageKey, batch[0].images[0])
          );

        // Skip this batch if we find any existing images
        if (existingImages.length > 0) {
          // Mark existing images as not deleted since they're still in S3
          await db
            .update(imageTable)
            .set({ deleted_from_s3: false })
            .where(inArray(imageTable.imageKey, batch[0].images));

          console.log(`Skipping batch ${key} - images already exist`);
          yield {
            total: Object.keys(batches).length,
            completed: count,
            skipped: true
          };
          continue;
        }

        const dbBatch = await db.insert(batchTable).values({}).returning();

        for (const key1 in batch) {
          const imageBatch = batch[key1];
          const dbImgBatch = await db
            .insert(imageBatchTable)
            .values({
              class_name: imageBatch.class_name,
              batch_id: dbBatch[0].id,
            })
            .returning();
          
          // Insert all images for this batch with deleted_from_s3 = false
          await db.insert(imageTable).values(
            imageBatch.images.map((image) => ({
              image_batch_id: dbImgBatch[0].id,
              is_first_image: image.split(".")[0].endsWith("0"),
              imageKey: image,
              deleted_from_s3: false
            }))
          );
        }

        yield {
          total: Object.keys(batches).length,
          completed: count,
          skipped: false
        };
      }
    }
  } else {
    console.log("No files found");
  }
}
