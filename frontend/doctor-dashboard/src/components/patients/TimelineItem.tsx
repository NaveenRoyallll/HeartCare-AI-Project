import React from "react";
import { formatDateTime } from "@/lib/utils";
import {
  Activity,
  FileText,
  AlertTriangle,
  Pill,
  HeartPulse,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineEntry {
  id: string;
  type: "vital" | "lab" | "ecg" | "medication" | "alert" | "note";
  title: string;
  timestamp: string;
  description: string;
  source?: string;
  author?: string;
  isAbnormal?: boolean;
}

interface TimelineItemProps {
  entry: TimelineEntry;
  isLast?: boolean;
}

export function TimelineItem({ entry, isLast = false }: TimelineItemProps) {
  const getIcon = () => {
    switch (entry.type) {
      case "vital":
        return <Activity className="w-4 h-4 text-teal-600" />;
      case "lab":
        return <FlaskConical className="w-4 h-4 text-blue-600" />;
      case "ecg":
        return <HeartPulse className="w-4 h-4 text-rose-600" />;
      case "medication":
        return <Pill className="w-4 h-4 text-purple-600" />;
      case "alert":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case "note":
        return <FileText className="w-4 h-4 text-slate-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getBadgeColor = () => {
    switch (entry.type) {
      case "vital":
        return "bg-teal-50 border-teal-200 text-teal-800";
      case "lab":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "ecg":
        return "bg-rose-50 border-rose-200 text-rose-800";
      case "alert":
        return "bg-amber-50 border-amber-200 text-amber-800";
      default:
        return "bg-slate-50 border-slate-200 text-slate-700";
    }
  };

  return (
    <div className="relative flex gap-4">
      {/* Vertical line connecting entries */}
      {!isLast && (
        <span
          className="absolute left-4 top-8 -bottom-4 w-0.5 bg-slate-200"
          aria-hidden="true"
        />
      )}

      {/* Entry Icon */}
      <div
        className={cn(
          "relative flex items-center justify-center w-8 h-8 rounded-full border bg-white shadow-xs shrink-0",
          entry.isAbnormal ? "border-red-400 ring-2 ring-red-100" : "border-slate-200"
        )}
      >
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-semibold text-slate-900">{entry.title}</h5>
            <span
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded border uppercase",
                getBadgeColor()
              )}
            >
              {entry.type}
            </span>
          </div>
          <time className="text-xs font-mono text-slate-500">
            {formatDateTime(entry.timestamp)}
          </time>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
          {entry.description}
        </p>

        {(entry.source || entry.author) && (
          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
            {entry.source && (
              <span>
                Source: <span className="font-medium text-slate-700">{entry.source}</span>
              </span>
            )}
            {entry.author && (
              <span>
                By: <span className="font-medium text-slate-700">{entry.author}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
