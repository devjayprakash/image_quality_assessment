"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { syncDataFromS3 } from "./admin.action";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const AdminPage = () => {
  const [percentageCompleted , setPercentageCompleted] = useState(0);
  const [loading , setLoading] = useState(false);

  return (
    <div className="container mx-atuo p-4">
      <Card>
        <CardContent>
          <div className="text-3xl">Temp Admin panel</div>
          <div className="w-full bg-gray-200 rounded">
            <div
              className="bg-green-500 h-2 rounded"
              style={{ width: `${percentageCompleted}%` }}
            ></div>
          </div>
          <h1>{percentageCompleted} %</h1>
          <Button
            onClick={async () => {
              setLoading(true)
              const result = await syncDataFromS3();
              for await (const item of result) {
                if (item) {
                  const total = item.total as number;
                  const completed = item.completed as number;

                  setPercentageCompleted(parseInt(((completed / total) * 100).toFixed(0)));
                }
              }
              setLoading(false)
            }}
            className="mt-4"
          >
            {loading && <Loader2 />}
            {loading ? 'Syncing data' : 'Sync data'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
export default AdminPage;
