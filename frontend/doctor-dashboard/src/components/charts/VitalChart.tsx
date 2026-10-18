"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import { VitalMeasurement } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Activity } from "lucide-react";

interface VitalChartProps {
  vitals: VitalMeasurement[];
  height?: number;
}

export function VitalChart({ vitals, height = 320 }: VitalChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<"all" | "hr" | "bp">("all");

  // Transform raw vitals into chronological chart points
  // If no vitals are passed, use representative clinical trend points
  const chartData = React.useMemo(() => {
    if (!vitals || vitals.length === 0) {
      return [
        { time: "00:00", heartRate: 72, systolic: 124, diastolic: 82, spo2: 98, source: "Apple Watch Series 9" },
        { time: "04:00", heartRate: 68, systolic: 120, diastolic: 78, spo2: 98, source: "Apple Watch Series 9" },
        { time: "08:00", heartRate: 85, systolic: 138, diastolic: 86, spo2: 97, source: "Omron Smart Cuff" },
        { time: "12:00", heartRate: 92, systolic: 142, diastolic: 90, spo2: 96, source: "Apple Watch Series 9" },
        { time: "16:00", heartRate: 110, systolic: 154, diastolic: 94, spo2: 96, source: "Omron Smart Cuff" },
        { time: "20:00", heartRate: 135, systolic: 162, diastolic: 98, spo2: 95, source: "Apple Watch Series 9" },
        { time: "22:00", heartRate: 168, systolic: 164, diastolic: 99, spo2: 95, source: "Hospital Monitor" },
      ];
    }

    // Map passed vitals by timestamp
    const timeMap = new Map<string, any>();
    vitals.forEach((v) => {
      const timeKey = formatDateTime(v.timestamp);
      if (!timeMap.has(timeKey)) {
        timeMap.set(timeKey, {
          time: timeKey,
          timestamp: v.timestamp,
          source: v.source,
        });
      }
      const entry = timeMap.get(timeKey);
      if (v.type === "heart_rate") entry.heartRate = v.value;
      if (v.type === "blood_pressure") {
        entry.systolic = v.value;
        entry.diastolic = v.secondaryValue;
      }
      if (v.type === "spo2") entry.spo2 = v.value;
      if (v.type === "respiratory_rate") entry.respiratoryRate = v.value;
    });

    return Array.from(timeMap.values());
  }, [vitals]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const source = payload[0]?.payload?.source || "Clinical Device";
      return (
        <div className="bg-navy-950 text-white p-3 rounded-lg shadow-xl border border-navy-800 text-xs space-y-1.5 z-50">
          <p className="font-semibold text-slate-300 border-b border-navy-800 pb-1">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-white">
                {entry.value} {entry.name.includes("Rate") ? "bpm" : entry.name.includes("Pressure") ? "mmHg" : "%"}
              </span>
            </div>
          ))}
          <div className="pt-1.5 border-t border-navy-800/80 text-[10px] text-teal-400">
            Source: <span className="text-slate-300">{source}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Metric Selector Tabs */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600" />
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Telemetry Vitals Trends
          </span>
        </div>
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium text-slate-600">
          <button
            onClick={() => setSelectedMetric("all")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedMetric === "all" ? "bg-white text-navy-900 shadow-xs font-semibold" : "hover:text-slate-900"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedMetric("hr")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedMetric === "hr" ? "bg-white text-navy-900 shadow-xs font-semibold" : "hover:text-slate-900"
            }`}
          >
            Heart Rate
          </button>
          <button
            onClick={() => setSelectedMetric("bp")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedMetric === "bp" ? "bg-white text-navy-900 shadow-xs font-semibold" : "hover:text-slate-900"
            }`}
          >
            Blood Pressure
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[40, 190]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: "12px", paddingTop: "-6px" }}
            />

            {/* Normal reference ranges */}
            <ReferenceLine y={100} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: "HR Tachycardia (>100)", position: "insideTopRight", fill: "#B45309", fontSize: 10 }} />
            <ReferenceLine y={140} stroke="#EF4444" strokeDasharray="3 3" label={{ value: "BP Stage 2 (>140)", position: "insideTopRight", fill: "#B91C1C", fontSize: 10 }} />

            {(selectedMetric === "all" || selectedMetric === "hr") && (
              <Line
                type="monotone"
                dataKey="heartRate"
                name="Heart Rate"
                stroke="#0D9488"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#0D9488", strokeWidth: 1, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#0D9488" }}
              />
            )}

            {(selectedMetric === "all" || selectedMetric === "bp") && (
              <>
                <Line
                  type="monotone"
                  dataKey="systolic"
                  name="Systolic BP"
                  stroke="#E11D48"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#E11D48", strokeWidth: 1, stroke: "#fff" }}
                  activeDot={{ r: 6, fill: "#E11D48" }}
                />
                <Line
                  type="monotone"
                  dataKey="diastolic"
                  name="Diastolic BP"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={{ r: 2.5, fill: "#3B82F6" }}
                  activeDot={{ r: 5, fill: "#3B82F6" }}
                />
              </>
            )}

            {selectedMetric === "all" && (
              <Line
                type="monotone"
                dataKey="spo2"
                name="SpO2 (%)"
                stroke="#8B5CF6"
                strokeWidth={1.5}
                dot={{ r: 2, fill: "#8B5CF6" }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
