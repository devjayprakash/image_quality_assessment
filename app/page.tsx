"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Loader2, SplitSquareHorizontal } from "lucide-react";
import Image from "next/image";

export default function ScoringPage() {
  const router = useRouter();
  const [score, setScore] = useState(50);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | undefined>();
  const [currentImageId, setCurrentImageId] = useState<number | undefined>();
  const [progress, setProgress] = useState<{
    total: number;
    remaining: number;
    completed: number;
    currentImageBatchNumber: number;
    totalBatches: number;
    totalProgress: {
      total: number;
      completed: number;
      percentage: number;
    };
  }>({
    total: 0,
    remaining: 0,
    completed: 0,
    currentImageBatchNumber: 0,
    totalBatches: 0,
    totalProgress: {
      total: 0,
      completed: 0,
      percentage: 0
    }
  });
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [nextImageData, setNextImageData] = useState<{
    url: string;
    referenceImageUrl: string;
    id: number;
  } | null>(null);
  const [isLastImage, setIsLastImage] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/info");
      return;
    }
    fetchCurrentImage();
  }, [router, fetchCurrentImage]);

  const prefetchNextImage = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/image/current", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setIsLastImage(true);
          return;
        }
        return;
      }

      const data = await response.json();
      setNextImageData({
        url: data.url,
        referenceImageUrl: data.referenceImage.url,
        id: data.id,
      });
    } catch (error) {
      console.error("Error prefetching next image:", error);
    }
  };

  const fetchCurrentImage = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/info");
        return;
      }

      console.log("Fetching with token:", token);
      const response = await fetch("/api/image/current", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Authentication failed, redirecting to info page");
          router.push("/info");
          return;
        }
        if (response.status === 404) {
          router.push("/thank-you");
          return;
        }
        const errorData = await response.json();
        console.error("Failed to fetch image:", errorData);
        toast.error(errorData.error || "Failed to fetch image");
        return;
      }

      const data = await response.json();
      console.log("Received image data:", data);
      setImageUrl(data.url);
      setReferenceImageUrl(data.referenceImage.url);
      setCurrentImageId(data.id);
      setProgress({
        total: data.totalImagesInBatch,
        remaining: data.remainingImages,
        completed: data.totalImagesInBatch - data.remainingImages,
        currentImageBatchNumber: data.currentImageBatchNumber,
        totalBatches: data.totalBatches,
        totalProgress: data.totalProgress
      });

      // Prefetch next image after setting current image
      if (!isLastImage) {
        prefetchNextImage();
      }
    } catch (error) {
      console.error("Error fetching image:", error);
      toast.error("Failed to fetch image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/info");
        return;
      }

      if (!currentImageId) {
        console.error("No current image ID available");
        toast.error("Failed to submit score: No image selected");
        return;
      }

      console.log("Submitting score for image:", currentImageId);
      const response = await fetch("/api/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageId: currentImageId,
          score: score,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Authentication failed, redirecting to info page");
          router.push("/info");
          return;
        }
        console.error("Failed to submit score:", data);
        toast.error(data.error || "Failed to submit score");
        return;
      }

      if (data.success) {
        toast.success("Score submitted successfully");
        setScore(50);
        
        // If we have prefetched data, use it
        if (nextImageData) {
          setImageUrl(nextImageData.url);
          setReferenceImageUrl(nextImageData.referenceImageUrl);
          setCurrentImageId(nextImageData.id);
          setNextImageData(null);
          fetchCurrentImage(); // This will update progress and prefetch next image
        } else {
          // If no prefetched data, fetch normally
          fetchCurrentImage();
        }
      } else {
        console.error("Unexpected response:", data);
        toast.error("Failed to submit score");
      }
    } catch (err) {
      console.error("Error submitting score:", err);
      toast.error("Failed to submit score");
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!imageContainerRef.current) return;
    setIsDragging(true);
    const rect = imageContainerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, percentage)));
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, percentage)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    // Add touch event listeners to document
    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  if (!imageUrl || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-foreground space-y-4">
          <div className="flex justify-center">
            <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
          </div>
          <p className="text-lg">Loading image...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <Card className="max-w-4xl mx-auto">
        <div className="p-6 border-b">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-foreground">Image Scoring</h1>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Current Image Batch</p>
                <p className="text-foreground font-medium">
                  {progress.total > 0 ? 
                    `${progress.completed}/${progress.total} images` :
                    "Loading..."
                  }
                </p>
              </div>
            </div>
            
            {/* Overall Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{progress.totalProgress.percentage}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress.totalProgress.percentage}%` }}
                />
              </div>
            </div>

            {/* Batch Information */}
            <div className="text-sm text-muted-foreground">
              Image Batch {progress.currentImageBatchNumber} of {progress.totalBatches} • 
              Overall: {progress.totalProgress.completed} of {progress.totalProgress.total} images
            </div>
          </div>
        </div>

        <div 
          ref={imageContainerRef}
          className="relative aspect-video bg-black cursor-col-resize select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          style={{ touchAction: 'none' }}
        >
          {/* Modified image */}
          <Image
            src={imageUrl}
            alt="Image to score"
            className="absolute top-0 left-0 w-full h-full object-contain"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          />

          {/* Original reference image with clip path */}
          <Image
            src={referenceImageUrl}
            alt="Reference image"
            className="absolute top-0 left-0 w-full h-full object-contain"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
          />

          {/* Slider line */}
          <div 
            className="absolute inset-y-0 w-0.5 bg-white cursor-col-resize select-none"
            style={{ 
              left: `${sliderPosition}%`,
              boxShadow: '0 0 4px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
              userSelect: 'none',
              touchAction: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          />

          {/* Slider handle */}
          <div 
            className="absolute w-8 h-8 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 cursor-col-resize select-none"
            style={{ 
              left: `${sliderPosition}%`,
              top: '50%',
              boxShadow: '0 0 4px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
              userSelect: 'none',
              touchAction: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            <SplitSquareHorizontal className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black" />
          </div>
        </div>
            
        <div className="p-6 space-y-6">
          {/* Scoring controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground">
                  Score
                </label>
                <span className="text-sm font-medium text-foreground">
                  {score}
                </span>
              </div>
              <Slider
                value={[score]}
                onValueChange={([value]) => setScore(value)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Submit & Continue
          </Button>
        </div>
      </Card>
    </div>
  );
}
