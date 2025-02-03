"use client"

import * as React from "react"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { API_ENDPOINTS } from "@/config/apiConfig"

type DayCount = { date: string; count: number }

interface AdminChartsProps {
  authHeaders?: Record<string, string>
}

export function AdminCharts({ authHeaders }: AdminChartsProps) {
  const [userGrowth, setUserGrowth] = React.useState<DayCount[]>([])
  const [materialsPerDay, setMaterialsPerDay] = React.useState<DayCount[]>([])
  const [loading, setLoading] = React.useState(true)
  const hasLoadedRef = React.useRef(false)

  React.useEffect(() => {
    if (!authHeaders) {
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchCharts = async () => {
      try {
        const res = await fetch(`${API_ENDPOINTS.ADMIN.ANALYTICS}?days=30`, {
          headers: authHeaders,
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok || !body?.charts) return

        console.log("[FRONTEND_FETCH]", { endpoint: "ADMIN_ANALYTICS_DASHBOARD_CHARTS", body })

        if (!cancelled) {
          setUserGrowth(
            (body.charts.userGrowth || []).map((r: any) => ({
              date: r.date,
              count: Number(r.count) || 0,
            }))
          )
          setMaterialsPerDay(
            (body.charts.materialsPerDay || []).map((r: any) => ({
              date: r.date,
              count: Number(r.count) || 0,
            }))
          )
        }
      } catch (e) {
        console.error("[ADMIN_CHARTS_FETCH_ERROR]", e)
      } finally {
        if (!cancelled) {
          setLoading(false)
          hasLoadedRef.current = true
        }
      }
    }

    if (!hasLoadedRef.current) setLoading(true)
    fetchCharts()

    // Poll every 30s — charts update less frequently than stats
    const interval = setInterval(fetchCharts, 30_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [authHeaders])

  const tooltipStyle = {
    borderRadius: "12px",
    border: "none",
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="border-none shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-lg">User Growth</CardTitle>
            <CardDescription>Daily user registrations (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#4F46E5"
                    strokeWidth={3}
                    dot={{ fill: "#4F46E5", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="border-none shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-lg">Materials Per Day</CardTitle>
            <CardDescription>Uploads per day (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={materialsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
