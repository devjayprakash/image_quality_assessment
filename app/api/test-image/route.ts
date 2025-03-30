import { NextResponse } from "next/server";

// Mock image data for testing
const mockImages = [
  {
    id: 1,
    imageKey: "sample1.jpg",
    url: "https://images.unsplash.com/photo-1682687982107-14e566d2edc0",
  },
  {
    id: 2,
    imageKey: "sample2.jpg",
    url: "https://images.unsplash.com/photo-1682687982183-c2937a37f4b0", 
  },
  {
    id: 3,
    imageKey: "sample3.jpg",
    url: "https://images.unsplash.com/photo-1686991100496-1a76afda7f1e",
  }
];

export async function GET() {
  return NextResponse.json(mockImages[0]);
} 