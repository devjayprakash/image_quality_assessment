"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Users, FileText, Settings, Moon, Sun } from "lucide-react";
import Cookies from "js-cookie";
import { useTheme } from "next-themes";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    Cookies.remove("adminAuth");
    window.location.href = "/admin/login";
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-card border-r">
          <div className="p-4">
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <nav className="mt-4">
            <Link
              href="/admin/dashboard"
              className={cn(
                "flex items-center px-4 py-3 text-muted-foreground hover:bg-accent",
                pathname === "/admin/dashboard" && "bg-accent"
              )}
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
            <Link
              href="/admin/results"
              className={cn(
                "flex items-center px-4 py-3 text-muted-foreground hover:bg-accent",
                pathname === "/admin/results" && "bg-accent"
              )}
            >
              <FileText className="w-5 h-5 mr-3" />
              Results
            </Link>
            <Link
              href="/admin/users"
              className={cn(
                "flex items-center px-4 py-3 text-muted-foreground hover:bg-accent",
                pathname === "/admin/users" && "bg-accent"
              )}
            >
              <Users className="w-5 h-5 mr-3" />
              Users
            </Link>
            <Link
              href="/admin/settings"
              className={cn(
                "flex items-center px-4 py-3 text-muted-foreground hover:bg-accent",
                pathname === "/admin/settings" && "bg-accent"
              )}
            >
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </Link>
          </nav>
          <div className="absolute bottom-0 w-64 p-4 border-t">
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:bg-accent"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 mr-3" />
                ) : (
                  <Moon className="w-5 h-5 mr-3" />
                )}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:bg-accent"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8">{children}</div>
      </div>
    </div>
  );
} 