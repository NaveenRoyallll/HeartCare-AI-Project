"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Doctor } from "@/types";
import {
  Menu,
  Bell,
  Search,
  LogOut,
  User,
  Shield,
  ChevronDown,
} from "lucide-react";

interface HeaderProps {
  doctor?: Doctor | null;
  onOpenMobileMenu?: () => void;
  title?: string;
  subtitle?: string;
}

export function Header({
  doctor,
  onOpenMobileMenu,
  title,
  subtitle,
}: HeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await api.logout();
    router.push("/login");
  };

  const doctorInitials = doctor?.name
    ? doctor.name
        .replace(/^Dr\.\s*/i, "")
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "DR";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200">
      {/* Left side: hamburger for mobile + page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 text-slate-600 rounded-lg lg:hidden hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && (
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Right side: quick stats / notifications / user profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick status pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Telemetry Active</span>
        </div>

        {/* Alerts Bell */}
        <button
          onClick={() => router.push("/alerts")}
          className="relative p-2 text-slate-500 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors"
          title="Active Alerts"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Doctor Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-navy-900 text-teal-300 flex items-center justify-center font-bold text-xs ring-2 ring-slate-100">
              {doctorInitials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-none">
                {doctor?.name || "Dr. Sarah Jenkins"}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {doctor?.specialty || "Cardiologist"}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg border border-slate-200 py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">
                    {doctor?.name || "Dr. Sarah Jenkins"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {doctor?.email || "dr.jenkins@cardioguard.ai"}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-teal-700 font-medium">
                    <Shield className="w-3 h-3" />
                    <span>Lic: {doctor?.licenseNumber || "MED-CA-892410"}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push("/settings");
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Doctor Profile & Security</span>
                </button>

                <div className="border-t border-slate-100 my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
