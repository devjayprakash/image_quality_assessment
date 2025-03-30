"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function ThankYouPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Thank You!</h1>
        <p className="text-muted-foreground">
          You have completed labeling all images in this batch. Thank you for your contribution!
        </p>
        <Button 
          onClick={() => router.push("/info")}
          className="w-full"
        >
          Start New Batch
        </Button>
      </Card>
    </div>
  );
} 