"use client";

import React from "react";

interface VerifiedClubBadgeProps {
  size?: "xs" | "sm" | "md";
  showText?: boolean;
  className?: string;
}

export function VerifiedClubBadge({
  size = "sm",
  showText = true,
  className = "",
}: VerifiedClubBadgeProps) {
  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
  };

  const textSizes = {
    xs: "text-[10px] px-1.5 py-0.5 gap-1",
    sm: "text-[11px] px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full bg-blue-50 text-blue-800 border border-blue-200/90 shadow-2xs select-none ${
        textSizes[size]
      } ${className}`}
      title="Verifierad förening (Officiell klubbrepresentant)"
    >
      <svg
        className={`${iconSizes[size]} text-blue-600 shrink-0`}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM13.707 8.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      {showText && <span className="tracking-tight whitespace-nowrap">Verifierad förening</span>}
    </span>
  );
}

export default VerifiedClubBadge;
