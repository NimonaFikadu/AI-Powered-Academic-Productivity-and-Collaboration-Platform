"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, PieChart, Send, Bot, CheckCircle2 } from "lucide-react";

export const FeatureDeepDive = () => {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Feature 1: AI Assistance (Image Right, Text Left) */}
        <div className="flex flex-col lg:flex-row items-center gap-16 mb-32">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-sm font-bold tracking-wide uppercase">
              <MessageSquare size={16} />
              AI Assistance
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              A tutor that never sleeps. <br className="hidden md:block"/>
              <span className="text-gray-400 font-medium">Ready when you are.</span>
            </h2>
            <p className="text-lg text-gray-500 font-medium leading-relaxed">
              Ask questions about your uploaded documents, get instant explanations, and generate custom study materials through a seamless chat interface. Grounded entirely in your own notes.
            </p>
            <ul className="space-y-3 pt-4">
              {["Context-aware responses", "Inline document citations", "Generate mock tests on the fly"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                  <CheckCircle2 size={20} className="text-purple-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Mockup Chat UI */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 w-full relative"
          >
            <div className="relative z-10 glass-card bg-white/50 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl p-4 md:p-6 w-full max-w-lg mx-auto">
              
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <Bot size={20} />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Study Copilot</div>
                  <div className="text-xs text-green-500 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-4">
                <div className="flex justify-end">
                  <div className="bg-gray-900 text-white p-3 px-4 rounded-2xl rounded-tr-sm text-sm max-w-[8e5%]">
                    Can you summarize chapter 4 of the Biology PDF?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-purple-50 text-gray-800 p-3 px-4 rounded-2xl rounded-tl-sm text-sm border border-purple-100 shadow-sm max-w-[85%]">
                    Sure! Chapter 4 covers Cellular Respiration. Key takeaways:
                    <ul className="list-disc pl-4 mt-2 space-y-1">
                      <li>Glycolysis occurs in the cytoplasm.</li>
                      <li>Krebs cycle produces ATP in mitochondria.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="relative mt-4">
                <div className="w-full bg-gray-50 border border-gray-200 rounded-full py-3 px-4 text-sm text-gray-400">
                  Type your question...
                </div>
                <div className="absolute right-2 top-2 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                  <Send size={14} className="-ml-0.5" />
                </div>
              </div>

            </div>
            
            {/* Decorative background blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full h-full max-w-sm rounded-full bg-purple-200/50 blur-3xl" />
          </motion.div>
        </div>

        {/* Feature 2: Smart Insights (Image Left, Text Right) */}
        <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
          
          {/* Mockup Analytics UI */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 w-full relative"
          >
            <div className="relative z-10 glass-card bg-white/50 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-auto">
              <div className="mb-6">
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Mastery Progress</div>
                <div className="text-4xl font-extrabold text-gray-900">
                  92% <span className="text-sm text-green-500 font-medium">+14% this week</span>
                </div>
              </div>

              <div className="space-y-5">
                {[
                  { label: "Anatomy", val: 95, color: "bg-blue-500" },
                  { label: "Microbiology", val: 78, color: "bg-purple-500" },
                  { label: "Physics", val: 65, color: "bg-yellow-500" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1.5 font-medium">
                      <span className="text-gray-700">{item.label}</span>
                      <span className="text-gray-900">{item.val}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.val}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-2 rounded-full ${item.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Decorative background blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full h-full max-w-sm rounded-full bg-blue-200/50 blur-3xl" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-bold tracking-wide uppercase">
              <PieChart size={16} />
              Premium Analytics
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Visualize your progress. <br className="hidden md:block"/>
              <span className="text-gray-400 font-medium">Identify weak spots.</span>
            </h2>
            <p className="text-lg text-gray-500 font-medium leading-relaxed">
              Unlock advanced tracking with UniHub Premium. See exactly where you're excelling and which topics need more attention before exam day.
            </p>
            <ul className="space-y-3 pt-4">
              {["Topic-level mastery tracking", "Time spent vs. performance", "Predictive exam readiness"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                  <CheckCircle2 size={20} className="text-blue-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
          
        </div>

      </div>
    </section>
  );
};
