"use client";

import React, { useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/config/apiConfig";
import { authService } from "@/app/auth/authService";
import { toast } from "react-hot-toast";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function AdminSecurityPage() {
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const storedToken = authService.getToken();
    if (storedToken) setToken(storedToken);
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }

    if (!token) return;
    setSaving(true);
    
    try {
      const res = await fetch(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Failed to update password");
      
      toast.success(data.message || "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your password and account security.
        </p>
      </div>

      <Card className="border-none shadow-sm">
        <form onSubmit={handlePasswordChange}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primaryColor">
              <ShieldCheck size={20} />
              Change Password
            </CardTitle>
            <CardDescription>
              We recommend using a strong password that you're not using elsewhere.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input 
                id="currentPassword" 
                type="password" 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
                placeholder="Enter current password"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input 
                id="newPassword" 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Enter new password"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Must be at least 6 characters.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Confirm new password"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-6">
            <Button type="submit" disabled={saving || !currentPassword || !newPassword || !confirmPassword} className="gap-2">
              {saving && <RefreshCw className="animate-spin h-4 w-4" />}
              Update Password
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
