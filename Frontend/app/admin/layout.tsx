"use client";

import React, { useEffect, useState } from "react";
import { AdminNavbar } from "@/components/admin/Navbar";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { authService } from "@/app/auth/authService";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    const user = authService.getUser();
    if (!user || user.role !== "admin") {
      router.replace("/auth/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isClient || !isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar className="w-64" />
      <main className="flex-1 lg:ml-64">
        <AdminNavbar />
        {children}
      </main>
    </div>
  );
}
