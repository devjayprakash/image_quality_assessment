"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createSession } from "./action";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";

export default function InfoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStartScoring = async () => {
    try {
      setLoading(true);
      console.log("Starting session creation...");
      const session = await createSession();
      console.log("Session creation response:", session);

      if (!session.result || !session.session_id) {
        console.error("Session creation failed:", session.msg);
        toast.error(session.msg || "Failed to create session");
        return;
      }

      // Store the JWT token directly without appending :test
      localStorage.setItem("token", session.session_id);
      console.log("Stored token:", session.session_id);

      // Redirect to scoring page
      console.log("Redirecting to scoring page...");
      router.push("/");
    } catch (error) {
      console.error("Error in handleStartScoring:", error);
      toast.error("Failed to start scoring session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle>Welcome to Image Scoring</CardTitle>
          <CardDescription>
            You will be shown pairs of images. Your task is to rate how similar the modified image is to the reference image.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Instructions:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Use the slider to compare the images</li>
                <li>Rate the similarity from 0 to 100</li>
                <li>Submit your rating and continue to the next pair</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleStartScoring} 
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              "Start Scoring"
            )}
          </Button>
        </CardFooter>
      </Card>
      <Toaster />
    </div>
  );
}
