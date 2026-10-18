"use client";

import React from "react";
import { RiskAssessment } from "@/types";
import { AiLabel, RiskBadge } from "@/components/ui/Badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { AlertTriangle, CheckCircle, ShieldAlert, Info } from "lucide-react";

interface RiskChartProps {
  assessment?: RiskAssessment;
}

export function RiskChart({ assessment }: RiskChartProps) {
  if (!assessment) {
    return (
      <div className="p-6 text-center text-slate-400 text-sm">
        No risk assessment data available for this patient.
      </div>
    );
  }

  const { overallScore, riskLevel, tenYearCvdRiskPercentage, primaryFactors, aiGenerated, clinicianReviewed } =
    assessment;

  // Color mapping based on score
  const getScoreColor = (score: number) => {
    if (score >= 75) return "#EF4444"; // Red / Critical
    if (score >= 50) return "#F59E0B"; // Amber / High
    if (score >= 25) return "#0D9488"; // Teal / Moderate
    return "#10B981"; // Emerald / Low
  };

  const factorChartData = primaryFactors.map((f) => ({
    name: f.name.length > 22 ? `${f.name.substring(0, 20)}...` : f.name,
    fullName: f.name,
    impactValue: f.impact === "critical" ? 95 : f.impact === "high" ? 75 : f.impact === "medium" ? 50 : 25,
    impact: f.impact,
    description: f.description,
    value: f.value,
  }));

  return (
    <div className="space-y-6">
      {/* AI Provenance Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-purple-50/60 rounded-lg border border-purple-200">
        <div className="flex items-center gap-2">
          {aiGenerated && <AiLabel requiresReview={!clinicianReviewed} />}
          <span className="text-xs text-purple-900 font-medium hidden sm:inline">
            Model: {assessment.modelVersion}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {clinicianReviewed ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Reviewed by {assessment.reviewedBy || "Clinician"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Awaiting Clinician Validation
            </span>
          )}
        </div>
      </div>

      {/* Primary Score Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Overall Score */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Composite CVD Risk Score
          </span>
          <div className="relative my-2 flex items-baseline">
            <span
              className="text-4xl font-extrabold tracking-tight"
              style={{ color: getScoreColor(overallScore) }}
            >
              {overallScore}
            </span>
            <span className="text-sm font-semibold text-slate-400 ml-1">/ 100</span>
          </div>
          <RiskBadge level={riskLevel} />
        </div>

        {/* 10-Year ASCVD Risk */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            10-Year ASCVD Risk
          </span>
          <div className="my-2 text-4xl font-extrabold text-navy-900 tracking-tight">
            {tenYearCvdRiskPercentage}%
          </div>
          <span className="text-xs text-slate-500">
            {tenYearCvdRiskPercentage >= 20
              ? "High Lifetime Risk Category"
              : tenYearCvdRiskPercentage >= 7.5
              ? "Intermediate Risk Category"
              : "Borderline / Low Risk Category"}
          </span>
        </div>

        {/* Clinical Summary */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Key Risk Drivers</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
            {primaryFactors.slice(0, 3).map((f, i) => (
              <li key={i} className="truncate">
                <span className="font-medium text-slate-800">{f.name}:</span>{" "}
                {f.value || f.impact}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Factor Contribution Chart */}
      {factorChartData.length > 0 && (
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Risk Factor Attribution Impact
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5" />
              <span>Calculated via feature importance weights</span>
            </div>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={factorChartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={140}
                  stroke="#475569"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-navy-950 text-white p-3 rounded-lg shadow-lg text-xs space-y-1 max-w-xs">
                          <p className="font-bold text-teal-300">{data.fullName}</p>
                          <p className="text-slate-300">{data.description}</p>
                          {data.value && (
                            <p className="text-[11px] text-slate-400">
                              Value: <span className="text-white font-medium">{data.value}</span>
                            </p>
                          )}
                          <p className="text-[10px] text-rose-300 uppercase font-semibold">
                            Impact: {data.impact}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="impactValue" radius={[0, 4, 4, 0]} barSize={16}>
                  {factorChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.impact === "critical"
                          ? "#EF4444"
                          : entry.impact === "high"
                          ? "#F59E0B"
                          : "#0D9488"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
