"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw, Users, Image as ImageIcon, CheckCircle, LogOut } from "lucide-react";
import Cookies from "js-cookie";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DashboardStats = {
  totalUsers: number;
  totalImages: number;
  totalResults: number;
  activeSessions: number;
};

type SyncProgress = {
  total: number;
  completed: number;
};

type RecentResult = {
  id: string;
  userId: string;
  imageId: string;
  score: number;
  createdAt: string;
  imageKey: string;
};

type ActiveSession = {
  userId: string;
  lastActive: string;
  currentImageId: string;
  progress: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalImages: 0,
    totalResults: 0,
    activeSessions: 0,
  });
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const authCookie = Cookies.get("adminAuth");
    if (!authCookie) {
      router.push("/admin/login");
      return;
    }

    // Test authentication on page load
    fetch("/api/admin/auth", {
      headers: {
        Authorization: `Basic ${authCookie}`,
      },
    }).then((response) => {
      if (!response.ok) {
        Cookies.remove("adminAuth");
        router.push("/admin/login");
      }
    });

    // Initialize WebSocket connection
    const socket = new WebSocket(`ws://${window.location.host}/api/admin/ws`);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "activeSessions") {
        setActiveSessions(data.sessions);
      }
    };

    return () => {
      socket.close();
    };
  }, [router]);

  const fetchStats = async () => {
    try {
      const authCookie = Cookies.get("adminAuth");
      const response = await fetch("/api/admin/stats", {
        headers: {
          Authorization: `Basic ${authCookie}`,
        },
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = new TextDecoder().decode(value);
          const lines = text.split("\n").filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.error) {
                console.error("Sync error:", data.error);
                throw new Error(data.error);
              }
              setSyncProgress(data);
            } catch (e) {
              console.error("Error parsing sync progress:", e);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error("Error syncing data:", error);
    } finally {
      setSyncing(false);
      setSyncProgress(null);
      fetchStats();
    }
  };

  const handleLogout = () => {
    Cookies.remove("adminAuth");
    router.push("/admin/login");
  };

  const fetchRecentResults = async () => {
    try {
      const authCookie = Cookies.get("adminAuth");
      const response = await fetch("/api/admin/recent-results", {
        headers: {
          Authorization: `Basic ${authCookie}`,
        },
      });
      const data = await response.json();
      setRecentResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching recent results:", error);
      setRecentResults([]);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRecentResults();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
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
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Active Users</div>
                      <div className="text-2xl font-bold text-foreground">
                        {stats.activeSessions}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <ImageIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Images</div>
                      <div className="text-2xl font-bold text-foreground">
                        {stats.totalImages}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Results</div>
                      <div className="text-2xl font-bold text-foreground">
                        {stats.totalResults}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Users</div>
                      <div className="text-2xl font-bold text-foreground">
                        {stats.totalUsers}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Sync Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">Sync Status</div>
                  <div className="text-sm font-medium text-foreground">
                    {syncing ? (
                      <span className="text-yellow-500 flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Syncing...
                      </span>
                    ) : (
                      <span className="text-green-500 flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        Ready
                      </span>
                    )}
                  </div>
                </div>

                {syncProgress ? (
                  <>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">Progress</div>
                      <div className="text-sm font-medium text-foreground">
                        {syncProgress.completed}/{syncProgress.total} batches
                      </div>
                    </div>
                    <Progress
                      value={(syncProgress.completed / syncProgress.total) * 100}
                      className="h-2"
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {Math.round((syncProgress.completed / syncProgress.total) * 100)}% complete
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No sync in progress. Click &quot;Sync from S3&quot; to start.
                  </div>
                )}

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Images</span>
                    <span className="text-sm font-medium">{stats.totalImages}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Results</span>
                    <span className="text-sm font-medium">{stats.totalResults}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Sessions</span>
                    <span className="text-sm font-medium">{stats.activeSessions}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Recent Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground">User ID</TableHead>
                  <TableHead className="text-muted-foreground">Score</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="text-foreground">{result.userId}</TableCell>
                    <TableCell className="text-foreground">{result.score}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(result.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground">User ID</TableHead>
                  <TableHead className="text-muted-foreground">Progress</TableHead>
                  <TableHead className="text-muted-foreground">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSessions.map((session) => (
                  <TableRow key={session.userId}>
                    <TableCell className="text-foreground">{session.userId}</TableCell>
                    <TableCell className="text-foreground">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${session.progress}%` }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(session.lastActive).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 