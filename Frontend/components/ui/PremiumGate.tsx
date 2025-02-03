"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PiLockKey, PiStar, PiArrowRight } from "react-icons/pi";

interface PremiumGateProps {
  /** If true the gate is shown; children are NOT rendered */
  isBlocked: boolean;
  /** Short human-readable name of the premium feature */
  featureName?: string;
  /** Custom description shown below the title */
  description?: string;
  /** Children rendered when user IS premium */
  children: React.ReactNode;
}

/**
 * PremiumGate — wraps a premium feature.
 *
 * When `isBlocked` is true it replaces the feature with a styled
 * upgrade call-to-action instead of letting the request reach the API
 * and receiving a confusing 403 error.
 *
 * Usage:
 * ```tsx
 * <PremiumGate isBlocked={!isPremium} featureName="AI Study Assistant">
 *   <AssistantChat />
 * </PremiumGate>
 * ```
 */
const PremiumGate: React.FC<PremiumGateProps> = ({
  isBlocked,
  featureName = "This Feature",
  description,
  children,
}) => {
  const router = useRouter();

  if (!isBlocked) {
    return <>{children}</>;
  }

  const defaultDescription =
    description ||
    `${featureName} is available exclusively for Premium subscribers. Upgrade to unlock AI-powered learning tools, unlimited quiz generation, and smart note summarization.`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[340px] w-full px-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-primaryColor/20 bg-white shadow-lg">
        {/* Decorative gradient header */}
        <div className="h-2 w-full bg-gradient-to-r from-primaryColor via-secondaryColor to-primaryColor/60" />

        <div className="flex flex-col items-center gap-4 px-8 py-10 text-center">
          {/* Lock icon with glow */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 animate-pulse rounded-full bg-primaryColor/10 scale-150" />
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primaryColor/20 to-secondaryColor/20 border border-primaryColor/20">
              <PiLockKey className="text-primaryColor" size={32} />
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <PiStar className="text-yellow-500 fill-yellow-400" size={16} />
              <span className="text-xs font-semibold uppercase tracking-widest text-primaryColor">
                Premium Feature
              </span>
              <PiStar className="text-yellow-500 fill-yellow-400" size={16} />
            </div>
            <h2 className="text-xl font-bold text-n700 dark:text-white">
              {featureName} Requires Premium
            </h2>
          </div>

          {/* Description */}
          <p className="text-sm text-n300 dark:text-n400 leading-relaxed max-w-sm">
            {defaultDescription}
          </p>

          {/* Benefits list */}
          <ul className="w-full space-y-2 text-left">
            {[
              "AI-powered study assistant",
              "Unlimited quiz generation",
              "Smart note summarization",
              "Priority support",
            ].map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-sm text-n500 dark:text-n200">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primaryColor/10 text-primaryColor flex-shrink-0 text-xs font-bold">
                  ✓
                </span>
                {benefit}
              </li>
            ))}
          </ul>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
            <button
              onClick={() => router.push("/upgrade")}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primaryColor to-secondaryColor py-3 px-6 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              <PiStar size={16} />
              Upgrade to Premium
              <PiArrowRight size={16} />
            </button>
            <button
              onClick={() => router.back()}
              className="flex-1 flex items-center justify-center rounded-xl border border-primaryColor/20 py-3 px-6 text-sm font-medium text-primaryColor hover:bg-primaryColor/5 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumGate;
