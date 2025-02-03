"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/app/auth/authService";
import { API_ENDPOINTS } from "@/config/apiConfig";
import { StatsCard } from "@/components/admin/StatsCard";
import { AdminCharts } from "@/components/admin/Charts";
import { 
  Users, 
  BookOpen, 
  FileText, 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2, 
  Download, 
  Eye,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  FileIcon,
  CreditCard,
  DollarSign
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

import { Pagination } from "@/components/admin/Pagination";
import { SortableTableHead } from "@/components/admin/SortableTableHead";
import { AnalyticsTab } from "@/components/admin/AnalyticsTab";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

type AdminUser = {
  id: string;
  email: string;
  role: string;
  created_at?: string;
};

type AdminMaterial = {
  id: string;
  user_id: string;
  topic_id: string;
  file_name: string;
  uploaded_file: string;
  file_type: string;
  file_size: number;
  created_at?: string;
  updated_at?: string;
};

type AdminNote = {
  id: string;
  title: string;
  user_id: string;
  topic_id: string | null;
  created_at?: string;
  updated_at?: string;
  is_private?: number | boolean;
};

type SystemStats = {
  users: number;
  materials: number;
  notes: number;
  totalRevenue?: number;
  totalTransactions?: number;
  successTransactions?: number;
  failedTransactions?: number;
  pendingTransactions?: number;
  ai?: {
    aiSuccessCount: number;
    aiFailureCount: number;
    aiFailureRate: string;
    lastErrorType: string;
    status: "HEALTHY" | "DEGRADED" | "DOWN";
  };
};

type AdminTransaction = {
  id: string;
  tx_ref: string;
  user_id: string;
  user_email: string | null;
  amount: string | number;
  status: "pending" | "success" | "failed" | string;
  created_at?: string;
};

const AdminPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";

  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [materials, setMaterials] = useState<AdminMaterial[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);

  // Pagination & Sorting State
  const [usersPagination, setUsersPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [materialsPagination, setMaterialsPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [notesPagination, setNotesPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [transactionsPagination, setTransactionsPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const [usersSort, setUsersSort] = useState<{ key: string; dir: "ASC" | "DESC" }>({ key: "created_at", dir: "DESC" });
  const [materialsSort, setMaterialsSort] = useState<{ key: string; dir: "ASC" | "DESC" }>({ key: "created_at", dir: "DESC" });
  const [notesSort, setNotesSort] = useState<{ key: string; dir: "ASC" | "DESC" }>({ key: "created_at", dir: "DESC" });

  // Search and Filter State
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [materialSearch, setMaterialSearch] = useState("");
  const [noteSearch, setNoteSearch] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionStatus, setTransactionStatus] = useState("all");

  // Preview State
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);

  // User Detail State
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Delete Confirmation State
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "user" | "material" | "note";
    id: string;
    label: string;
  } | null>(null);

  const token = useMemo(() => (isClient ? authService.getToken() : null), [isClient]);
  const currentUser = useMemo(() => (isClient ? authService.getUser() : null), [isClient]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (!authService.isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    if (currentUser?.role !== "admin") {
      router.push("/home");
      return;
    }
  }, [currentUser?.role, isClient, router]);

  const authHeaders = useMemo(() => {
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [token]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: usersPagination.page.toString(),
        pageSize: "10",
        search: userSearch,
        role: roleFilter,
        sortBy: usersSort.key,
        sortDir: usersSort.dir
      });
      const res = await fetch(`${API_ENDPOINTS.ADMIN.USERS}?${params}`, { headers: authHeaders });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.message || "Failed to fetch users");
      setUsers(body.users || []);
      setUsersPagination(body.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, token, usersPagination.page, userSearch, roleFilter, usersSort]);

  const fetchMaterials = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: materialsPagination.page.toString(),
        pageSize: "10",
        search: materialSearch,
        sortBy: materialsSort.key,
        sortDir: materialsSort.dir
      });
      const res = await fetch(`${API_ENDPOINTS.ADMIN.MATERIALS}?${params}`, { headers: authHeaders });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.message || "Failed to fetch materials");
      setMaterials(body.materials || []);
      setMaterialsPagination(body.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, token, materialsPagination.page, materialSearch, materialsSort]);

  const fetchNotes = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: notesPagination.page.toString(),
        pageSize: "10",
        search: noteSearch,
        sortBy: notesSort.key,
        sortDir: notesSort.dir
      });
      const res = await fetch(`${API_ENDPOINTS.ADMIN.NOTES}?${params}`, { headers: authHeaders });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.message || "Failed to fetch notes");
      setNotes(body.notes || []);
      setNotesPagination(body.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, token, notesPagination.page, noteSearch, notesSort]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.STATS, { headers: authHeaders });
      const body = await res.json();
      console.log('[FRONTEND_FETCH]', { endpoint: 'ADMIN_STATS', body });
      if (!res.ok) throw new Error(body?.message || `Stats request failed (${res.status})`);
      // Normalize: backend returns top-level { ai, usage, performance, users, topics, stats }
      // We merge legacy stats fields + new structured fields so all UI bindings work.
      const legacy = body.stats || {};
      const normalized: SystemStats = {
        // Legacy flat fields (used by dashboard StatsCards)
        users: Number(body.users?.totalUsers ?? legacy.users) || 0,
        materials: Number(legacy.materials) || 0,
        notes: Number(legacy.notes) || 0,
        // Usage fields (transactions tab)
        totalRevenue: Number(legacy.totalRevenue) || 0,
        totalTransactions: Number(body.usage?.totalTransactions ?? legacy.totalTransactions) || 0,
        successTransactions: Number(body.usage?.successTransactions ?? legacy.successTransactions) || 0,
        failedTransactions: Number(body.usage?.failedTransactions ?? legacy.failedTransactions) || 0,
        pendingTransactions: Number(body.usage?.pendingTransactions ?? legacy.pendingTransactions) || 0,
        // AI fields (System Health card)
        ai: {
          aiSuccessCount: Number(body.ai?.aiSuccessCount ?? legacy.ai?.aiSuccessCount) || 0,
          aiFailureCount: Number(body.ai?.aiFailureCount ?? legacy.ai?.aiFailureCount) || 0,
          aiFailureRate: body.performance?.aiFailureRate ?? legacy.ai?.aiFailureRate ?? '0.0%',
          lastErrorType: body.ai?.lastErrorType ?? legacy.ai?.lastErrorType ?? 'none',
          status: (body.ai?.status ?? legacy.ai?.status ?? 'HEALTHY') as 'HEALTHY' | 'DEGRADED' | 'DOWN',
        },
      };
      setStats(normalized);
    } catch (e: any) {
      console.error('[ADMIN_STATS_FETCH_ERROR]', e?.message);
      toast.error(e?.message || 'Failed to load system stats');
    }
  }, [authHeaders, token]);

  const fetchTransactions = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: transactionsPagination.page.toString(),
        pageSize: "10",
        status: transactionStatus,
        search: transactionSearch
      });
      const res = await fetch(`${API_ENDPOINTS.ADMIN.TRANSACTIONS}?${params}`, { headers: authHeaders });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.message || "Failed to fetch transactions");
      setTransactions(body.transactions || []);
      setTransactionsPagination(body.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, token, transactionsPagination.page, transactionSearch, transactionStatus]);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    await Promise.all([fetchUsers(), fetchMaterials(), fetchNotes(), fetchStats()]);
    setLoading(false);
  }, [fetchUsers, fetchMaterials, fetchNotes, fetchStats, token]);

  useEffect(() => {
    if (isClient && currentUser?.role === "admin") {
      if (currentTab === "dashboard") fetchAll();
      else if (currentTab === "users") fetchUsers();
      else if (currentTab === "materials") fetchMaterials();
      else if (currentTab === "notes") fetchNotes();
      else if (currentTab === "transactions") {
        fetchStats();
        fetchTransactions();
      }
    }
  }, [currentUser?.role, isClient, currentTab, fetchAll, fetchUsers, fetchMaterials, fetchNotes, fetchStats, fetchTransactions]);

  const transactionBadge = (s: string) => {
    const normalized = String(s || "").toLowerCase();
    if (normalized === "success") return "bg-green-100 text-green-700";
    if (normalized === "failed") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  };

  const handleDelete = async () => {
    if (!deleteConfirm || !token) return;

    try {
      setIsDeleting(true);
      let endpoint = "";
      if (deleteConfirm.type === "user") endpoint = API_ENDPOINTS.ADMIN.USER_DELETE(deleteConfirm.id);
      else if (deleteConfirm.type === "material") endpoint = API_ENDPOINTS.ADMIN.MATERIAL_DELETE(deleteConfirm.id);
      else if (deleteConfirm.type === "note") endpoint = API_ENDPOINTS.ADMIN.NOTE_DELETE(deleteConfirm.id);

      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Failed to delete ${deleteConfirm.type}`);
      }

      toast.success(`${deleteConfirm.type.charAt(0).toUpperCase() + deleteConfirm.type.slice(1)} deleted successfully`);
      setDeleteConfirm(null);
      
      if (currentTab === "users") fetchUsers();
      else if (currentTab === "materials") fetchMaterials();
      else if (currentTab === "notes") fetchNotes();
      else fetchAll();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    await handleDelete();
  };

  if (!isClient || currentUser?.role !== "admin") return null;

  return (
    <>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
              </h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {currentUser.full_name || "Admin"}. Here's what's happening.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                if (currentTab === "dashboard") fetchAll();
                else if (currentTab === "users") fetchUsers();
                else if (currentTab === "materials") fetchMaterials();
                else if (currentTab === "notes") fetchNotes();
              }} 
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {currentTab === "analytics" && (
            <AnalyticsTab authHeaders={authHeaders} />
          )}

          {currentTab === "dashboard" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard 
                  title="Total Users" 
                  value={loading ? "-" : stats?.users ?? 0} 
                  icon={Users}
                  trend={{ value: 12, isPositive: true }}
                  color="primary"
                  delay={0.1}
                />
                <StatsCard 
                  title="Materials" 
                  value={loading ? "-" : stats?.materials ?? 0} 
                  icon={BookOpen}
                  trend={{ value: 8, isPositive: true }}
                  color="success"
                  delay={0.2}
                />
                <StatsCard 
                  title="Notes Created" 
                  value={loading ? "-" : stats?.notes ?? 0} 
                  icon={FileText}
                  trend={{ value: 4, isPositive: false }}
                  color="info"
                  delay={0.3}
                />
              </div>

              <AdminCharts authHeaders={authHeaders} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Recent Users</CardTitle>
                      <CardDescription>Latest registrations in your platform</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => router.push("/admin?tab=users")}>
                      View all
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="pl-6">User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="pr-6 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                              <TableRow key={i}>
                                <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                              </TableRow>
                            ))
                          ) : users.slice(0, 5).map((u) => (
                            <TableRow key={u.id}>
                              <TableCell className="pl-6 font-medium">{u.email}</TableCell>
                              <TableCell>
                                <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                                  {u.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="pr-6 text-right">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-primaryColor flex items-center gap-2">
                      <CheckCircle2 size={18} />
                      System Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">API Server</span>
                        <span className="text-green-600 font-medium">Healthy</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-[98%] bg-green-500 rounded-full" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Database</span>
                        <span className="text-green-600 font-medium">94ms latency</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-[100%] bg-green-500 rounded-full" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">AI RAG Service</span>
                        {loading ? (
                          <Skeleton className="h-4 w-20" />
                        ) : (
                          <span className={cn(
                            "font-medium flex items-center gap-1.5",
                            stats?.ai?.status === 'DOWN' ? 'text-errorColor' :
                            stats?.ai?.status === 'DEGRADED' ? 'text-amber-600' :
                            'text-successColor'
                          )}>
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              stats?.ai?.status === 'DOWN' ? 'bg-errorColor' :
                              stats?.ai?.status === 'DEGRADED' ? 'bg-amber-600' :
                              'bg-successColor'
                            )} />
                            {stats?.ai?.status || 'HEALTHY'}
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className={cn(
                          "h-full rounded-full transition-all duration-500",
                          stats?.ai?.status === 'DOWN' ? 'w-[15%] bg-errorColor' :
                          stats?.ai?.status === 'DEGRADED' ? 'w-[65%] bg-amber-500' :
                          'w-[100%] bg-successColor'
                        )} />
                      </div>
                      {!loading && (
                        <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                          Last error: {stats?.ai?.lastErrorType && stats.ai.lastErrorType !== 'none' ? stats.ai.lastErrorType : 'None'} 
                          {stats?.ai?.aiFailureRate ? ` (${stats.ai.aiFailureRate} fail rate)` : ''}
                        </p>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground italic">
                        All systems operational. Last sync: 2 minutes ago.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {currentTab === "users" && (
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage your platform's users and roles</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input 
                        placeholder="Search users..." 
                        className="pl-9 w-64"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center border rounded-lg px-3 bg-card h-10">
                      <Filter size={16} className="text-muted-foreground mr-2" />
                      <select 
                        className="bg-transparent text-sm focus:outline-none cursor-pointer"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                      >
                        <option value="all">All Roles</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <SortableTableHead 
                          label="Email Address" 
                          sortKey="email" 
                          activeSortBy={usersSort.key} 
                          activeSortDir={usersSort.dir} 
                          onSortChange={(key, dir) => setUsersSort({ key, dir })}
                          className="pl-6"
                        />
                        <SortableTableHead 
                          label="Role Status" 
                          sortKey="role" 
                          activeSortBy={usersSort.key} 
                          activeSortDir={usersSort.dir} 
                          onSortChange={(key, dir) => setUsersSort({ key, dir })}
                        />
                        <TableHead className="text-right pr-6">Management</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="h-32 text-center text-muted-foreground italic">
                              No users match your filters.
                            </TableCell>
                          </TableRow>
                        ) : users.map((u) => (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key={u.id} 
                            className="group border-b transition-colors hover:bg-muted/30"
                          >
                            <TableCell className="pl-6 font-medium">{u.email}</TableCell>
                            <TableCell>
                              <Badge className={cn(
                                "font-medium",
                                u.role === "admin" ? "bg-primaryColor/10 text-primaryColor hover:bg-primaryColor/20" : "bg-muted text-muted-foreground"
                              )}>
                                {u.role.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="pr-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-muted-foreground hover:text-primaryColor"
                                  onClick={() => setSelectedUser(u)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-errorColor hover:bg-errorColor/10"
                                  disabled={u.id === currentUser.id}
                                  onClick={() => setDeleteConfirm({ type: "user", id: u.id, label: u.email })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <Pagination 
                page={usersPagination.page} 
                totalPages={usersPagination.totalPages} 
                onPageChange={(p) => setUsersPagination(prev => ({ ...prev, page: p }))} 
              />
            </Card>
          )}

          {currentTab === "transactions" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                  title="Total Revenue"
                  value={loading ? "-" : `${Number(stats?.totalRevenue || 0).toFixed(2)} ETB`}
                  icon={DollarSign}
                  color="success"
                  delay={0.1}
                />
                <StatsCard
                  title="Total Transactions"
                  value={loading ? "-" : stats?.totalTransactions ?? 0}
                  icon={CreditCard}
                  color="primary"
                  delay={0.2}
                />
                <StatsCard
                  title="Failed Payments"
                  value={loading ? "-" : stats?.failedTransactions ?? 0}
                  icon={AlertCircle}
                  color="error"
                  delay={0.3}
                />
              </div>

              <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Transactions</CardTitle>
                      <CardDescription>Monitor payments and subscription upgrades</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                          placeholder="Search by email or tx_ref..."
                          className="pl-9 w-72"
                          value={transactionSearch}
                          onChange={(e) => setTransactionSearch(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center border rounded-lg px-3 bg-card h-10">
                        <Filter size={16} className="text-muted-foreground mr-2" />
                        <select
                          className="bg-transparent text-sm focus:outline-none cursor-pointer"
                          value={transactionStatus}
                          onChange={(e) => setTransactionStatus(e.target.value)}
                        >
                          <option value="all">All Status</option>
                          <option value="success">Success</option>
                          <option value="pending">Pending</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setTransactionsPagination((p) => ({ ...p, page: 1 }));
                          fetchTransactions();
                        }}
                        className="gap-2"
                      >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="pl-6">tx_ref</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          Array.from({ length: 6 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell className="pl-6"><Skeleton className="h-4 w-56" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                              <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            </TableRow>
                          ))
                        ) : transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                              No transactions match your filters.
                            </TableCell>
                          </TableRow>
                        ) : (
                          transactions.map((t) => (
                            <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="pl-6 font-medium">
                                <div className="max-w-[320px] truncate" title={t.tx_ref}>
                                  {t.tx_ref}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                <div className="flex flex-col">
                                  <span className="font-medium">{t.user_email || "Unknown"}</span>
                                  <span className="text-[10px] text-muted-foreground">ID: {t.user_id?.slice(0, 8)}...</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">{Number(t.amount).toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge className={cn("text-[10px] font-bold", transactionBadge(t.status))}>
                                  {String(t.status || "pending").toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {t.created_at ? new Date(t.created_at).toLocaleString() : "N/A"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                <Pagination
                  page={transactionsPagination.page}
                  totalPages={transactionsPagination.totalPages}
                  onPageChange={(p) => setTransactionsPagination((prev) => ({ ...prev, page: p }))}
                />
              </Card>
            </div>
          )}

          {currentTab === "materials" && (
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader>
                <CardTitle>Resource Materials</CardTitle>
                <CardDescription>All uploaded documents and files</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <SortableTableHead 
                          label="File Name" 
                          sortKey="file_name" 
                          activeSortBy={materialsSort.key} 
                          activeSortDir={materialsSort.dir} 
                          onSortChange={(key, dir) => setMaterialsSort({ key, dir })}
                          className="pl-6"
                        />
                        <SortableTableHead 
                          label="Format" 
                          sortKey="file_type" 
                          activeSortBy={materialsSort.key} 
                          activeSortDir={materialsSort.dir} 
                          onSortChange={(key, dir) => setMaterialsSort({ key, dir })}
                        />
                        <TableHead>Owner</TableHead>
                        <SortableTableHead 
                          label="Date" 
                          sortKey="created_at" 
                          activeSortBy={materialsSort.key} 
                          activeSortDir={materialsSort.dir} 
                          onSortChange={(key, dir) => setMaterialsSort({ key, dir })}
                        />
                        <TableHead className="text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                            No materials found.
                          </TableCell>
                        </TableRow>
                      ) : materials.map((m) => (
                        <TableRow key={m.id} className="group hover:bg-muted/30 transition-colors">
                          <TableCell className="pl-6 font-medium">
                            <div className="flex items-center gap-2">
                              <FileIcon size={16} className="text-muted-foreground" />
                              {m.file_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="uppercase text-[10px] font-bold">
                              {m.file_type.split("/").pop()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex flex-col">
                              <span>{(m as any).owner_email || "System"}</span>
                              <span className="text-[10px] text-muted-foreground">ID: {m.user_id.slice(0, 8)}...</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {m.created_at ? new Date(m.created_at).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-primaryColor"
                                onClick={() => setPreviewFile({
                                  url: `${process.env.NEXT_PUBLIC_API_URL}/materials/${m.user_id}/${m.uploaded_file}?token=${token}`,
                                  name: m.file_name,
                                  type: m.file_type
                                })}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <a 
                                href={`${process.env.NEXT_PUBLIC_API_URL}/materials/${m.user_id}/${m.uploaded_file}?token=${token}`} 
                                download={m.file_name}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primaryColor">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </a>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-errorColor"
                                onClick={() => setDeleteConfirm({ type: "material", id: m.id, label: m.file_name })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <Pagination 
                page={materialsPagination.page} 
                totalPages={materialsPagination.totalPages} 
                onPageChange={(p) => setMaterialsPagination(prev => ({ ...prev, page: p }))} 
              />
            </Card>
          )}

          {currentTab === "notes" && (
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader>
                <CardTitle>Study Notes</CardTitle>
                <CardDescription>User-generated notes and summaries</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <SortableTableHead 
                          label="Note Title" 
                          sortKey="title" 
                          activeSortBy={notesSort.key} 
                          activeSortDir={notesSort.dir} 
                          onSortChange={(key, dir) => setNotesSort({ key, dir })}
                          className="pl-6"
                        />
                        <SortableTableHead 
                          label="Privacy" 
                          sortKey="privacy" 
                          activeSortBy={notesSort.key} 
                          activeSortDir={notesSort.dir} 
                          onSortChange={(key, dir) => setNotesSort({ key, dir })}
                        />
                        <TableHead>Creator</TableHead>
                        <SortableTableHead 
                          label="Created" 
                          sortKey="created_at" 
                          activeSortBy={notesSort.key} 
                          activeSortDir={notesSort.dir} 
                          onSortChange={(key, dir) => setNotesSort({ key, dir })}
                        />
                        <TableHead className="text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                            No notes found.
                          </TableCell>
                        </TableRow>
                      ) : notes.map((n) => (
                        <TableRow key={n.id} className="group hover:bg-muted/30 transition-colors">
                          <TableCell className="pl-6 font-medium">{n.title}</TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "text-[10px] font-bold",
                              n.is_private ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                            )}>
                              {n.is_private ? "PRIVATE" : "PUBLIC"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex flex-col">
                              <span>{(n as any).owner_email || "System"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {n.created_at ? new Date(n.created_at).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-errorColor"
                              onClick={() => setDeleteConfirm({ type: "note", id: n.id, label: n.title })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <Pagination 
                page={notesPagination.page} 
                totalPages={notesPagination.totalPages} 
                onPageChange={(p) => setNotesPagination(prev => ({ ...prev, page: p }))} 
              />
            </Card>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-errorColor">
                <Trash2 size={20} />
                Delete {deleteConfirm?.type}
              </DialogTitle>
              <DialogDescription className="py-2">
                Are you sure you want to delete <span className="font-semibold text-foreground">"{deleteConfirm?.label}"</span>? 
                This action is irreversible and may affect other system components.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex sm:justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="bg-errorColor hover:bg-errorColor/90 flex items-center gap-2">
                {isDeleting ? <RefreshCw className="animate-spin h-4 w-4" /> : null}
                Confirm Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* File Preview Modal */}
        <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
          <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-3 gap-0">
            <DialogHeader className="py-2 px-3 border-b flex-row items-center justify-between">
              <div>
                <DialogTitle className="text-sm font-medium flex items-center gap-2">
                  <FileIcon size={16} className="text-primaryColor" />
                  {previewFile?.name}
                </DialogTitle>
              </div>
              <a 
                href={previewFile?.url || "#"} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primaryColor flex items-center gap-1 text-[11px]"
              >
                Open in new tab <ExternalLink size={12} />
              </a>
            </DialogHeader>
            <div className="flex-1 bg-muted/20 overflow-hidden relative min-h-0">
              {previewFile?.type?.startsWith("image/") ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain shadow-md" />
                </div>
              ) : previewFile?.type === "application/pdf" ? (
                <iframe src={`${previewFile.url}#toolbar=0`} className="w-full h-full border-none" title={previewFile.name} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Download size={40} />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">Preview not available</p>
                    <p className="text-sm text-muted-foreground mt-1">This file type ({previewFile?.type}) cannot be previewed directly.</p>
                  </div>
                  <Button asChild>
                    <a href={previewFile?.url} download={previewFile?.name}>Download to View</a>
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      {/* ── User Detail Dialog ── */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primaryColor" />
              User Details
            </DialogTitle>
            <DialogDescription>Full information for this account.</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-2">
              {/* Avatar placeholder */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primaryColor/10 flex items-center justify-center text-primaryColor font-bold text-xl">
                  {selectedUser.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedUser.email}</p>
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    selectedUser.role === "admin"
                      ? "bg-primaryColor/10 text-primaryColor"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {selectedUser.role.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="border rounded-lg divide-y text-sm">
                <div className="flex justify-between px-4 py-3">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono text-xs text-right max-w-[200px] truncate">{selectedUser.id}</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{selectedUser.email}</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium capitalize">{selectedUser.role}</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-muted-foreground">Registered</span>
                  <span className="font-medium">
                    {selectedUser.created_at
                      ? new Date(selectedUser.created_at).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric"
                        })
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Close</Button>
            {selectedUser && selectedUser.id !== currentUser?.id && (
              <Button
                variant="destructive"
                onClick={() => {
                  setDeleteConfirm({ type: "user", id: selectedUser.id, label: selectedUser.email });
                  setSelectedUser(null);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminPage;
