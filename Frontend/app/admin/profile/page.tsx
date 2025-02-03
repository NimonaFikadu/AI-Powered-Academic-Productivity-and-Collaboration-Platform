"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { API_ENDPOINTS } from "@/config/apiConfig";
import { authService } from "@/app/auth/authService";
import { toast } from "react-hot-toast";
import { RefreshCw, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const storedToken = authService.getToken();
      if (!storedToken) return;
      setToken(storedToken);

      try {
        const res = await fetch(API_ENDPOINTS.AUTH.ME, {
          headers: {
            "Authorization": `Bearer ${storedToken}`,
            "Content-Type": "application/json"
          }
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || "Failed to fetch profile");
        
        if (data.user) {
          setEmail(data.user.email || "");
          setFullName(data.user.full_name || "");
          setRole(data.user.role || "");
        }
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch(API_ENDPOINTS.AUTH.UPDATE_PROFILE, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fullName, email })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Failed to update profile");
      
      toast.success(data.message || "Profile updated successfully");
      
      // Update local storage so navbar reflects changes
      const currentUser = authService.getUser() || {};
      localStorage.setItem("user", JSON.stringify({ ...currentUser, full_name: fullName, email }));
      
      // Emit generic storage event to force re-renders if necessary across tabs
      window.dispatchEvent(new Event("storage"));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account information and preferences.
        </p>
      </div>

      <Card className="border-none shadow-sm">
        <form onSubmit={handleSave}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primaryColor">
              <User size={20} />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your basic profile details here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-1/3" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    type="text" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Account Role</Label>
                  <div>
                    <Badge variant={role === "admin" ? "default" : "secondary"}>
                      {role || "Unknown"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your role defines your access privileges. Only Super Admins can change roles.
                  </p>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-6">
            <Button type="submit" disabled={loading || saving} className="gap-2">
              {saving ? <RefreshCw className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
