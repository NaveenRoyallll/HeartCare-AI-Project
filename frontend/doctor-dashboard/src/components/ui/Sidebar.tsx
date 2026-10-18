"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BellRing,
  Settings,
  HeartPulse,
  ShieldCheck,
} from "lucide-react";

interface SidebarProps {
  className?: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  pendingReviewsCount?: number;
  activeAlertsCount?: number;
}

export function Sidebar({
  className,
  isMobileOpen = false,
  onCloseMobile,
  pendingReviewsCount = 3,
  activeAlertsCount = 2,
}: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: "Overview",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      name: "Patients",
      href: "/patients",
      icon: Users,
      active: pathname.startsWith("/patients"),
    },
    {
      name: "Reviews",
      href: "/reviews",
      icon: ClipboardCheck,
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined,
      badgeColor: "bg-teal-100 text-teal-800",
      active: pathname.startsWith("/reviews"),
    },
    {
      name: "Alerts",
      href: "/alerts",
      icon: BellRing,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
      badgeColor: "bg-red-100 text-red-700 animate-pulse",
      active: pathname.startsWith("/alerts"),
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      active: pathname.startsWith("/settings"),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-navy-900 text-slate-200 flex flex-col border-r border-navy-800 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Brand header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-navy-800/80 bg-navy-950/50">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-500 text-navy-950 shadow-md">
            <HeartPulse className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">
                CardioGuard
              </span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Doctor Portal</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Clinical Console
          </div>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                  item.active
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-navy-800 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      item.active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-200"
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full min-w-5 text-center",
                      item.badgeColor
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Security & Access Banner */}
        <div className="p-4 mx-3 mb-4 rounded-lg bg-navy-950/60 border border-navy-800 text-xs">
          <div className="flex items-center gap-2 text-teal-400 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>HIPAA Compliant</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Patient access strictly restricted to authorized consents only.
          </p>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-navy-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>CardioGuard v2.4.0</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" title="Connected" />
        </div>
      </aside>
    </>
  );
}
