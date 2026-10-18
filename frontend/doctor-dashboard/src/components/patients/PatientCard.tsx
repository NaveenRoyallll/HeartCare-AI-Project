import React from "react";
import Link from "next/link";
import { PatientDemographics } from "@/types";
import { RiskBadge, Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { ChevronRight, Calendar, Phone, Activity, ShieldCheck, ShieldAlert } from "lucide-react";

interface PatientCardProps {
  patient: PatientDemographics;
  riskLevel?: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
}

export function PatientCard({ patient, riskLevel = "MODERATE" }: PatientCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all hover:border-slate-300 flex flex-col justify-between group">
      <div>
        {/* Header row: Name, MRN & Risk */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 group-hover:text-navy-900 transition-colors">
                {patient.fullName}
              </h4>
              {patient.accessGranted ? (
                <span title="Consent verified - Access granted">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                </span>
              ) : (
                <span title="Consent pending">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="font-mono">{patient.mrn}</span>
              <span>•</span>
              <span>{patient.age}y {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}</span>
              <span>•</span>
              <span>{patient.bloodGroup}</span>
            </div>
          </div>
          <RiskBadge level={riskLevel} />
        </div>

        {/* Patient Status Pill */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge
            variant={
              patient.status === "critical"
                ? "danger"
                : patient.status === "monitored"
                ? "secondary"
                : "default"
            }
            size="sm"
          >
            {patient.status.toUpperCase()}
          </Badge>
          <span className="text-[11px] text-slate-400">
            Physician: {patient.primaryPhysicianName}
          </span>
        </div>

        {/* Quick details */}
        <div className="space-y-1.5 text-xs text-slate-600 py-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Last Clinical Visit:</span>
            </span>
            <span className="font-medium text-slate-800">
              {formatDate(patient.lastVisitDate)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Phone className="w-3.5 h-3.5" />
              <span>Contact:</span>
            </span>
            <span className="font-mono text-slate-700">{patient.phone}</span>
          </div>
        </div>
      </div>

      {/* Action link */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-teal-600 group-hover:text-teal-700 flex items-center gap-1">
          <Activity className="w-3.5 h-3.5" />
          <span>Clinical Profile & Telemetry</span>
        </span>
        <Link
          href={`/patients/${patient.id}`}
          className="inline-flex items-center justify-center p-1.5 rounded-md bg-slate-50 text-slate-600 group-hover:bg-navy-900 group-hover:text-white transition-colors"
          aria-label={`View clinical records for ${patient.fullName}`}
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
