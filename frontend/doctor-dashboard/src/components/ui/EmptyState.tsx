import React from "react";
import { cn } from "@/lib/utils";
import { FolderSearch } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = <FolderSearch className="w-12 h-12 text-slate-300 stroke-[1.5]" />,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50",
        className
      )}
    >
      <div className="p-3 bg-white rounded-full shadow-xs border border-slate-100 mb-3">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-slate-800 tracking-tight">
        {title}
      </h4>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
