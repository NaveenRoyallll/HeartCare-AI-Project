"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { PatientDetail, ClinicalNote } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge, RiskBadge, AiLabel } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, Column } from "@/components/ui/Table";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { VitalChart } from "@/components/charts/VitalChart";
import { RiskChart } from "@/components/charts/RiskChart";
import { VitalsList } from "@/components/patients/VitalsList";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  HeartPulse,
  Activity,
  FileText,
  FlaskConical,
  Pill,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  PlusCircle,
  Calendar,
  Phone,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
} from "lucide-react";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patientData, setPatientData] = useState<PatientDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"vitals" | "assessment" | "risk" | "diagnostics" | "medications" | "notes">("vitals");
  const [isLoading, setIsLoading] = useState(true);

  // New Note Modal state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteCategory, setNoteCategory] = useState("Progress Note");
  const [noteContent, setNoteContent] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const detail = await api.getPatientById(patientId);
        setPatientData(detail);
      } catch (err) {
        console.error("Failed to load patient detail", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [patientId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    setIsSubmittingNote(true);
    try {
      const created = await api.addClinicalNote(patientId, {
        title: noteTitle,
        category: noteCategory,
        content: noteContent,
      });

      if (patientData) {
        setPatientData({
          ...patientData,
          notes: [created, ...patientData.notes],
        });
      }
      setIsNoteModalOpen(false);
      setNoteTitle("");
      setNoteContent("");
    } catch (err) {
      console.error("Failed to save clinical note", err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" label="Retrieving encrypted clinical chart..." />
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-600">Patient records could not be located.</p>
        <Button variant="outline" onClick={() => router.push("/patients")}>
          Back to Patients
        </Button>
      </div>
    );
  }

  const { demographics, conditions, medications, currentRisk, recentVitals, labs, ecgs, notes, activeAlerts, assessments, assessmentSourceMeasurements } =
    patientData;

  // Access check
  if (!demographics.accessGranted) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-amber-200 rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Patient Consent Restated</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          The medical records and live telemetry for {demographics.fullName} ({demographics.mrn}) are locked. Under HIPAA & CardioGuard AI policy, remote health telemetry access requires active patient authorization.
        </p>
        <Button variant="outline" onClick={() => router.push("/patients")}>
          Return to Monitored Patients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and quick navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/patients")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-navy-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Monitored Patients</span>
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsNoteModalOpen(true)}
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Add Review Note
          </Button>
        </div>
      </div>

      {/* Patient Header Card */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Demographics */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-navy-900 text-teal-300 flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                {demographics.firstName[0]}
                {demographics.lastName[0]}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">
                    {demographics.fullName}
                  </h2>
                  {currentRisk ? <RiskBadge level={currentRisk.riskLevel} /> : (
                    <Badge variant="default" size="sm">NOT ASSESSED</Badge>
                  )}
                  <Badge
                    variant={demographics.status === "critical" ? "danger" : "secondary"}
                    size="sm"
                  >
                    {demographics.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                    {demographics.mrn}
                  </span>
                  <span>DOB: {formatDate(demographics.dateOfBirth)} ({demographics.age}y)</span>
                  <span>Sex: {demographics.gender.toUpperCase()}</span>
                  <span>Blood: {demographics.bloodGroup}</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {demographics.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Emergency: {demographics.emergencyContact.name} ({demographics.emergencyContact.relationship} - {demographics.emergencyContact.phone})
                  </span>
                </div>
              </div>
            </div>

            {/* Consent & Physician Info */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 gap-2">
              <div className="flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Patient Telemetry Consent Active</span>
              </div>
              <div className="text-right text-xs text-slate-500">
                <span>Attending: </span>
                <span className="font-semibold text-slate-800">
                  {demographics.primaryPhysicianName}
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                Last In-Clinic Visit: {formatDate(demographics.lastVisitDate)}
              </div>
            </div>
          </div>

          {/* Active Alerts Bar if any */}
          {activeAlerts.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-bold">Active Telemetry Alert:</span>
                <span>{activeAlerts[0].title} — {activeAlerts[0].description}</span>
              </div>
              <span className="font-mono text-[11px] text-red-600 shrink-0">
                {formatDateTime(activeAlerts[0].timestamp)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clinical Tabs Bar */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 overflow-x-auto text-sm font-medium">
          <button
            onClick={() => setActiveTab("assessment")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "assessment"
                ? "border-navy-900 text-navy-900 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Assessment History ({assessments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("vitals")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "vitals"
                ? "border-navy-900 text-navy-900 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Vitals & Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab("risk")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "risk"
                ? "border-navy-900 text-navy-900 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>AI Risk Stratification</span>
          </button>

          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "diagnostics"
                ? "border-navy-900 text-navy-900 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>ECG & Lab Reports</span>
          </button>

          <button
            onClick={() => setActiveTab("medications")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "medications"
                ? "border-navy-900 text-navy-900 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>Medications & Adherence</span>
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "notes"
                ? "border-navy-900 text-navy-900 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Clinical Notes ({notes.length})</span>
          </button>
        </nav>
      </div>

      {/* TAB 1: VITALS & TELEMETRY */}
      {activeTab === "vitals" && (
        <div className="space-y-6">
          {/* Vitals Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Heart Rate</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-rose-600">
                  {patientData.vitalsSummary.lastHeartRate?.value ?? "—"}
                </span>
                <span className="text-xs text-slate-400 font-medium">bpm</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {patientData.vitalsSummary.lastHeartRate?.source}
              </span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Blood Pressure</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-navy-900">
                  {patientData.vitalsSummary.lastBloodPressure?.value}/
                  {patientData.vitalsSummary.lastBloodPressure?.secondaryValue}
                </span>
                <span className="text-xs text-slate-400 font-medium">mmHg</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {patientData.vitalsSummary.lastBloodPressure?.source}
              </span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Oxygen Saturation</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-teal-600">
                  {patientData.vitalsSummary.lastSpO2?.value ?? "—"}
                </span>
                <span className="text-xs text-slate-400 font-medium">%</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {patientData.vitalsSummary.lastSpO2?.source}
              </span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Respiratory Rate</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-cyan-700">
                  {patientData.vitalsSummary.lastRespiratoryRate?.value ?? "—"}
                </span>
                <span className="text-xs text-slate-400 font-medium">br/min</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {patientData.vitalsSummary.lastRespiratoryRate?.source}
              </span>
            </div>
          </div>

          {/* Interactive Recharts Line Chart */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Continuous Telemetry Trends</CardTitle>
                <CardDescription>
                  Streaming data with threshold breach indicators & device provenance
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <VitalChart vitals={recentVitals} height={340} />
            </CardContent>
          </Card>

          {/* Vitals Records Table */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Telemetry Log History</CardTitle>
                <CardDescription>
                  Verified sensor measurements showing source and timestamp
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <VitalsList vitals={recentVitals} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: UNIFIED ASSESSMENT HISTORY */}
      {activeTab === "assessment" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Unified cardiovascular assessment history</CardTitle>
              <CardDescription>
                Backend records include acute triage, longitudinal observations, source measurements, missing data, uncertainty, and recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assessments.length === 0 ? (
                <p className="text-sm text-slate-500">No assessment has been recorded for this authorized patient.</p>
              ) : assessments.map((assessment) => (
                <div key={assessment.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900">
                        {assessment.assessment_kind === "acute_triage" ? "Acute emergency triage" : "Longitudinal cardiovascular review"}
                      </p>
                      <p className="text-xs text-slate-500">{formatDateTime(assessment.created_at)}</p>
                    </div>
                    <Badge variant={assessment.classification === "EMERGENCY" || assessment.classification === "higher_attention" ? "danger" : "secondary"} size="sm">
                      {assessment.classification.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">Data quality: <strong>{assessment.data_quality}</strong></p>
                  {assessment.observations_considered.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">Observations considered</p>
                      <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                        {assessment.observations_considered.map((observation, index) => (
                          <li key={`${assessment.id}-observation-${index}`}>
                            {observation.name}: {String(observation.value ?? "recorded")}
                            {observation.measured_at ? ` (${formatDateTime(observation.measured_at)})` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {assessment.missing_inputs.length > 0 && (
                    <p className="text-sm text-amber-700"><strong>Missing:</strong> {assessment.missing_inputs.join(", ")}</p>
                  )}
                  {assessment.uncertainty.length > 0 && (
                    <p className="text-sm text-amber-700"><strong>Uncertainty:</strong> {assessment.uncertainty.join(" ")}</p>
                  )}
                  {assessment.recommendations.length > 0 && (
                    <div><p className="text-xs font-bold uppercase text-slate-500">Recommended next steps</p><ul className="list-disc pl-5 text-sm text-slate-700">{assessment.recommendations.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  )}
                  {assessment.emergency_guidance.length > 0 && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800"><strong>Emergency guidance:</strong> {assessment.emergency_guidance.join(" ")}</div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Relevant source measurements</CardTitle>
              <CardDescription>Measurements are shown with their original timestamp and source.</CardDescription>
            </CardHeader>
            <CardContent>
              {assessmentSourceMeasurements.length === 0 ? (
                <p className="text-sm text-slate-500">No source measurements are available.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {assessmentSourceMeasurements.map((measurement) => (
                    <div key={measurement.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                      <strong>{measurement.type.replaceAll("_", " ")}</strong>: {measurement.value}{measurement.secondaryValue !== undefined ? `/${measurement.secondaryValue}` : ""} {measurement.unit}
                      <div className="text-xs text-slate-500">{formatDateTime(measurement.timestamp)} · {measurement.source}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: AI RISK STRATIFICATION */}
      {activeTab === "risk" && currentRisk && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Multivariate Cardiovascular Risk Assessment</CardTitle>
                <CardDescription>
                  Predictive risk model derived from ECG morphology, hemodynamics, and biomarker trends
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <RiskChart assessment={currentRisk} />

              {/* AI Clinical Recommendations with required label */}
              <div className="mt-6 p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AiLabel requiresReview={true} />
                    <h4 className="text-xs font-bold text-purple-900 uppercase">
                      Algorithmic Recommendations
                    </h4>
                  </div>
                  <span className="text-[11px] text-purple-700">
                    Generated: {formatDateTime(currentRisk.generatedAt)}
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs text-purple-950 list-disc list-inside">
                  {currentRisk.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
                <p className="text-[10px] text-purple-700 italic pt-1 border-t border-purple-200">
                  Note: Clinician judgment takes precedence. AI recommendations are assistive aids and must not replace professional clinical diagnostic evaluation.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Risk History Card */}
          <Card>
            <CardHeader>
              <CardTitle>Historical Risk Progression</CardTitle>
              <CardDescription>Past risk evaluations and physician confirmations</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 p-0">
              {patientData.riskHistory.map((hist) => (
                <div key={hist.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <RiskBadge level={hist.riskLevel} />
                      <span className="text-sm font-bold text-slate-800">
                        Score: {hist.overallScore}/100
                      </span>
                      <span className="text-xs text-slate-500">
                        (ASCVD {hist.tenYearCvdRiskPercentage}%)
                      </span>
                    </div>
                    {hist.reviewNotes && (
                      <p className="text-xs text-slate-600 mt-1 italic">
                        &quot;{hist.reviewNotes}&quot;
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-slate-500">Evaluated on {formatDate(hist.generatedAt)}</span>
                    <div className="text-teal-700 font-medium">
                      Reviewed by: {hist.reviewedBy || "Attending Physician"}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: DIAGNOSTICS (ECG & LABS) */}
      {activeTab === "diagnostics" && (
        <div className="space-y-6">
          {/* ECG Records */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recorded ECG Rhythm Strips</CardTitle>
                <CardDescription>
                  Wearable and clinical 6/12-lead ECG captures with neural rhythm analysis
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {ecgs.map((ecg) => (
                <div
                  key={ecg.id}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {ecg.leads}-Lead ECG Strip
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-200 font-medium text-slate-700">
                          {ecg.sourceDevice}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          Recorded: {formatDateTime(ecg.recordedAt)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Interpretation: <span className="font-semibold text-slate-900">{ecg.rhythmInterpretation}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {ecg.clinicianReviewed ? (
                        <span className="inline-flex items-center gap-1 text-xs text-teal-700 font-semibold bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Reviewed by {ecg.reviewedBy}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Requires Clinician Review
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Intervals row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-400">Heart Rate:</span>
                      <p className="font-bold text-slate-800">{ecg.heartRateBpm} bpm</p>
                    </div>
                    <div>
                      <span className="text-slate-400">PR Interval:</span>
                      <p className="font-bold text-slate-800">{ecg.prIntervalMs} ms</p>
                    </div>
                    <div>
                      <span className="text-slate-400">QRS Duration:</span>
                      <p className="font-bold text-slate-800">{ecg.qrsDurationMs} ms</p>
                    </div>
                    <div>
                      <span className="text-slate-400">QTc Interval:</span>
                      <p className="font-bold text-slate-800">{ecg.qtcIntervalMs} ms</p>
                    </div>
                  </div>

                  {/* AI Rhythm Classification Banner */}
                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <AiLabel requiresReview={!ecg.clinicianReviewed} />
                      <span className="font-semibold text-purple-900">
                        Classification: {ecg.aiClassification.condition}
                      </span>
                      <span className="text-purple-600">
                        (Confidence: {Math.round(ecg.aiClassification.confidenceScore * 100)}%)
                      </span>
                    </div>
                    <span className="text-[10px] text-purple-700">
                      Generated at {formatDateTime(ecg.aiClassification.generatedAt)}
                    </span>
                  </div>

                  {/* Doctor's note if reviewed */}
                  {ecg.doctorNotes && (
                    <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-800">Clinician Note: </span>
                      {ecg.doctorNotes}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Lab Reports */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Laboratory Panels & Biomarkers</CardTitle>
                <CardDescription>Cardiac Troponin, Lipid profile, and metabolic markers</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {labs.map((lab) => (
                <div key={lab.id} className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{lab.testName}</h4>
                      <p className="text-xs text-slate-500">
                        Lab Source: {lab.sourceLab} • Collected: {formatDateTime(lab.collectedAt)}
                      </p>
                    </div>
                    <div>
                      {lab.clinicianReviewed ? (
                        <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2.5 py-1 rounded border border-teal-200 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Reviewed
                        </span>
                      ) : (
                        <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded border border-amber-200 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Pending Review
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lab Results Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-semibold">
                        <tr>
                          <th className="p-2">Analyte / Parameter</th>
                          <th className="p-2">Observed Value</th>
                          <th className="p-2">Standard Range</th>
                          <th className="p-2">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lab.results.map((res, i) => (
                          <tr key={i} className={res.isAbnormal ? "bg-red-50/40" : ""}>
                            <td className="p-2 font-medium text-slate-800">{res.parameter}</td>
                            <td className="p-2 font-mono font-bold text-slate-900">
                              {res.value} {res.unit}
                            </td>
                            <td className="p-2 text-slate-500">{res.referenceRange}</td>
                            <td className="p-2">
                              {res.isAbnormal ? (
                                <span className="text-red-700 font-bold">ABNORMAL</span>
                              ) : (
                                <span className="text-emerald-700 font-medium">Normal</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* AI Lab Summary with required badge */}
                  {lab.aiSummary && (
                    <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <AiLabel requiresReview={!lab.clinicianReviewed} />
                        <span className="text-[11px] text-purple-700">
                          Analysis Model: {lab.aiSummary.modelName}
                        </span>
                      </div>
                      <p className="text-purple-950 leading-relaxed pt-1">
                        {lab.aiSummary.summaryText}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: MEDICATIONS & ADHERENCE */}
      {activeTab === "medications" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Prescribed Cardiology Regimen</CardTitle>
                <CardDescription>Active medications with smart bottle / app adherence tracking</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 p-0">
              {medications.map((med) => (
                <div key={med.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{med.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-700 font-semibold">
                        {med.dosage}
                      </span>
                      <Badge variant={med.status === "active" ? "secondary" : "default"} size="sm">
                        {med.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-600">
                      Route: {med.route} • Frequency: {med.frequency}
                    </div>
                    {med.instructions && (
                      <p className="text-xs text-slate-500 italic">Instructions: {med.instructions}</p>
                    )}
                    <p className="text-[11px] text-slate-400">
                      Prescribed by {med.prescribedBy} on {formatDate(med.startDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <span className="text-xs text-slate-500">30-Day Adherence</span>
                      <div className="flex items-baseline justify-end gap-1">
                        <span
                          className={`text-xl font-black ${
                            med.adherencePercentage >= 90
                              ? "text-emerald-600"
                              : med.adherencePercentage >= 75
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {med.adherencePercentage}%
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {med.missedDosesLast30Days} missed dose(s)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: CLINICAL NOTES & REVIEWS */}
      {activeTab === "notes" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Attending Physician Progress Notes</h3>
            <Button variant="primary" size="sm" onClick={() => setIsNoteModalOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-1.5" />
              New Progress Note
            </Button>
          </div>

          <div className="space-y-4">
            {notes.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">
                No clinical notes recorded yet for this patient.
              </p>
            ) : (
              notes.map((note) => (
                <Card key={note.id}>
                  <CardHeader className="py-3 bg-slate-50/70 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{note.title}</span>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-navy-100 text-navy-800">
                          {note.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Author: {note.doctorName} • {formatDateTime(note.createdAt)}
                      </p>
                    </div>
                    {note.signed && (
                      <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Digitally Signed
                      </span>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Review Note Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Record Clinical Review Note"
        description={`Formal clinician documentation for ${demographics.fullName} (${demographics.mrn})`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmittingNote}
              onClick={handleAddNote}
            >
              Sign & Save Note
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddNote} className="space-y-4">
          <div>
            <Input
              label="Note Title"
              placeholder="e.g. Follow-up on Wearable Tachycardia Alert"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Note Category
            </label>
            <select
              value={noteCategory}
              onChange={(e) => setNoteCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-600"
            >
              <option value="Progress Note">Progress Note</option>
              <option value="Consultation">Consultation</option>
              <option value="Review">Telemetry & ECG Review</option>
              <option value="Discharge Summary">Discharge Summary</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Clinical Assessment & Plan
            </label>
            <textarea
              rows={5}
              placeholder="Document clinical observations, correlation with telemetry waveforms, changes to medication dosage, and follow-up plan..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-600"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Digital Signature: </span>
            This note will be timestamped and permanently attributed to your clinical credentials.
          </div>
        </form>
      </Modal>
    </div>
  );
}
