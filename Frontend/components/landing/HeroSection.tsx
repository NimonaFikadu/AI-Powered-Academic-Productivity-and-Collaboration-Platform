"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Calendar, 
  Youtube, 
  Link2, 
  File as FileIcon,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { PiArrowRight } from "react-icons/pi";

export const HeroSection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-20 overflow-hidden bg-white">
      {/* Background Dot Grid */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, black 1px, transparent 0)",
          backgroundSize: "32px 32px"
        }}
      />
      
      {/* Subtle Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-purple-600/10 to-blue-600/10 blur-3xl mix-blend-multiply" />

      {/* Floating Cards Container (Desktop Only) */}
      <div className="absolute inset-0 z-0 hidden lg:block max-w-7xl mx-auto pointer-events-none">
        
        {/* Card A: AI Summary (Top Left) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute top-[20%] left-[5%] glass-card p-4 rounded-2xl shadow-xl border border-gray-100/50 bg-white/70 backdrop-blur-md max-w-[240px]"
        >
          <div className="flex items-center gap-2 mb-2 text-purple-600">
            <Sparkles size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">AI Summary</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            "Mitochondria is the powerhouse of the cell, generating most of the chemical energy needed..."
          </p>
        </motion.div>

        {/* Card B: Quiz Score (Bottom Right) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="absolute bottom-[25%] right-[5%] glass-card p-5 rounded-2xl shadow-xl border border-gray-100/50 bg-white/70 backdrop-blur-md flex items-center gap-4"
        >
          <div className="relative w-12 h-12 flex items-center justify-center rounded-full border-4 border-gray-100">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-blue-500"
                strokeDasharray="125"
                strokeDashoffset="18" // roughly 85%
                strokeLinecap="round"
              />
            </svg>
            <span className="text-xs font-bold text-gray-800">85%</span>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">Quiz Score</div>
            <div className="text-xs text-gray-500 font-medium">Biology 101</div>
          </div>
        </motion.div>

        {/* Card C: Upcoming Exam (Bottom Left) */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="absolute bottom-[20%] left-[10%] glass-card p-4 rounded-2xl shadow-xl border border-gray-100/50 bg-white/70 backdrop-blur-md flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <Calendar size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">Final Exam</div>
            <div className="text-xs text-gray-500 font-medium">Tomorrow, 9:00 AM</div>
          </div>
        </motion.div>

        {/* Card D: Integrations (Top Right) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="absolute top-[25%] right-[10%] glass-card p-4 rounded-2xl shadow-xl border border-gray-100/50 bg-white/70 backdrop-blur-md text-center max-w-[180px]"
        >
          <div className="text-xs font-bold text-gray-800 mb-3">Integrates with</div>
          <div className="flex gap-2 justify-center">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
              <FileIcon size={16} />
            </div>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
              <Youtube size={16} />
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
              <Link2 size={16} />
            </div>
          </div>
        </motion.div>

      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-4xl text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight"
        >
          Master{" "}
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Anything
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="mx-auto max-w-2xl text-lg sm:text-xl text-gray-500 mb-10 leading-relaxed font-medium"
        >
          Your personalized study copilot, grounded in your sources. Summarize, quiz, and analyze your notes with advanced AI.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <Link
            href={isAuthenticated ? "/home" : "/auth/signup"}
            className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-black px-8 py-4 text-lg font-semibold text-white shadow-xl hover:bg-gray-800 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
          >
            <span>{isAuthenticated ? "Go to Dashboard" : "Start Learning Free"}</span>
            <div className="rounded-full bg-white/20 p-1 group-hover:bg-white/30 transition-colors">
              <PiArrowRight size={18} />
            </div>
          </Link>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 font-medium">
            <CheckCircle2 size={16} className="text-green-500" />
            <span>No credit card required</span>
            <span className="mx-2">•</span>
            <span>Cancel anytime</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
