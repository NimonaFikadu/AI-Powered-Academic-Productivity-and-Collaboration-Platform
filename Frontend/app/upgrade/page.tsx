"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Lock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

type PlanType = "free" | "premium";
type BillingCycle = "monthly" | "yearly";
type PaymentMethodType = "chapa" | "telebirr";

const UpgradePage = () => {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("premium");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("chapa");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
          setPageLoading(false);
          return;
        }

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          const user = data.user;
          const isPremium = user?.subscription_status === 'premium';
          
          if (isPremium && user?.subscription_end_date) {
            const endDate = new Date(user.subscription_end_date);
            if (new Date() < endDate) {
              setIsActive(true);
              setExpiryDate(endDate.toISOString().split('T')[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch user state:", err);
      } finally {
        setPageLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleUpgrade = async () => {
    try {
      setError(null);
      
      if (!selectedPlan) {
        setError("Please select a plan to continue.");
        return;
      }

      if (isActive) {
        setError("You already have an active Premium plan.");
        return;
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      if (selectedPlan === "free") {
        setError("You are already on the free plan.");
        return;
      }

      setLoading(true);

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiBaseUrl) {
        setError("API base URL is not configured.");
        setLoading(false);
        return;
      }

      // Handle billing cycle pricing
      const amount = selectedPlan === "premium" ? (billingCycle === "monthly" ? 100 : 1000) : 0;

      const res = await fetch(`${apiBaseUrl}/payment/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data?.message === "You already have an active premium subscription") {
          setIsActive(true);
          setError("You already have an active plan.");
        } else {
          setError(data?.message || "Failed to initialize payment.");
        }
        setLoading(false);
        return;
      }

      const checkoutUrl = data?.checkout_url || data?.url;

      if (!checkoutUrl) {
        setError("Missing checkout_url from server response.");
        setLoading(false);
        return;
      }

      window.location.href = checkoutUrl;
    } catch (e: any) {
      console.error("Payment flow error:", e);
      setError(e?.message || "Something went wrong.");
      setLoading(false);
    }
  };

  const freeFeatures = [
    { name: "Basic Notes", included: true },
    { name: "5 Quizzes/mo", included: true },
    { name: "Standard Search", included: true },
    { name: "Community Access", included: true },
    { name: "Unlimited AI Quizzes", included: false },
    { name: "Advanced Analytics Dashboard", included: false },
    { name: "AI Study Assistant (GPT-4)", included: false },
    { name: "Priority Support", included: false },
    { name: "Collaboration Tools", included: false },
    { name: "PDF Note Export", included: false },
  ];

  const premiumFeatures = [
    { name: "Unlimited AI Quizzes", included: true },
    { name: "Advanced Analytics Dashboard", included: true },
    { name: "AI Study Assistant (GPT-4 powered)", included: true },
    { name: "Priority Support", included: true },
    { name: "Collaboration Tools", included: true },
    { name: "PDF Note Export", included: true },
    { name: "Basic Notes & Standard Search", included: true },
    { name: "Community Access", included: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] py-16 px-4 flex flex-col items-center">
      <div className="w-full max-w-5xl mx-auto">
        
        {/* Header section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
            Upgrade your learning experience
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Choose the plan that fits your needs. Go premium to unlock the full potential of AI-powered study tools.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button 
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative rounded-full w-14 h-8 bg-purple-200 dark:bg-purple-900/40 p-1 transition-colors hover:bg-purple-300 focus:outline-none"
            >
              <motion.div 
                layout
                initial={false}
                animate={{ x: billingCycle === 'yearly' ? 24 : 0 }}
                className="w-6 h-6 bg-purple-600 rounded-full shadow-md"
              />
            </button>
            <span className={`text-sm font-medium flex items-center ${billingCycle === 'yearly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              Yearly 
              <span className="ml-2 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Save ~16%</span>
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-8 flex items-center font-medium max-w-3xl mx-auto">
             <span>{error}</span>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto relative">
          
          {/* Free Plan */}
          <motion.div 
            whileHover={{ y: -5 }}
            onClick={() => setSelectedPlan("free")}
            className={`cursor-pointer rounded-2xl p-8 transition-all duration-300 border-2 bg-white dark:bg-gray-800 flex flex-col
              ${selectedPlan === "free" 
                ? "border-gray-400 dark:border-gray-500 shadow-md" 
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Free</h2>
              <div className="text-4xl font-extrabold mt-4 text-gray-900 dark:text-white">
                ETB 0 <span className="text-lg font-normal text-gray-500 dark:text-gray-400">/ forever</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Perfect for getting started with basic tools.</p>
            </div>
            
            <button
              onClick={() => setSelectedPlan("free")} 
              className={`w-full py-3 px-4 rounded-xl font-semibold mb-8 transition-colors
                ${selectedPlan === "free" 
                  ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white" 
                  : "border-2 border-gray-200 text-gray-700 dark:border-gray-600 dark:text-gray-300"
              }`}
            >
              Current Plan
            </button>

            <ul className="space-y-4 flex-1">
              {freeFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-center text-sm">
                  {feature.included ? (
                    <CheckCircle2 className="text-gray-800 dark:text-gray-300 w-5 h-5 mr-3 flex-shrink-0" />
                  ) : (
                    <Circle className="text-gray-300 dark:text-gray-600 w-5 h-5 mr-3 flex-shrink-0" />
                  )}
                  <span className={feature.included ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-400 dark:text-gray-500 line-through"}>
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Premium Plan (Highlighted) */}
          <motion.div 
            whileHover={{ y: -5 }}
            onClick={() => setSelectedPlan("premium")}
            className={`relative cursor-pointer rounded-2xl p-8 transition-all duration-300 border-2 bg-white dark:bg-gray-800 flex flex-col z-10
              ${selectedPlan === "premium" 
                ? "border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.15)] ring-1 ring-purple-500" 
                : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
              }`}
          >
            {/* Very faint background glow wrapper for premium feel */}
            {selectedPlan === "premium" && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-2xl pointer-events-none"></div>
            )}
            
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center shadow-md whitespace-nowrap">
              Most Popular
            </div>
            
            <div className="mb-6 relative z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Premium</h2>
              <div className="text-4xl font-extrabold mt-4 text-purple-600 dark:text-purple-400">
                ETB {billingCycle === 'monthly' ? '100' : '1000'} <span className="text-lg font-normal text-gray-500 dark:text-gray-400">/ {billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">For serious students aiming for top grades.</p>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={loading || selectedPlan === "free" || isActive}
              className={`w-full py-3 px-4 rounded-xl font-bold shadow-md mb-8 transition-all transform relative z-10
                ${isActive 
                  ? "bg-green-600 border border-green-500 shadow-xl cursor-default text-white active:scale-100" 
                  : loading 
                    ? "bg-purple-400 cursor-not-allowed text-white active:scale-95" 
                    : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/30 hover:shadow-lg hover:shadow-purple-500/40 active:scale-95"
                }`}
            >
              {pageLoading ? (
                 <div className="flex items-center justify-center">
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                   Checking status...
                 </div>
              ) : isActive ? (
                 <span>Premium Active until <span className="font-extrabold">{expiryDate}</span></span>
              ) : loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Redirecting...
                </div>
              ) : (
                "Unlock Full Potential"
              )}
            </button>

            <ul className="space-y-4 flex-1 relative z-10">
              {premiumFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-center text-sm">
                  <CheckCircle2 className="text-purple-600 dark:text-purple-400 w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="text-gray-800 dark:text-gray-200 font-semibold">
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Integration: Payment Method tightly coupled beneath plans */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-12"
        >
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Select Payment Method</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              onClick={() => selectedPlan === "premium" && setPaymentMethod("chapa")}
              className={`rounded-xl p-4 flex items-center transition-all duration-200 border-2
                ${selectedPlan === "premium" ? "cursor-pointer" : "opacity-50 grayscale cursor-not-allowed"}
                ${paymentMethod === "chapa" && selectedPlan === "premium"
                  ? "border-purple-500 bg-purple-50/50 dark:bg-purple-900/10 ring-1 ring-purple-500 shadow-sm" 
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center flex-shrink-0 transition-colors
                ${paymentMethod === "chapa" && selectedPlan === "premium" ? "border-purple-600" : "border-gray-300 dark:border-gray-600"}`}>
                {paymentMethod === "chapa" && selectedPlan === "premium" && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full" />}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 dark:text-white">Chapa</span>
                <span className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">Secure Gateway</span>
              </div>
            </div>

            <div 
              className="cursor-not-allowed opacity-40 rounded-xl p-4 flex items-center border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
            >
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 mr-3 flex-shrink-0"></div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 dark:text-white">Telebirr</span>
                <span className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">Coming Soon</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Triggers & Trust Elements */}
        <div className="text-center pb-8 border-t border-gray-200 dark:border-gray-800 pt-8 mt-4 max-w-4xl mx-auto">
          <p className="text-gray-800 dark:text-gray-300 font-medium mb-4 text-lg">
            Joined by <span className="font-bold text-purple-600 dark:text-purple-400">500+ students</span> from AAU and HiLCoE
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-500">
            <div className="flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-green-500" />
              <span>Secure payment powered by Chapa</span>
            </div>
            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700"></div>
            <div>No credit card required to try Free</div>
            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700"></div>
            <div>Cancel anytime</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UpgradePage;
