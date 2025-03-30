"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw } from "lucide-react";
import Cookies from "js-cookie";

type SyncProgress = {
  total: number;
  completed: number;
};

export default function SettingsPage() {
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const authCookie = Cookies.get("adminAuth");
      const response = await fetch("/api/admin/sync", {
        method: "POST",
        headers: {
          Authorization: `Basic ${authCookie}`,
        },
      });
      const reader = response.body?.getReader();
      
      if (!reader) throw new Error("No reader available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = new TextDecoder().decode(value);
        const data = JSON.parse(text);
        setSyncProgress(data);
      }
    } catch (error) {
      console.error("Error syncing data:", error);
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleExport = async (format: string) => {
    try {
      const authCookie = Cookies.get("adminAuth");
      const response = await fetch(`/api/admin/export?format=${format}`, {
        headers: {
          Authorization: `Basic ${authCookie}`,
        },
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Handle different response types
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `results.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `results.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>S3 Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Sync images and data from S3 bucket to the database.
              </p>
              
              <Button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center space-x-2"
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Sync from S3</span>
                  </>
                )}
              </Button>

              {syncProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">Sync Progress</div>
                    <div className="text-sm font-medium text-gray-900">
                      {syncProgress.completed}/{syncProgress.total}
                    </div>
                  </div>
                  <Progress
                    value={(syncProgress.completed / syncProgress.total) * 100}
                    className="h-2"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Export image labeling results in various formats.
              </p>
              
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => handleExport("csv")}>
                  Export CSV
                </Button>
                <Button variant="outline" onClick={() => handleExport("json")}>
                  Export JSON
                </Button>
                <Button variant="outline" onClick={() => handleExport("xlsx")}>
                  Export Excel
                </Button>
                <Button variant="outline" onClick={() => handleExport("pdf")}>
                  Export PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 