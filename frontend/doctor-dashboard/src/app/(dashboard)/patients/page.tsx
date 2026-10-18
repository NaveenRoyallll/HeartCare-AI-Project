"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { PatientDemographics } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Table, Column } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge, RiskBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";
import {
  Search,
  Users,
  ShieldCheck,
  Filter,
  UserPlus,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function PatientsListPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientDemographics[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPatients() {
      setIsLoading(true);
      try {
        const data = await api.getPatients({
          search: searchTerm,
          status: statusFilter,
        });
        setPatients(data);
      } catch (err) {
        console.error("Failed to load patients", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPatients();
  }, [searchTerm, statusFilter]);

  const columns: Column<PatientDemographics>[] = [
    {
      header: "Patient Details",
      accessorKey: "fullName",
      sortable: true,
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200">
            {p.firstName[0]}
            {p.lastName[0]}
          </div>
          <div>
            <div className="font-bold text-slate-900 hover:text-navy-900">
              {p.fullName}
            </div>
            <div className="text-xs font-mono text-slate-500">{p.mrn}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Age / Sex",
      accessorKey: "age",
      sortable: true,
      cell: (p) => (
        <span className="text-xs text-slate-700 font-medium">
          {p.age} yrs • {p.gender.charAt(0).toUpperCase() + p.gender.slice(1)}
        </span>
      ),
    },
    {
      header: "Blood Group",
      accessorKey: "bloodGroup",
      cell: (p) => (
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          {p.bloodGroup}
        </span>
      ),
    },
    {
      header: "Monitoring Status",
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
      header: "Consent & Access",
      cell: (p) =>
        p.accessGranted ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-teal-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Consent Granted</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Consent Required</span>
          </span>
        ),
    },
    {
      header: "Last Clinical Visit",
      accessorKey: "lastVisitDate",
      sortable: true,
      cell: (p) => (
        <span className="text-xs text-slate-600 font-mono">
          {formatDate(p.lastVisitDate)}
        </span>
      ),
    },
    {
      header: "Action",
      cell: (p) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/patients/${p.id}`);
          }}
          className="text-xs gap-1"
        >
          <span>Chart</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Monitored Patients
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access restricted to patients with confirmed clinical telemetry consent
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("Patient invitation link generated for medical onboarding.")}
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Invite New Patient
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by patient name, MRN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-600"
            >
              <option value="all">All Patients</option>
              <option value="critical">Critical</option>
              <option value="monitored">Monitored</option>
              <option value="active">Active</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Patients Data Table */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner label="Fetching patient clinical roster..." />
        </div>
      ) : patients.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12 text-slate-300" />}
          title="No patients found"
          description={
            searchTerm
              ? `No active patients matching "${searchTerm}". Check the Medical Record Number or clear filters.`
              : "No patients have currently granted clinical telemetry access."
          }
          action={
            searchTerm ? (
              <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>
                Clear Search Filter
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table
              data={patients}
              columns={columns}
              onRowClick={(p) => router.push(`/patients/${p.id}`)}
              emptyMessage="No matching patients found."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
