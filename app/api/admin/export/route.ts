import { NextResponse } from "next/server";
import { db } from "@/db";
import { resultsTable } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Parser } from "json2csv";
import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";

export async function GET(req: Request) {
  try {
    // Check authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Basic ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

    const results = await db.query.resultsTable.findMany({
      orderBy: [desc(resultsTable.createdAt)],
      with: {
        image: {
          with: {
            imageBatch: {
              with: {
                batch: true,
              },
            },
          },
        },
        user: true,
      },
    });

    // Format results for export
    const formattedResults = results.map((result) => ({
      id: result.id,
      user_id: result.user_id,
      score: result.score,
      created_at: result.createdAt,
      image_key: result.image?.imageKey || "",
      batch_id: result.image?.imageBatch?.batch?.id || "",
      image_batch_id: result.image?.imageBatch?.id || "",
      class_name: result.image?.imageBatch?.class_name || "",
    }));

    switch (format) {
      case "csv": {
        const parser = new Parser();
        const csv = parser.parse(formattedResults);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=results.csv",
          },
        });
      }

      case "xlsx": {
        const worksheet = XLSX.utils.json_to_sheet(formattedResults);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": "attachment; filename=results.xlsx",
          },
        });
      }

      case "pdf": {
        const doc = new PDFDocument();
        const chunks: Buffer[] = [];

        return new Promise<Response>((resolve, reject) => {
          doc.on("data", (chunk) => chunks.push(chunk));
          
          doc.on("end", () => {
            const buffer = Buffer.concat(chunks);
            resolve(
              new NextResponse(buffer, {
                headers: {
                  "Content-Type": "application/pdf",
                  "Content-Disposition": "attachment; filename=results.pdf",
                },
              })
            );
          });

          // Handle potential errors
          doc.on("error", (err) => {
            reject(err);
          });

          // Write the PDF content
          doc.fontSize(16).text("Image Labeling Results", { align: "center" });
          doc.moveDown();

          formattedResults.forEach((result) => {
            doc.fontSize(12);
            doc.text(`Result ID: ${result.id}`);
            doc.text(`User ID: ${result.user_id}`);
            doc.text(`Score: ${result.score}`);
            doc.text(`Created At: ${new Date(result.created_at).toLocaleString()}`);
            doc.text(`Image Key: ${result.image_key}`);
            doc.text(`Batch ID: ${result.batch_id}`);
            doc.text(`Image Batch ID: ${result.image_batch_id}`);
            doc.text(`Class Name: ${result.class_name}`);
            doc.moveDown();
          });

          doc.end();
        }).catch((error) => {
          console.error("Error generating PDF:", error);
          return NextResponse.json(
            { error: "Failed to generate PDF" },
            { status: 500 }
          );
        });
      }

      case "json":
      default:
        return NextResponse.json(formattedResults, {
          headers: {
            "Content-Disposition": "attachment; filename=results.json",
          },
        });
    }
  } catch (error) {
    console.error("Error exporting results:", error);
    return NextResponse.json(
      { error: "Failed to export results" },
      { status: 500 }
    );
  }
} 