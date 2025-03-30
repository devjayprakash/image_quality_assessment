"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import Cookies from "js-cookie";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Result = {
  id: number;
  userId: string;
  score: number;
  createdAt: string;
  imageKey: string;
};

type ImageBatch = {
  id: number;
  className: string;
  results: Result[];
};

type Batch = {
  id: number;
  createdAt: string;
  imageBatches: ImageBatch[];
};

export default function ResultsPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedBatches, setExpandedBatches] = useState<Set<number>>(new Set());
  const [expandedImageBatches, setExpandedImageBatches] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const authCookie = Cookies.get("adminAuth");
      const response = await fetch("/api/admin/results", {
        headers: {
          Authorization: `Basic ${authCookie}`,
        },
      });
      const data = await response.json();
      setBatches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching results:", error);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleBatch = (batchId: number) => {
    const newExpanded = new Set(expandedBatches);
    if (newExpanded.has(batchId)) {
      newExpanded.delete(batchId);
    } else {
      newExpanded.add(batchId);
    }
    setExpandedBatches(newExpanded);
  };

  const toggleImageBatch = (imageBatchId: number) => {
    const newExpanded = new Set(expandedImageBatches);
    if (newExpanded.has(imageBatchId)) {
      newExpanded.delete(imageBatchId);
    } else {
      newExpanded.add(imageBatchId);
    }
    setExpandedImageBatches(newExpanded);
  };

  const filteredBatches = batches.filter((batch) =>
    batch.imageBatches.some((imageBatch) =>
      imageBatch.results.some(
        (result) =>
          String(result.userId).toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(result.imageKey).toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  );

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Results</h1>
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search results..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      <Card className="border shadow-lg">
        <CardHeader>
          <CardTitle className="text-foreground">All Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredBatches.length > 0 ? (
              filteredBatches.map((batch) => (
                <div key={batch.id} className="border rounded-lg">
                  <div
                    className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted"
                    onClick={() => toggleBatch(batch.id)}
                  >
                    <div className="flex items-center space-x-2">
                      {expandedBatches.has(batch.id) ? (
                        <ChevronDown className="h-5 w-5 text-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-foreground" />
                      )}
                      <span className="font-medium text-foreground">
                        Batch {batch.id} - Created{" "}
                        {new Date(batch.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {batch.imageBatches.length} image batches
                    </span>
                  </div>

                  {expandedBatches.has(batch.id) && (
                    <div className="p-4 space-y-4">
                      {batch.imageBatches.map((imageBatch) => (
                        <div key={imageBatch.id} className="border rounded-lg">
                          <div
                            className="flex items-center justify-between p-3 bg-muted/50 cursor-pointer hover:bg-muted"
                            onClick={() => toggleImageBatch(imageBatch.id)}
                          >
                            <div className="flex items-center space-x-2">
                              {expandedImageBatches.has(imageBatch.id) ? (
                                <ChevronDown className="h-4 w-4 text-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-foreground" />
                              )}
                              <span className="font-medium text-foreground">
                                {imageBatch.className}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {imageBatch.results.length} results
                            </span>
                          </div>

                          {expandedImageBatches.has(imageBatch.id) && (
                            <div className="p-4">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-muted-foreground">User ID</TableHead>
                                    <TableHead className="text-muted-foreground">Image</TableHead>
                                    <TableHead className="text-muted-foreground">Score</TableHead>
                                    <TableHead className="text-muted-foreground">Time</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {imageBatch.results.map((result) => (
                                    <TableRow key={result.id}>
                                      <TableCell className="text-foreground">{result.userId}</TableCell>
                                      <TableCell>
                                        <img
                                          src={`/api/image/${result.imageKey}`}
                                          alt="Labeled image"
                                          className="w-16 h-16 object-cover rounded"
                                        />
                                      </TableCell>
                                      <TableCell className="text-foreground">{result.score}</TableCell>
                                      <TableCell className="text-muted-foreground">
                                        {new Date(result.createdAt).toLocaleString()}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No results found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 