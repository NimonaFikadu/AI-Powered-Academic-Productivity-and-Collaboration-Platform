"use client";

import * as React from "react";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { API_ENDPOINTS } from "@/config/apiConfig";

type AdminAnalyticsResponse = {
  charts?: {
    userGrowth?: Array<{ date: string; count: number | string }>;
    materialsPerDay?: Array<{ date: string; count: number | string }>;
    notesDistribution?: Array<{ name: string; value: number | string }>;
  };
  activity?: Array<{
    entity_type: string;
    entity_id: string;
    label: string;
    action: string;
    created_at: string;
  }>;
};

type AdminStatsResponse = {
  ai?: {
    aiSuccessCount: number;
    aiFailureCount: number;
    status: string;
    lastErrorType: string;
  };
  usage?: {
    totalTransactions: number;
    successTransactions: number;
    failedTransactions: number;
    pendingTransactions: number;
  };
  performance?: {
    aiFailureRate: string;
    serverTime: string;
  };
  users?: {
    totalUsers: number;
  };
  topics?: {
    totalTopics: number;
  };
};

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#06B6D4"]; 

export function AnalyticsTab({ authHeaders }: { authHeaders: Record<string, string> }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<AdminAnalyticsResponse | null>(null);
  const [stats, setStats] = React.useState<AdminStatsResponse | null>(null);
  const hasLoadedRef = React.useRef(false);

  React.useEffect(() => {
    let cancelled = false;

    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${API_ENDPOINTS.ADMIN.ANALYTICS}?days=30`, {
          headers: authHeaders,
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.message || `Request failed (${res.status})`);

        console.log("[FRONTEND_FETCH]", { endpoint: "ADMIN_ANALYTICS", body });

        if (!cancelled) setData(body);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load analytics");
      }
    };

    const fetchStats = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.ADMIN.STATS, {
          headers: authHeaders,
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.message || `Request failed (${res.status})`);

        console.log("[FRONTEND_FETCH]", { endpoint: "ADMIN_STATS", body });

        if (!cancelled) setStats(body);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load system stats");
      }
    };

    const run = async () => {
      if (!hasLoadedRef.current) setLoading(true);
      setError(null);
      await Promise.all([fetchAnalytics(), fetchStats()]);
      if (!cancelled) {
        setLoading(false);
        hasLoadedRef.current = true;
      }
    };

    run();

    const interval = setInterval(() => {
      run();
    }, 15_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [authHeaders]);

  const userGrowth = (data?.charts?.userGrowth || []).map((r) => ({
    date: r.date,
    count: Number(r.count) || 0,
  }));

  const materialsPerDay = (data?.charts?.materialsPerDay || []).map((r) => ({
    date: r.date,
    count: Number(r.count) || 0,
  }));

  const notesDistribution = (data?.charts?.notesDistribution || []).map((r) => ({
    name: r.name,
    value: Number(r.value) || 0,
  }));

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl border border-errorColor/20 bg-errorColor/5 text-errorColor text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">AI Success Count</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-semibold">{stats?.ai?.aiSuccessCount ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">AI Failure Count</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-semibold">{stats?.ai?.aiFailureCount ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">AI Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-semibold">{stats?.ai?.status ?? "HEALTHY"}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Last AI Error</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-semibold">{stats?.ai?.lastErrorType ?? "none"}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-semibold">{stats?.usage?.totalTransactions ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Failed Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-semibold">{stats?.usage?.failedTransactions ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-semibold">{stats?.users?.totalUsers ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Total Topics</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-semibold">{stats?.topics?.totalTopics ?? 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-lg">User Growth</CardTitle>
            <CardDescription>New user registrations (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#4F46E5"
                    strokeWidth={3}
                    dot={{ fill: "#4F46E5", strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-lg">Materials Per Day</CardTitle>
            <CardDescription>Uploads per day (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={materialsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Notes Distribution</CardTitle>
            <CardDescription>Public vs Private</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Pie data={notesDistribution} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={3}>
                    {notesDistribution.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Activity Log</CardTitle>
            <CardDescription>Recent system activity</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : !data?.activity?.length ? (
              <div className="text-sm text-muted-foreground italic">No recent activity.</div>
            ) : (
              <div className="divide-y">
                {data.activity.map((a) => (
                  <div key={`${a.entity_type}-${a.entity_id}-${a.created_at}`} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium">
                        {a.entity_type}: {a.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {a.action}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
