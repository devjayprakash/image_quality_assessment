"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { CheckCircle2, Home, Heart } from "lucide-react";

export default function CompletePage() {
  const router = useRouter();

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="max-w-[800px] mx-auto">
        <Card className="bg-white shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-900">Thank You!</h1>
                <p className="text-gray-600 text-lg">
                  You have successfully completed all the images in your batch. Your contributions are valuable in helping us understand image quality and improve our dataset.
                </p>
                <div className="flex items-center justify-center space-x-2 text-gray-500">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span>Thank you for your valuable contribution!</span>
                </div>
                <p className="text-sm text-gray-500">
                  Your ratings will be used to analyze image quality patterns and enhance our understanding of visual content.
                </p>
              </div>

              <Button
                onClick={() => router.push("/")}
                className="w-full py-6 text-lg mt-4"
                size="lg"
              >
                <Home className="mr-2 h-5 w-5" />
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 