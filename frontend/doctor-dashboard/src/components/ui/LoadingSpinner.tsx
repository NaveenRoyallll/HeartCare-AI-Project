import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
  label,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4">
      <div
        className={cn(
          "rounded-full border-slate-200 border-t-teal-600 animate-spin",
          sizeClasses[size],
          className
        )}
        role="status"
        aria-label="Loading"
      />
      {label && <p className="text-xs font-medium text-slate-500">{label}</p>}
    </div>
  );
}
