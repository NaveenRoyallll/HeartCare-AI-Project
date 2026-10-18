"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/ui/Sidebar";
import { Header } from "@/components/ui/Header";
import { api } from "@/services/api";
import { Doctor } from "@/types";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);

  useEffect(() => {
    async function loadDoctor() {
      try {
        const doc = await api.getProfile();
        setDoctor(doc);
        const [reviews, alerts] = await Promise.all([
          api.getPendingReviews(),
          api.getAlerts(),
        ]);
        setPendingReviewsCount(reviews.length);
        setActiveAlertsCount(alerts.filter((alert) => !alert.acknowledged).length);
      } catch (err) {
        console.error("Failed to load doctor profile", err);
      }
    }
    loadDoctor();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        pendingReviewsCount={pendingReviewsCount}
        activeAlertsCount={activeAlertsCount}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header
          doctor={doctor}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        {DEMO_MODE && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-800">
            Demo mode is enabled. Data shown here may be synthetic and is not connected to clinical records.
          </div>
        )}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
