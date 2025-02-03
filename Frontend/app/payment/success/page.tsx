"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";

const useConfettiOnceOnSuccess = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    let raf = 0;
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      canvas.remove();
      return;
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = ["#16a34a", "#22c55e", "#0ea5e9", "#a855f7", "#f59e0b", "#ef4444"];
    const particles = Array.from({ length: 140 }).map(() => {
      const angle = (Math.random() * Math.PI) / 2 + Math.PI / 4;
      const speed = 8 + Math.random() * 10;
      return {
        x: canvas.width / 2,
        y: canvas.height / 3,
        vx: Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1) * speed,
        vy: -Math.sin(angle) * speed,
        g: 0.25 + Math.random() * 0.25,
        r: 2 + Math.random() * 3,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    });

    const start = performance.now();
    const durationMs = 3200;

    const tick = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r, -p.r, p.r * 2.4, p.r * 1.2);
        ctx.restore();
      }

      if (t < durationMs) {
        raf = requestAnimationFrame(tick);
      } else {
        cleanup();
      }
    };

    const cleanup = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.remove();
    };

    raf = requestAnimationFrame(tick);
    return cleanup;
  }, [enabled]);
};

type VerifyResult = {
  status?: string;
  message?: string;
};

type MeResponse = {
  user?: {
    subscription_end_date?: string | null;
  };
};

const PaymentSuccessContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<
    "success" | "failed" | "pending" | "invalid" | "error" | "unknown" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [txRef, setTxRef] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);

  useConfettiOnceOnSuccess(!loading && status === "success");

  useEffect(() => {
    const verify = async () => {
      try {
        setError(null);
        setLoading(true);

        const txRefFromUrl = searchParams.get("tx_ref");
        setTxRef(txRefFromUrl);

        if (!txRefFromUrl) {
          setStatus("invalid");
          setError("Invalid payment session. Missing transaction reference.");
          return;
        }

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
          setStatus("error");
          setError("You must be logged in to verify payment.");
          return;
        }

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiBaseUrl) {
          setStatus("error");
          setError("API base URL is not configured (NEXT_PUBLIC_API_URL).");
          return;
        }

        const res = await fetch(
          `${apiBaseUrl}/payment/verify?tx_ref=${encodeURIComponent(txRefFromUrl)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data: VerifyResult = await res.json().catch(() => ({}));

        if (!res.ok) {
          setStatus("error");
          setError(data?.message || "We couldn’t verify your payment. Please refresh or contact support.");
          return;
        }

        const normalized = String(data?.status || "unknown").toLowerCase();
        if (normalized === "success") {
          setStatus("success");
          
          // Fetch updated user data to sync frontend instantly
          try {
            const userRes = await fetch(`${apiBaseUrl}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (userRes.ok) {
              const userData: MeResponse = await userRes.json();
              if (userData.user) {
                localStorage.setItem("user", JSON.stringify(userData.user));
                const exp = userData.user.subscription_end_date;
                setExpiryDate(exp ? String(exp) : null);
              }
            }
          } catch (syncErr) {
            console.error("Frontend sync failed:", syncErr);
          }

          // User can choose to navigate; we don't auto-redirect on SaaS confirmation screens.
        } else if (normalized === "failed" || normalized === "cancelled" || normalized === "canceled") {
          setStatus("failed");
          setError("We couldn’t process your payment. You can try again safely.");
        } else if (normalized === "pending" || normalized === "processing") {
          setStatus("pending");
          setError("Your payment is still processing. Please wait a moment and refresh this page.");
        } else {
          setStatus("unknown");
          setError("We couldn’t determine your payment status. Please refresh or contact support.");
        }
      } catch (e: any) {
        setStatus("error");
        setError(e?.message || "We couldn’t verify your payment. Please refresh or contact support.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [router, searchParams]);

  const formatExpiry = (iso: string | null) => {
    if (!iso) return null;
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return iso;
    return dt.toLocaleString();
  };

  const Card = ({ children }: { children: React.ReactNode }) => (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-xl rounded-2xl bg-white shadow-lg p-6 sm:p-10 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl"
    >
      {children}
    </motion.div>
  );

  const MetaRow = ({ label, value }: { label: string; value?: string | null }) => {
    if (!value) return null;
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 break-all text-right">{value}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <Card>
        {loading && (
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <Loader2 className="h-7 w-7 text-gray-600 animate-spin" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold text-gray-900">Verifying your payment…</h1>
            <p className="mt-2 text-sm text-gray-600">This usually takes only a few seconds.</p>
            <div className="mt-6 space-y-3">
              <MetaRow label="Transaction reference" value={txRef} />
            </div>
          </div>
        )}

        {!loading && status === "success" && (
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold text-gray-900">Payment Successful</h1>
            <p className="mt-2 text-sm text-gray-600">Your Premium plan is now active.</p>

            <div className="mt-6 space-y-3 text-left">
              <MetaRow label="Plan" value="Premium" />
              <MetaRow label="Expiry date" value={formatExpiry(expiryDate)} />
              <MetaRow label="Transaction reference" value={txRef} />
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push("/home")}
                className="w-full sm:flex-1 rounded-xl bg-gray-900 text-white px-5 py-3 text-sm font-medium hover:bg-gray-800 transition-all duration-200 ease-out transform hover:scale-[1.03] hover:shadow-lg active:scale-95"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push("/upgrade")}
                className="w-full sm:flex-1 rounded-xl bg-white text-gray-900 px-5 py-3 text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-all duration-200 ease-out transform hover:scale-[1.03] hover:shadow-md active:scale-95"
              >
                View Features
              </button>
            </div>
          </div>
        )}

        {!loading && status === "pending" && (
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
              <Loader2 className="h-7 w-7 text-amber-600 animate-spin" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold text-gray-900">Payment Pending</h1>
            <p className="mt-2 text-sm text-gray-600">Your payment is still being confirmed.</p>

            <div className="mt-6 space-y-3 text-left">
              <MetaRow label="Transaction reference" value={txRef} />
              <MetaRow label="Status" value="Pending verification" />
            </div>

            <p className="mt-6 text-sm text-gray-600">{error}</p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:flex-1 rounded-xl bg-gray-900 text-white px-5 py-3 text-sm font-medium hover:bg-gray-800 transition"
              >
                Refresh Status
              </button>
              <button
                onClick={() => router.push("/home")}
                className="w-full sm:flex-1 rounded-xl bg-white text-gray-900 px-5 py-3 text-sm font-medium border border-gray-200 hover:bg-gray-50 transition"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {!loading && (status === "failed" || status === "invalid" || status === "error" || status === "unknown") && (
          <div className="text-center">
            <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${status === "invalid" ? "bg-gray-100" : "bg-red-50"}`}>
              {status === "invalid" ? (
                <AlertTriangle className="h-7 w-7 text-gray-700" />
              ) : (
                <XCircle className="h-7 w-7 text-red-600" />
              )}
            </div>

            <h1 className="mt-6 text-2xl font-semibold text-gray-900">
              {status === "invalid" ? "Invalid Payment Session" : "Payment Failed"}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {status === "invalid"
                ? "We couldn’t find a valid transaction reference for this page."
                : "Something went wrong during the transaction."}
            </p>

            <div className="mt-6 space-y-3 text-left">
              <MetaRow label="Transaction reference" value={txRef} />
              <MetaRow label="Details" value={error} />
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push("/upgrade")}
                className="w-full sm:flex-1 rounded-xl bg-gray-900 text-white px-5 py-3 text-sm font-medium hover:bg-gray-800 transition-all duration-200 ease-out transform hover:scale-[1.03] hover:shadow-lg active:scale-95"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/home")}
                className="w-full sm:flex-1 rounded-xl bg-white text-gray-900 px-5 py-3 text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-all duration-200 ease-out transform hover:scale-[1.03] hover:shadow-md active:scale-95"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const PaymentSuccessPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl rounded-2xl bg-white shadow-lg p-6 sm:p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center animate-pulse">
            <Loader2 className="h-7 w-7 text-gray-400 animate-spin" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-gray-900">Loading payment status…</h1>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
};

export default PaymentSuccessPage;
