"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/images/favicon.png";
import { authService } from "./auth/authService";
import { useRouter } from "next/navigation";

// Landing page sections
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeatureDeepDive } from "@/components/landing/FeatureDeepDive";
import { PricingSection } from "@/components/landing/PricingSection";

export default function LandingPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  // Prevent hydration mismatch
  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-purple-500/20">
      
      {/* Absolute Header (Transparent to blend with Hero) */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 bg-white/70 backdrop-blur-md border-b border-gray-100 transition-colors duration-300">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <Image 
            src={logo} 
            alt="UniHub Logo" 
            width={28} 
            height={28} 
            className="rounded-md" 
          />
          <span className="text-xl font-extrabold tracking-tight text-gray-900">UniHub</span>
        </div>
        
        <div className="flex items-center gap-6 text-sm font-semibold">
          {isAuthenticated ? (
            <Link
              href="/home"
              className="rounded-full bg-gray-900 px-5 py-2 text-white hover:bg-black transition-colors shadow-sm"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link 
                href="/auth/login" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-full bg-gray-900 px-5 py-2 text-white hover:bg-black transition-shadow shadow-md hover:shadow-lg"
              >
                Sign up free
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content Assembly */}
      <main className="flex flex-col">
        <HeroSection isAuthenticated={isAuthenticated} />
        <HowItWorksSection />
        <FeatureDeepDive />
        <PricingSection />
      </main>

      {/* Modern Minimal Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Image src={logo} alt="UniHub Logo" width={24} height={24} className="grayscale opacity-50" />
            <span className="text-gray-400 font-semibold text-sm">© {new Date().getFullYear()} UniHub. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-gray-400">
            <Link href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
      
    </div>
  );
}
