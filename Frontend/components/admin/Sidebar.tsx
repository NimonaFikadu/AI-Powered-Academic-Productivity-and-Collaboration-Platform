"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import fav from "@/public/images/favicon.png"
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BookOpen, 
  BarChart3, 
  CreditCard,
  Settings, 
  LogOut,
  Menu,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { authService } from "@/app/auth/authService"
import { useSearchParams } from "next/navigation"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin", tab: "dashboard" },
  { icon: Users, label: "Users", href: "/admin?tab=users", tab: "users" },
  { icon: BookOpen, label: "Materials", href: "/admin?tab=materials", tab: "materials" },
  { icon: FileText, label: "Notes", href: "/admin?tab=notes", tab: "notes" },
  { icon: CreditCard, label: "Transactions", href: "/admin?tab=transactions", tab: "transactions" },
  { icon: BarChart3, label: "Analytics", href: "/admin?tab=analytics", tab: "analytics" },
]

export function AdminSidebar({ className }: { className?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get("tab") || "dashboard"
  const [isOpen, setIsOpen] = React.useState(false)

  const handleLogout = () => {
    authService.logout()
    router.push("/auth/login")
  }

  return (
    <>
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-background border rounded-md shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <Link href="/home" className="flex items-center gap-2 font-bold text-xl text-primaryColor">
              <Image src={fav} alt="UniHub Logo" className="w-8 h-8 object-contain" />
              <span>UniHub <span className="text-xs font-normal text-muted-foreground uppercase tracking-wider">Admin</span></span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = currentTab === item.tab;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primaryColor/10 text-primaryColor" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t space-y-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-errorColor hover:bg-errorColor/10 transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
