"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import { ReviewItem } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, AiLabel } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/utils";
import {
  ClipboardCheck,
  HeartPulse,
  FlaskConical,
  Activity,
  AlertCircle,
  CheckCircle2,
  Filter,
  FileCheck2,
  ExternalLink,
} from "lucide-react";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "ecg" | "lab" | "risk">("all");
  const [activeReviewItem, setActiveReviewItem] = useState<ReviewItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    async function loadReviews() {
      setIsLoading(true);
      try {
        const data = await api.getPendingReviews();
        setReviews(data);
      } catch (err) {
        console.error("Failed to load reviews", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReviews();
  }, []);

  const handleOpenReviewModal = (item: ReviewItem) => {
    setActiveReviewItem(item);
    setReviewNotes("");
  };

  const handleSubmitReview = async (approved: boolean) => {
    if (!activeReviewItem) return;
    setIsSubmitting(true);
    try {
      await api.submitReview(activeReviewItem.id, {
        notes: reviewNotes || (approved ? "Clinically verified and accepted into chart." : "Flagged for further investigation."),
        approved,
      });

      // Remove item from pending list
      setReviews((prev) => prev.filter((r) => r.id !== activeReviewItem.id));
      setSuccessBanner(
        `Item "${activeReviewItem.title}" successfully reviewed and signed.`
      );
      setTimeout(() => setSuccessBanner(null), 4000);
      setActiveReviewItem(null);
    } catch (err) {
      console.error("Review submit error", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (selectedFilter === "all") return true;
    return r.type === selectedFilter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ecg":
        return <HeartPulse className="w-5 h-5 text-rose-600" />;
      case "lab":
        return <FlaskConical className="w-5 h-5 text-blue-600" />;
      case "risk":
        return <Activity className="w-5 h-5 text-amber-600" />;
      default:
        return <ClipboardCheck className="w-5 h-5 text-teal-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Pending Diagnostic Reviews
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Clinician sign-off queue for algorithmic classifications, wearable ECGs, and lab biomarker reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            {reviews.length} Awaiting Clinician Action
          </span>
        </div>
      </div>

      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <Card>
        <CardContent className="p-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium text-slate-600">
              <button
                onClick={() => setSelectedFilter("all")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  selectedFilter === "all"
                    ? "bg-white text-navy-900 font-bold shadow-xs"
                    : "hover:text-slate-900"
                }`}
              >
                All ({reviews.length})
              </button>
              <button
                onClick={() => setSelectedFilter("ecg")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  selectedFilter === "ecg"
                    ? "bg-white text-navy-900 font-bold shadow-xs"
                    : "hover:text-slate-900"
                }`}
              >
                ECG Strips
              </button>
              <button
                onClick={() => setSelectedFilter("lab")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  selectedFilter === "lab"
                    ? "bg-white text-navy-900 font-bold shadow-xs"
                    : "hover:text-slate-900"
                }`}
              >
                Lab Panels
              </button>
              <button
                onClick={() => setSelectedFilter("risk")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  selectedFilter === "risk"
                    ? "bg-white text-navy-900 font-bold shadow-xs"
                    : "hover:text-slate-900"
                }`}
              >
                Risk Scores
              </button>
            </div>
          </div>
          <span className="text-xs text-slate-400 italic">
            All reviews require explicit physician authentication
          </span>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner label="Loading clinical review queue..." />
        </div>
      ) : filteredReviews.length === 0 ? (
        <EmptyState
          icon={<FileCheck2 className="w-12 h-12 text-teal-500 stroke-[1.5]" />}
          title="Review Queue Cleared"
          description="All incoming AI classifications, ECG strips, and lab panels have been clinically signed off."
        />
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((item) => (
            <Card key={item.id} className="hover:border-slate-300 transition-all">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Info */}
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">
                          {item.title}
                        </h3>
                        <Badge
                          variant={item.urgency === "urgent" ? "danger" : "default"}
                          size="sm"
                        >
                          {item.urgency.toUpperCase()}
                        </Badge>
                        {item.isAiGenerated && <AiLabel requiresReview={true} />}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                        {item.summary}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="font-semibold text-slate-700">
                          Patient: {item.patientName} ({item.mrn})
                        </span>
                        <span>•</span>
                        <span>Source: {item.source}</span>
                        <span>•</span>
                        <span className="font-mono">{formatDateTime(item.submittedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenReviewModal(item)}
                      className="text-xs whitespace-nowrap"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />
                      Review & Sign Off
                    </Button>
                    <Link
                      href={`/patients/${item.patientId}`}
                      className="text-xs text-teal-600 hover:text-teal-800 font-medium inline-flex items-center gap-1"
                    >
                      <span>Patient Chart</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {activeReviewItem && (
        <Modal
          isOpen={!!activeReviewItem}
          onClose={() => setActiveReviewItem(null)}
          title={`Clinical Review: ${activeReviewItem.title}`}
          description={`Patient: ${activeReviewItem.patientName} (${activeReviewItem.mrn}) • Origin: ${activeReviewItem.source}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveReviewItem(null)}
              >
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-700 border-amber-300 hover:bg-amber-50"
                  isLoading={isSubmitting}
                  onClick={() => handleSubmitReview(false)}
                >
                  Flag for Revision
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  onClick={() => handleSubmitReview(true)}
                >
                  Approve & Sign Clinical Record
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* AI Warning Box */}
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs space-y-1">
              <div className="flex items-center gap-2">
                <AiLabel requiresReview={true} />
                <span className="font-semibold text-purple-900">
                  Algorithmic Diagnostic Hypothesis
                </span>
              </div>
              <p className="text-purple-800 leading-relaxed pt-1">
                {activeReviewItem.summary}
              </p>
            </div>

            {/* Clinician Reviewer Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Clinician Assessment & Attestation Notes
              </label>
              <textarea
                rows={4}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter clinical rationale, confirmation of rhythm strip morphology, or corrective diagnosis..."
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-600"
              />
            </div>

            <p className="text-[11px] text-slate-500 italic">
              By clicking &quot;Approve &amp; Sign Clinical Record&quot;, you certify that you have reviewed the diagnostic waveforms/values and take clinical responsibility for the chart entry.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
