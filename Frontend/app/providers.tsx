"use client";

import React, { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check local storage for globally persisted accent color
    const stored = localStorage.getItem("unihub_preferences");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.accentColor) {
          const hex = parsed.accentColor;
          let r = 0, g = 0, b = 0;
          if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
          } else if (hex.length === 7) {
            r = parseInt(hex[1] + hex[2], 16);
            g = parseInt(hex[3] + hex[4], 16);
            b = parseInt(hex[5] + hex[6], 16);
          }
          document.documentElement.style.setProperty("--primary-color", `${r} ${g} ${b}`);
        }
      } catch (e) {
        /* fail silently */
      }
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <I18nProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
          }}
        />
      </I18nProvider>
    </ThemeProvider>
  );
}
