"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Cookies from "js-cookie";

export default function AdminLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // Test the credentials with the auth API
      const response = await fetch("/api/admin/auth", {
        headers: {
          Authorization: `Basic ${btoa(`${email}:${password}`)}`,
        },
      });

      if (response.ok) {
        // Set auth cookie
        Cookies.set("adminAuth", btoa(`${email}:${password}`), { 
          expires: 7, // Cookie expires in 7 days
          path: "/",
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict"
        });
        router.push("/admin/dashboard");
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto mt-20">
        <Card className="border shadow-lg">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold text-foreground">Admin Login</h1>
                <p className="text-sm text-muted-foreground">Enter your credentials to access the admin panel</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="admin@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div className="text-sm text-destructive text-center">{error}</div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 