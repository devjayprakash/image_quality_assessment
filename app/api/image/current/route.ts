import { NextResponse } from "next/server";
import { db } from "@/db";
import { imageTable, resultsTable, userTable, imageBatchTable } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import jwt from "jsonwebtoken";

// Initialize S3 client with explicit credentials
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true, // Use path-style URLs
});

async function getSignedImageUrl(imageKey: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME || "training-images-batch",
    Key: imageKey,
  });

  try {
    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
    return url;
  } catch (error) {
    console.error(`Failed to generate signed URL for ${imageKey}:`, error);
    throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function GET(req: Request) {
  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return NextResponse.json(
        { error: "Authentication required", details: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    // Extract and verify JWT token
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: number };
      const userId = decoded.userId;

      console.log("Fetching image for user:", userId);

      // Get the user's assigned batch
      const userSession = await db
        .select({
          batchId: userTable.batch_id,
        })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .limit(1)
        .execute()
        .then(rows => rows[0]);

      if (!userSession?.batchId) {
        console.error("No batch assigned to user:", userId);
        return NextResponse.json(
          { error: "No batch assigned", details: "User has no assigned batch" },
          { status: 404 }
        );
      }

      // Get an unlabeled image from any image batch within the user's assigned batch
      const currentImage = await db
        .select({
          id: imageTable.id,
          imageKey: imageTable.imageKey,
          image_batch_id: imageTable.image_batch_id,
          is_first_image: imageTable.is_first_image,
        })
        .from(imageTable)
        .innerJoin(
          imageBatchTable,
          eq(imageTable.image_batch_id, imageBatchTable.id)
        )
        .leftJoin(
          resultsTable,
          and(
            eq(resultsTable.image_id, imageTable.id),
            eq(resultsTable.user_id, userId)
          )
        )
        .where(
          and(
            eq(imageTable.is_first_image, false),
            eq(imageTable.deleted_from_s3, false),
            isNull(resultsTable.id),
            eq(imageBatchTable.batch_id, userSession.batchId)
          )
        )
        .limit(1)
        .execute()
        .then(rows => rows[0]);

      if (!currentImage) {
        return NextResponse.json(
          { error: "No more images to score" },
          { status: 404 }
        );
      }

      // Get the reference image (first image in the same image batch)
      const referenceImage = await db
        .select({
          id: imageTable.id,
          imageKey: imageTable.imageKey,
        })
        .from(imageTable)
        .where(
          and(
            eq(imageTable.image_batch_id, currentImage.image_batch_id || 0),
            eq(imageTable.is_first_image, true)
          )
        )
        .limit(1)
        .execute()
        .then(rows => rows[0]);

      if (!referenceImage) {
        console.error("Reference image not found for image batch:", currentImage.image_batch_id);
        return NextResponse.json(
          { error: "Reference image not found", details: "No reference image in image batch" },
          { status: 500 }
        );
      }

      // Get total images in the current image batch (excluding deleted)
      const totalImagesInBatch = await db
        .select({ count: sql<number>`count(*)` })
        .from(imageTable)
        .where(
          and(
            eq(imageTable.image_batch_id, currentImage.image_batch_id || 0),
            eq(imageTable.deleted_from_s3, false)
          )
        )
        .execute()
        .then(rows => Number(rows[0].count));

      // Get remaining images in the current image batch (excluding deleted)
      const remainingImages = await db
        .select({ count: sql<number>`count(*)` })
        .from(imageTable)
        .leftJoin(
          resultsTable,
          and(
            eq(resultsTable.image_id, imageTable.id),
            eq(resultsTable.user_id, userId)
          )
        )
        .where(
          and(
            eq(imageTable.image_batch_id, currentImage.image_batch_id || 0),
            eq(imageTable.deleted_from_s3, false),
            isNull(resultsTable.id)
          )
        )
        .execute()
        .then(rows => Number(rows[0].count));

      // Get total image batches in the user's assigned batch (excluding deleted)
      const totalImageBatches = await db
        .select({ count: sql<number>`count(distinct ${imageTable.image_batch_id})` })
        .from(imageTable)
        .innerJoin(
          imageBatchTable,
          eq(imageTable.image_batch_id, imageBatchTable.id)
        )
        .where(
          and(
            eq(imageBatchTable.batch_id, userSession.batchId),
            eq(imageTable.deleted_from_s3, false)
          )
        )
        .execute()
        .then(rows => Number(rows[0].count));

      // Get current image batch number within the user's assigned batch
      const currentImageBatchNumber = await db
        .select({ count: sql<number>`count(distinct ${imageTable.image_batch_id})` })
        .from(imageTable)
        .innerJoin(
          imageBatchTable,
          eq(imageTable.image_batch_id, imageBatchTable.id)
        )
        .where(
          and(
            eq(imageBatchTable.batch_id, userSession.batchId),
            sql`${imageTable.image_batch_id} <= ${currentImage.image_batch_id || 0}`
          )
        )
        .execute()
        .then(rows => Number(rows[0].count));

      // Get total progress across all image batches in the user's assigned batch (excluding deleted)
      const totalImages = await db
        .select({ count: sql<number>`count(*)` })
        .from(imageTable)
        .innerJoin(
          imageBatchTable,
          eq(imageTable.image_batch_id, imageBatchTable.id)
        )
        .where(
          and(
            eq(imageBatchTable.batch_id, userSession.batchId),
            eq(imageTable.is_first_image, false),
            eq(imageTable.deleted_from_s3, false)
          )
        )
        .execute()
        .then(rows => Number(rows[0].count));

      const totalCompleted = await db
        .select({ count: sql<number>`count(*)` })
        .from(resultsTable)
        .where(eq(resultsTable.user_id, userId))
        .execute()
        .then(rows => Number(rows[0].count));

      // Generate signed URLs
      const [imageUrl, referenceImageUrl] = await Promise.all([
        getSignedImageUrl(currentImage.imageKey),
        getSignedImageUrl(referenceImage.imageKey),
      ]);

      return NextResponse.json({
        id: currentImage.id,
        url: imageUrl,
        referenceImage: {
          id: referenceImage.id,
          url: referenceImageUrl,
        },
        totalImagesInBatch,
        remainingImages,
        currentImageBatchNumber,
        totalImageBatches,
        totalProgress: {
          total: totalImages,
          completed: totalCompleted,
          percentage: Math.round((totalCompleted / totalImages) * 100)
        }
      });
    } catch (error) {
      console.error("Invalid or expired token:", error);
      return NextResponse.json(
        { error: "Authentication failed", details: "Invalid or expired token" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch image", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 