"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Doctor, PatientDemographics, AlertItem, ReviewItem } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge, RiskBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, Column } from "@/components/ui/Table";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import {
  Users,
  ClipboardCheck,
  BellRing,
  Activity,
  ArrowRight,
  AlertTriangle,
  HeartPulse,
  Sparkles,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patients, setPatients] = useState<PatientDemographics[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [docData, patData, alertData, revData] = await Promise.all([
          api.getProfile(),
          api.getPatients(),
          api.getAlerts(),
          api.getPendingReviews(),
        ]);
        setDoctor(docData);
        setPatients(patData);
        setAlerts(alertData);
        setReviews(revData);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" label="Loading clinical overview..." />
      </div>
    );
  }

  const criticalAlerts = alerts.filter((a) => a.type === "critical" && !a.acknowledged);
  const urgentReviews = reviews.filter((r) => r.urgency === "urgent");

  // Recent activity table columns
  const patientColumns: Column<PatientDemographics>[] = [
    {
      header: "Patient Name & MRN",
      accessorKey: "fullName",
      sortable: true,
      cell: (p) => (
        <div>
          <div className="font-semibold text-slate-900">{p.fullName}</div>
          <div className="text-xs font-mono text-slate-500">{p.mrn}</div>
        </div>
      ),
    },
    {
      header: "Age / Sex",
      cell: (p) => (
        <span className="text-xs text-slate-600">
          {p.age}y / {p.gender.charAt(0).toUpperCase() + p.gender.slice(1)}
        </span>
      ),
    },
    {
      header: "Clinical Status",
      accessorKey: "status",
      sortable: true,
      cell: (p) => (
        <Badge
          variant={
            p.status === "critical"
              ? "danger"
              : p.status === "monitored"
              ? "secondary"
              : "default"
          }
          size="sm"
        >
          {p.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: "Last Clinical Visit",
      accessorKey: "lastVisitDate",
      sortable: true,
      cell: (p) => (
        <span className="text-xs text-slate-600">{formatDate(p.lastVisitDate)}</span>
      ),
    },
    {
      header: "Action",
      cell: (p) => (
        <Link
          href={`/patients/${p.id}`}
          className="text-xs font-semibold text-teal-600 hover:text-teal-800 inline-flex items-center gap-1"
        >
          <span>View Chart</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
              Department of Cardiology
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-slate-300">
              {doctor?.hospitalAffiliation || "Metro General Heart Center"}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Welcome back, {doctor?.name || "Dr. Sarah Jenkins"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            {criticalAlerts.length > 0
              ? `You have ${criticalAlerts.length} critical patient telemetry alerts and ${urgentReviews.length} diagnostic items requiring your review.`
              : "All telemetry parameters are currently within monitored reference thresholds."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/reviews">
            <Button variant="secondary" size="md">
              <ClipboardCheck className="w-4 h-4 mr-1.5" />
              Review Queue ({reviews.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <Card className="hover:border-slate-300 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Active Patients
              </p>
              <h3 className="text-2xl font-bold text-navy-900 mt-1">
                {patients.length}
              </h3>
              <p className="text-[11px] text-teal-600 font-medium mt-1">
                100% Authorized Consents
              </p>
            </div>
            <div className="p-3 rounded-xl bg-navy-50 text-navy-800">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Reviews */}
        <Card className="hover:border-slate-300 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Pending Reviews
              </p>
              <h3 className="text-2xl font-bold text-teal-700 mt-1">
                {reviews.length}
              </h3>
              <p className="text-[11px] text-amber-600 font-medium mt-1">
                {urgentReviews.length} High Urgency
              </p>
            </div>
            <div className="p-3 rounded-xl bg-teal-50 text-teal-700">
              <ClipboardCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card className="hover:border-slate-300 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Active Alerts
              </p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">
                {alerts.length}
              </h3>
              <p className="text-[11px] text-rose-600 font-medium mt-1">
                {criticalAlerts.length} Unacknowledged Critical
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
              <BellRing className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Continuous Telemetry */}
        <Card className="hover:border-slate-300 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Telemetry Sync
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                Live
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                4 Active Wearables
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
              <Activity className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Critical Alerts Summary + Pending Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Summary Column */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Telemetry Alerts</span>
                </CardTitle>
                <CardDescription>
                  Abnormal thresholds detected by AI monitor
                </CardDescription>
              </div>
              <Link
                href="/alerts"
                className="text-xs font-semibold text-teal-600 hover:text-teal-800"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="pt-0 divide-y divide-slate-100">
              {alerts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No active alerts.
                </div>
              ) : (
                alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="py-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {alert.title}
                      </span>
                      <Badge
                        variant={alert.type === "critical" ? "danger" : "warning"}
                        size="sm"
                      >
                        {alert.type.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {alert.description}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>{alert.patientName}</span>
                      <span>{formatRelativeTime(alert.timestamp)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick AI Clinical Notice */}
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-purple-900">
              <Sparkles className="w-4 h-4 text-purple-700" />
              <span>CardioGuard AI Decision Support Notice</span>
            </div>
            <p className="text-purple-800 leading-relaxed text-[11px]">
              Diagnostic predictions and risk scores are assistive algorithmic outputs. All clinical actions, medication alterations, and diagnoses require qualified clinician sign-off.
            </p>
          </div>
        </div>

        {/* Patients & Telemetry Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Patient Activity</CardTitle>
                <CardDescription>
                  Patients under active remote monitoring & cardiology care
                </CardDescription>
              </div>
              <Link href="/patients">
                <Button variant="outline" size="sm">
                  View All Patients
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <Table
                data={patients}
                columns={patientColumns}
                onRowClick={(p) => router.push(`/patients/${p.id}`)}
                emptyMessage="No monitored patients available."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
