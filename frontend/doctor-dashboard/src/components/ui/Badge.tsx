import React from "react";
import { cn } from "@/lib/utils";
import { Sparkles, CheckCircle2 } from "lucide-react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "outline"
    | "ai"
    | "reviewed";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium rounded",
    md: "px-2.5 py-1 text-xs font-semibold rounded-md",
  };

  const variantStyles = {
    default: "bg-slate-100 text-slate-700 border border-slate-200",
    primary: "bg-navy-50 text-navy-800 border border-navy-200",
    secondary: "bg-teal-50 text-teal-800 border border-teal-200",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-rose-50 text-rose-700 border border-rose-200",
    outline: "bg-transparent border border-slate-300 text-slate-700",
    ai: "bg-purple-50 text-purple-700 border border-purple-200 shadow-xs",
    reviewed: "bg-teal-50 text-teal-800 border border-teal-300 shadow-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 leading-none tracking-wide",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {variant === "ai" && <Sparkles className="w-3 h-3 text-purple-600 inline" />}
      {variant === "reviewed" && <CheckCircle2 className="w-3 h-3 text-teal-600 inline" />}
      {children}
    </span>
  );
}

export function RiskBadge({ level }: { level: string }) {
  const normalized = level.toUpperCase();
  switch (normalized) {
    case "CRITICAL":
      return <Badge variant="danger">CRITICAL RISK</Badge>;
    case "HIGH":
      return <Badge variant="warning">HIGH RISK</Badge>;
    case "MODERATE":
      return <Badge variant="secondary">MODERATE RISK</Badge>;
    case "LOW":
      return <Badge variant="success">LOW RISK</Badge>;
    default:
      return <Badge variant="default">{level}</Badge>;
  }
}

export function AiLabel({
  requiresReview = true,
}: {
  requiresReview?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold tracking-wider rounded-md bg-purple-50 border border-purple-300 text-purple-800 uppercase">
      <Sparkles className="w-3 h-3 text-purple-600 animate-pulse" />
      AI-GENERATED
      {requiresReview && (
        <span className="font-normal text-purple-600 normal-case tracking-normal">
          — Requires clinical review
        </span>
      )}
    </span>
  );
}
