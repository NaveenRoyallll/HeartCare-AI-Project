"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import { AlertItem } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/utils";
import {
  BellRing,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Filter,
  ExternalLink,
  Heart,
  Pill,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "unack">("unack");
  const [isLoading, setIsLoading] = useState(true);
  const [ackLoadingId, setAckLoadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      setIsLoading(true);
      try {
        const data = await api.getAlerts();
        setAlerts(data);
      } catch (err) {
        console.error("Failed to load alerts", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAlerts();
  }, []);

  const handleAcknowledge = async (alertId: string) => {
    setAckLoadingId(alertId);
    try {
      const updated = await api.acknowledgeAlert(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? updated : a))
      );
    } catch (err) {
      console.error("Failed to acknowledge alert", err);
    } finally {
      setAckLoadingId(null);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "unack") return !a.acknowledged;
    if (filter === "critical") return a.type === "critical";
    if (filter === "warning") return a.type === "warning";
    return true;
  });

  const getAlertIcon = (category: string, type: string) => {
    if (type === "critical") {
      return <AlertCircle className="w-5 h-5 text-red-600 animate-pulse" />;
    }
    switch (category) {
      case "vitals":
        return <Heart className="w-5 h-5 text-amber-600" />;
      case "medication":
        return <Pill className="w-5 h-5 text-purple-600" />;
      case "risk_elevation":
        return <TrendingUp className="w-5 h-5 text-orange-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    }
  };

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;
  const criticalCount = alerts.filter((a) => a.type === "critical" && !a.acknowledged).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Clinical Telemetry Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time threshold breaches, hemodynamic excursions, and adherence alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
              {criticalCount} Critical Immediate Attention
            </span>
          )}
        </div>
      </div>

      {/* Filter Options */}
      <Card>
        <CardContent className="p-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium text-slate-600">
              <button
                onClick={() => setFilter("unack")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  filter === "unack"
                    ? "bg-white text-navy-900 font-bold shadow-xs"
                    : "hover:text-slate-900"
                }`}
              >
                Needs Action ({unacknowledgedCount})
              </button>
              <button
                onClick={() => setFilter("critical")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  filter === "critical"
                    ? "bg-white text-navy-900 font-bold shadow-xs"
                    : "hover:text-slate-900"
                }`}
              >
                Critical Excursions
              </button>
              <button
                onClick={() => setFilter("warning")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  filter === "warning"
                    ? "bg-white text-navy-900 font-bold shadow-xs"
                    : "hover:text-slate-900"
                }`}
              >
                Trend Warnings
              </button>
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  filter === "all"
                    ? "bg-white text-navy-900 font-bold shadow-xs"
                    : "hover:text-slate-900"
                }`}
              >
                All Alerts History ({alerts.length})
              </button>
            </div>
          </div>
          <span className="text-xs text-slate-400">
            Sorted by urgency and timestamp
          </span>
        </CardContent>
      </Card>

      {/* Alert Cards */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner label="Fetching active telemetry alerts..." />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-12 h-12 text-teal-600" />}
          title="No matching telemetry alerts"
          description={
            filter === "unack"
              ? "No unacknowledged critical or warning alerts are recorded for authorized patients."
              : "No telemetry alerts match the selected filter criteria."
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`transition-all ${
                alert.type === "critical" && !alert.acknowledged
                  ? "border-red-300 bg-red-50/20 shadow-sm"
                  : "hover:border-slate-300"
              }`}
            >
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Info */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl border shrink-0 ${
                        alert.type === "critical"
                          ? "bg-red-50 border-red-200"
                          : "bg-amber-50 border-amber-200"
                      }`}
                    >
                      {getAlertIcon(alert.category, alert.type)}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {alert.title}
                        </span>
                        <Badge
                          variant={alert.type === "critical" ? "danger" : "warning"}
                          size="sm"
                        >
                          {alert.type.toUpperCase()}
                        </Badge>
                        {alert.value && (
                          <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                            {alert.value}
                          </span>
                        )}
                        {alert.acknowledged && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Acknowledged by {alert.acknowledgedBy}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                        {alert.description}
                      </p>

                      {alert.actionRequired && (
                        <div className="p-2 rounded-md bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 font-medium">
                          <span className="font-bold">Protocol Recommendation: </span>
                          {alert.actionRequired}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="font-semibold text-slate-700">
                          Patient: {alert.patientName} ({alert.mrn})
                        </span>
                        <span>•</span>
                        <span>Source: {alert.source}</span>
                        <span>•</span>
                        <span className="font-mono">{formatDateTime(alert.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0">
                    {!alert.acknowledged ? (
                      <Button
                        variant={alert.type === "critical" ? "danger" : "primary"}
                        size="sm"
                        isLoading={ackLoadingId === alert.id}
                        onClick={() => handleAcknowledge(alert.id)}
                        className="text-xs whitespace-nowrap shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        Acknowledge Alert
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400 font-mono">
                        Ack: {formatDateTime(alert.acknowledgedAt)}
                      </span>
                    )}
                    <Link
                      href={`/patients/${alert.patientId}`}
                      className="text-xs text-teal-600 hover:text-teal-800 font-semibold inline-flex items-center gap-1"
                    >
                      <span>Open Patient Chart</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
