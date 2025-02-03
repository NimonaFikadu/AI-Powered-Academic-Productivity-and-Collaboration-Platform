"use client"

import * as React from "react"
import { 
  Bell, 
  Search, 
  User,
  Moon,
  Sun
} from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authService } from "@/app/auth/authService"

export function AdminNavbar() {
  const { theme, setTheme } = useTheme()
  const user = authService.getUser()
  const router = useRouter()

  const handleLogout = () => {
    authService.logout()
    router.push("/auth/login")
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-background/80 backdrop-blur-md px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search dashboard..." 
            className="w-full pl-10 pr-4 py-2 bg-muted rounded-full text-sm border-none focus:ring-1 focus:ring-primaryColor"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-full hover:bg-accent text-muted-foreground transition-colors"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-full hover:bg-accent text-muted-foreground transition-colors relative focus:outline-none">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-errorColor rounded-full border-2 border-background" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium">No new notifications</p>
              <p className="text-xs text-muted-foreground mt-1">When you have notifications, they will appear here.</p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-2 focus:outline-none">
              <div className="w-8 h-8 rounded-full bg-primaryColor/20 flex items-center justify-center text-primaryColor font-medium">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "A"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold leading-none">{user?.full_name || "Admin"}</p>
                <p className="text-[10px] text-muted-foreground leading-none mt-1 uppercase tracking-tighter">Super Admin</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/admin/profile")}>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/admin/security")}>Security</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-errorColor cursor-pointer" onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
