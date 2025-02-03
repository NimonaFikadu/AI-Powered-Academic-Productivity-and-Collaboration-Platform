"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";

export const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const freeFeatures = [
    { name: "Basic Notes", included: true },
    { name: "5 Quizzes/mo", included: true },
    { name: "Standard Search", included: true },
    { name: "Unlimited AI Quizzes", included: false },
    { name: "AI Study Assistant", included: false },
    { name: "Advanced Analytics", included: false },
  ];

  const premiumFeatures = [
    { name: "Unlimited AI Quizzes", included: true },
    { name: "AI Study Assistant (GPT-4)", included: true },
    { name: "Advanced Analytics", included: true },
    { name: "Priority Support", included: true },
    { name: "PDF Note Export", included: true },
    { name: "Basic Notes & Search", included: true },
  ];

  return (
    <section className="py-24 bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4"
          >
            Simple, transparent pricing
          </motion.h2>
          
          <div className="flex items-center justify-center space-x-3 mt-8">
            <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>
              Monthly
            </span>
            <button 
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative rounded-full w-14 h-8 bg-purple-100 p-1 transition-colors hover:bg-purple-200 focus:outline-none"
            >
              <motion.div 
                layout
                initial={false}
                animate={{ x: billingCycle === 'yearly' ? 24 : 0 }}
                className="w-6 h-6 bg-purple-600 rounded-full shadow-md"
              />
            </button>
            <span className={`text-sm font-bold flex items-center ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-400'}`}>
              Yearly 
              <span className="ml-2 bg-green-100 text-green-700 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full">Save 16%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Free Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-3xl p-8 border border-gray-200 flex flex-col hover:border-gray-300 transition-colors shadow-sm"
          >
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900">Free</h3>
              <div className="text-4xl font-extrabold mt-4 text-gray-900">
                ETB 0 <span className="text-lg font-medium text-gray-400">/ forever</span>
              </div>
              <p className="text-sm text-gray-500 mt-2 font-medium">Perfect for getting started with basic tools.</p>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              {freeFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-center text-sm font-medium">
                  {feature.included ? (
                    <CheckCircle2 className="text-gray-900 w-5 h-5 mr-3 flex-shrink-0" />
                  ) : (
                    <Circle className="text-gray-200 w-5 h-5 mr-3 flex-shrink-0" />
                  )}
                  <span className={feature.included ? "text-gray-700" : "text-gray-400 line-through"}>
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>

            <Link href="/auth/signup" className="w-full py-4 text-center rounded-xl font-bold border-2 border-gray-200 text-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-colors">
              Get Started Free
            </Link>
          </motion.div>

          {/* Premium Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gray-900 rounded-3xl p-8 border border-gray-800 flex flex-col relative shadow-2xl overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="absolute top-0 right-8 bg-gradient-to-b from-purple-500 to-purple-600 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-b-lg uppercase tracking-wider shadow-lg">
              Most Popular
            </div>
            
            <div className="mb-8 relative z-10">
              <h3 className="text-xl font-bold text-white">Premium</h3>
              <div className="text-4xl font-extrabold mt-4 text-white">
                ETB {billingCycle === 'monthly' ? '100' : '1000'} <span className="text-lg font-medium text-gray-500">/ {billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <p className="text-sm text-gray-400 mt-2 font-medium">For serious students aiming for top grades.</p>
            </div>

            <ul className="space-y-4 mb-8 flex-1 relative z-10">
              {premiumFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-center text-sm font-medium">
                  <CheckCircle2 className="text-purple-400 w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="text-gray-200">
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>

            <Link href="/auth/signup" className="relative z-10 w-full py-4 text-center rounded-xl font-bold bg-white text-gray-900 hover:bg-gray-100 transition-colors shadow-lg">
              Upgrade to Premium
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
