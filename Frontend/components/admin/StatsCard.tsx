"use client"

import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: "primary" | "success" | "warning" | "error" | "info"
  delay?: number
}

const colorMap = {
  primary: "text-primaryColor bg-primaryColor/10",
  success: "text-green-600 bg-green-600/10",
  warning: "text-amber-600 bg-amber-600/10",
  error: "text-errorColor bg-errorColor/10",
  info: "text-blue-600 bg-blue-600/10",
}

export function StatsCard({ title, value, icon: Icon, trend, description, color = "primary", delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
              
              {trend && (
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
                    trend.isPositive ? "text-green-600 bg-green-50" : "text-errorColor bg-errorColor/5"
                  )}>
                    {trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {trend.value}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              )}
              
              {!trend && description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            
            <div className={cn("p-3 rounded-2xl", colorMap[color])}>
              <Icon size={24} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
