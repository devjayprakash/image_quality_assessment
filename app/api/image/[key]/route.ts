import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function GET(request: Request) {
  try {
    const key = request.url.split('/').pop();
    if (!key) {
      return Response.json({ error: "Image key is required" }, { status: 400 });
    }

    const decodedKey = decodeURIComponent(key);
    console.log("Received image key:", decodedKey);
    console.log("AWS Bucket:", process.env.AWS_BUCKET_NAME);
    console.log("AWS Region:", process.env.AWS_REGION);

    // Remove any leading slashes and ensure the key starts with eval_14/
    const cleanKey = decodedKey.replace(/^\/+/, '');
    const finalKey = cleanKey.startsWith('eval_14/') ? cleanKey : `eval_14/${cleanKey}`;
    console.log("Using S3 key:", finalKey);

    if (!process.env.AWS_BUCKET_NAME) {
      console.error("AWS_BUCKET_NAME is not configured");
      return Response.json({ error: "AWS configuration error" }, { status: 500 });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: finalKey,
    });

    console.log("S3 Command:", {
      bucket: command.input.Bucket,
      key: command.input.Key,
    });

    try {
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      console.log("Generated signed URL:", signedUrl);
      return Response.json({ url: signedUrl });
    } catch (s3Error) {
      console.error("S3 Error:", s3Error);
      return Response.json({ error: "Failed to generate signed URL" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in image route:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 