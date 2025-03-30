"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const TEST_IMAGES = [
  {
    name: "Placeholder Image",
    url: "https://placehold.co/600x400?text=Test+Image"
  },
  {
    name: "Public S3 Bucket Sample",
    url: "https://images.unsplash.com/photo-1682687982107-14e566d2edc0"
  },
  {
    name: "CloudFront URL (Sample)",
    url: "https://d3dg1063dc54p9.cloudfront.net/sample.jpg"
  },
  {
    name: "Custom API Image",
    url: "/api/test-image"
  }
];

export default function TestPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadImage = async (url: string) => {
    setLoading(true);
    setError(false);
    
    try {
      if (url.startsWith('/api')) {
        const response = await fetch(url);
        const data = await response.json();
        setSelectedImage(data.url);
      } else {
        setSelectedImage(url);
      }
    } catch (err) {
      console.error("Error loading image:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Image Loading Test</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4 bg-card border-border">
            <h2 className="text-xl font-semibold text-foreground">Image Sources</h2>
            <div className="space-y-2">
              {TEST_IMAGES.map((image, index) => (
                <Button 
                  key={index}
                  onClick={() => loadImage(image.url)}
                  variant="outline"
                  className="w-full justify-start"
                >
                  {image.name}
                </Button>
              ))}
            </div>
          </Card>
          
          <Card className="p-6 space-y-4 bg-card border-border">
            <h2 className="text-xl font-semibold text-foreground">Test Result</h2>
            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-destructive">Error loading image</p>
              </div>
            ) : selectedImage ? (
              <div className="relative h-[300px] bg-black rounded-md overflow-hidden">
                <img 
                  src={selectedImage} 
                  alt="Test image" 
                  className="absolute inset-0 w-full h-full object-contain"
                  onError={() => setError(true)}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">Select an image source to test</p>
              </div>
            )}
            
            {selectedImage && !error && (
              <div className="text-sm text-muted-foreground break-all">
                <p className="font-medium">Image URL:</p>
                <p>{selectedImage}</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
} 