"use client";

import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { Loader2 } from "lucide-react";

type Image = {
  id: number;
  imageKey: string;
  image_batch_id: number | null;
};

type Batch = {
  id: number;
  imageBatches: Array<{
    images: Image[];
  }>;
};

type User = {
  id: number;
  session_id: string;
  batch_id: number;
};

type Result = {
  id: number;
  image_id: number;
  user_id: number;
  score: number;
};

type ApiResponses = {
  getUser: { user: User | null };
  getLastResult: { lastResult: Result | null };
  getImage: { image: Image | null };
  getAvailableBatches: { batches: Batch[] };
  createUser: { user: User };
  submitScore: { result: Result };
  getNextImage: { nextImage: Image | null };
};

export default function LabelingPage() {
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState<Image | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [score, setScore] = useState(50);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);

  const callApi = async <T extends keyof ApiResponses>(
    action: T,
    data: Record<string, unknown>
  ): Promise<ApiResponses[T]> => {
    const response = await fetch("/api/db", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, data }),
    });
    return response.json();
  };

  const fetchImageUrl = async (imageKey: string) => {
    try {
      console.log("Fetching image URL for key:", imageKey);
      
      // Ensure the key is properly formatted
      const cleanKey = imageKey.replace(/^\/+/, ''); // Remove leading slashes
      console.log("Cleaned key:", cleanKey);
      
      const encodedKey = encodeURIComponent(cleanKey);
      console.log("Encoded key:", encodedKey);
      
      const response = await fetch(`/api/image/${encodedKey}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch image URL:", response.status, errorText);
        throw new Error(`Failed to fetch image URL: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Received image URL:", data.url);
      
      if (!data.url) {
        throw new Error("No URL in response");
      }
      
      setImageUrl(data.url);
    } catch (error) {
      console.error("Error fetching image URL:", error);
      setImageUrl(null);
    }
  };

  useEffect(() => {
    if (currentImage?.imageKey) {
      console.log("Current image changed:", currentImage);
      console.log("Image key:", currentImage.imageKey);
      fetchImageUrl(currentImage.imageKey);
    }
  }, [currentImage]);

  useEffect(() => {
    const initializeSession = async () => {
      const token = window.localStorage.getItem("token");
      if (!token) {
        router.push("/info");
        return;
      }

      // Get or create session ID
      const sid = window.localStorage.getItem("sessionId") || nanoid();
      window.localStorage.setItem("sessionId", sid);

      try {
        // Check if user already has a batch assigned
        const userResponse = await callApi("getUser", { sessionId: sid });
        console.log("User response:", userResponse); // Debug log
        
        if (!userResponse) {
          throw new Error("No response from getUser API");
        }
        
        const user = userResponse.user; // Direct access to user property
        console.log("User data:", user); // Debug log

        if (user) {
          setUserId(user.id);
          // Load the last image from the user's progress
          const lastResultResponse = await callApi("getLastResult", { userId: user.id });
          console.log("Last result response:", lastResultResponse); // Debug log
          
          if (!lastResultResponse) {
            throw new Error("No response from getLastResult API");
          }
          
          const lastResult = lastResultResponse.lastResult;

          if (lastResult?.image_id) {
            const imageResponse = await callApi("getImage", { imageId: lastResult.image_id });
            console.log("Image response:", imageResponse); // Debug log
            
            if (!imageResponse) {
              throw new Error("No response from getImage API");
            }
            
            const image = imageResponse.image;
            if (image) {
              console.log("Setting current image:", image); // Debug log
              setCurrentImage(image);
            }
          }
        } else {
          // Assign a new batch to the user
          const batchesResponse = await callApi("getAvailableBatches", {});
          console.log("Batches response:", batchesResponse); // Debug log
          
          if (!batchesResponse) {
            throw new Error("No response from getAvailableBatches API");
          }
          
          const batches = batchesResponse.batches || [];

          // Find the batch with the least number of results
          const batchWithLeastResults = batches.length > 0 ? batches.reduce((min, batch) => {
            const totalImages = batch.imageBatches.reduce(
              (sum, ib) => sum + ib.images.length,
              0
            );
            return totalImages < min.totalImages ? { batch, totalImages } : min;
          }, { batch: null as Batch | null, totalImages: Infinity }) : { batch: null, totalImages: 0 };

          if (batchWithLeastResults.batch) {
            const newUserResponse = await callApi("createUser", {
              sessionId: sid,
              batchId: batchWithLeastResults.batch.id,
            });
            console.log("New user response:", newUserResponse); // Debug log
            
            if (!newUserResponse) {
              throw new Error("No response from createUser API");
            }
            
            const newUser = newUserResponse.user;
            if (newUser) {
              setUserId(newUser.id);
              setCurrentBatch(batchWithLeastResults.batch);

              // Set the first image
              const firstImage = batchWithLeastResults.batch.imageBatches[0]?.images[0];
              if (firstImage) {
                console.log("Setting first image:", firstImage); // Debug log
                setCurrentImage(firstImage);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error initializing session:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [router]);

  useEffect(() => {
    if (currentBatch) {
      const totalImages = currentBatch.imageBatches.reduce(
        (sum, ib) => sum + ib.images.length,
        0
      );
      setProgress(prev => ({ ...prev, total: totalImages }));
    }
  }, [currentBatch]);

  const handleScoreSubmit = async () => {
    if (!currentImage || !userId) return;

    setSubmitting(true);
    try {
      await callApi("submitScore", {
        imageId: currentImage.id,
        score,
        userId,
      });

      // Get the next image in the batch
      const nextImageResponse = await callApi("getNextImage", {
        imageBatchId: currentImage.image_batch_id,
        currentImageId: currentImage.id,
      });

      if (nextImageResponse.nextImage) {
        setCurrentImage(nextImageResponse.nextImage);
        setScore(50); // Reset score for next image
        setProgress(prev => ({ ...prev, current: prev.current + 1 }));
      } else {
        // No more images in the batch
        router.push("/complete");
      }
    } catch (error) {
      console.error("Error submitting score:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">Image Quality Assessment</h1>
            <p className="text-sm text-gray-500">Help us understand image quality by rating each image</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white rounded-lg shadow-sm px-4 py-2">
              <div className="text-sm text-gray-500">Progress</div>
              <div className="text-lg font-semibold text-gray-900">
                {progress.current}/{progress.total} images
              </div>
            </div>
            <div className="w-32">
              <Progress value={(progress.current / progress.total) * 100} className="h-2" />
            </div>
          </div>
        </div>

        <Card className="overflow-hidden border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-6">
              {currentImage && (
                <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden shadow-inner">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Image to score"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">Quality Score</div>
                  <div className="text-lg font-semibold text-gray-900">{score}</div>
                </div>
                <Slider
                  value={[score]}
                  onValueChange={(value) => setScore(value[0])}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>

              <Button
                onClick={handleScoreSubmit}
                disabled={submitting}
                className="w-full py-6 text-lg"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit & Continue"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 