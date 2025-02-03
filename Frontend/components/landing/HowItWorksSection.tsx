"use client";

import React from "react";
import { motion } from "framer-motion";
import { UploadCloud, Cpu, Trophy } from "lucide-react";

const steps = [
  {
    icon: <UploadCloud className="w-8 h-8 text-purple-600" />,
    title: "1. Upload",
    description: "Drop your PDFs or paste links.",
    color: "bg-purple-50",
    borderColor: "border-purple-100"
  },
  {
    icon: <Cpu className="w-8 h-8 text-blue-600" />,
    title: "2. Process",
    description: "AI creates summaries and flashcards instantly.",
    color: "bg-blue-50",
    borderColor: "border-blue-100"
  },
  {
    icon: <Trophy className="w-8 h-8 text-green-600" />,
    title: "3. Succeed",
    description: "Track your progress and crush your exams.",
    color: "bg-green-50",
    borderColor: "border-green-100"
  }
];

export const HowItWorksSection = () => {
  return (
    <section className="py-24 bg-gray-50/50 relative">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight"
          >
            How UniHub Works
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg"
          >
            From scattered notes to exam mastery in three simple steps.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-[40%] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-purple-100 via-blue-100 to-green-100 -z-10" />
          
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative flex flex-col items-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 group"
            >
              <div className={`w-20 h-20 rounded-2xl ${step.color} ${step.borderColor} border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-500 text-center font-medium leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
        
      </div>
    </section>
  );
};
