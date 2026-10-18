import React from "react";
import { VitalMeasurement } from "@/types";
import { Table, Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";
import { Heart, Activity, Droplets, Wind, Scale, AlertCircle } from "lucide-react";

interface VitalsListProps {
  vitals: VitalMeasurement[];
}

export function VitalsList({ vitals }: VitalsListProps) {
  const getVitalIcon = (type: string) => {
    switch (type) {
      case "heart_rate":
        return <Heart className="w-4 h-4 text-rose-500" />;
      case "blood_pressure":
        return <Activity className="w-4 h-4 text-navy-600" />;
      case "spo2":
        return <Droplets className="w-4 h-4 text-teal-600" />;
      case "respiratory_rate":
        return <Wind className="w-4 h-4 text-cyan-600" />;
      case "blood_glucose":
        return <Droplets className="w-4 h-4 text-amber-500" />;
      case "weight":
        return <Scale className="w-4 h-4 text-slate-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatVitalType = (type: string) => {
    return type
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const columns: Column<VitalMeasurement>[] = [
    {
      header: "Measurement",
      accessorKey: "type",
      sortable: true,
      cell: (v) => (
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-slate-100">{getVitalIcon(v.type)}</div>
          <div>
            <div className="font-semibold text-slate-900">{formatVitalType(v.type)}</div>
            {v.notes && <div className="text-[11px] text-slate-500">{v.notes}</div>}
          </div>
        </div>
      ),
    },
    {
      header: "Reading",
      sortable: true,
      cell: (v) => (
        <div className="flex items-baseline gap-1">
          <span className="font-mono font-bold text-base text-slate-900">
            {v.type === "blood_pressure" ? `${v.value}/${v.secondaryValue}` : v.value}
          </span>
          <span className="text-xs text-slate-500 font-medium">{v.unit}</span>
        </div>
      ),
    },
    {
      header: "Evaluation",
      sortable: true,
      cell: (v) =>
        v.isAbnormal ? (
          <Badge variant="danger" size="sm" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Abnormal
          </Badge>
        ) : (
          <Badge variant="success" size="sm">
            Normal
          </Badge>
        ),
    },
    {
      header: "Telemetry Source",
      accessorKey: "source",
      sortable: true,
      cell: (v) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium border border-slate-200">
          {v.source}
        </span>
      ),
    },
    {
      header: "Recorded At",
      accessorKey: "timestamp",
      sortable: true,
      cell: (v) => (
        <span className="text-xs font-mono text-slate-600">
          {formatDateTime(v.timestamp)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Displaying {vitals.length} recorded measurements</span>
        <span className="italic">All readings synced with verified hardware logs</span>
      </div>
      <Table data={vitals} columns={columns} emptyMessage="No telemetry vitals recorded." />
    </div>
  );
}
