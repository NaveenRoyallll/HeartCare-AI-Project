"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  HeartPulse,
  Mail,
  Lock,
  ShieldCheck,
  AlertCircle,
  Stethoscope,
} from "lucide-react";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Doctor email is required")
    .email("Please provide a valid medical center email"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await api.login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });
      router.push("/");
    } catch (err: any) {
      setAuthError(err.message || "Failed to authenticate. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setValue("email", "dr.jenkins@cardioguard.ai");
    setValue("password", "DoctorPassword123!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo & Name */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-teal-500 text-navy-950 shadow-lg shadow-teal-500/20">
            <HeartPulse className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white tracking-tight">
                CardioGuard
              </span>
              <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                AI
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              CLINICAL TELEMETRY & DECISION SUPPORT
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Doctor Portal Login
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Secure, encrypted access for licensed cardiology clinicians
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {authError && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                label="Hospital / Medical Email"
                type="email"
                autoComplete="email"
                placeholder="physician@hospital.org"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register("email")}
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register("password")}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 select-none cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                  {...register("rememberMe")}
                />
                <span>Keep active on this clinical terminal</span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Please contact your hospital IT Department to reset your clinical token.");
                }}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Forgot credentials?
              </a>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-2.5 shadow-md"
                isLoading={isLoading}
              >
                Sign In to Doctor Console
              </Button>
            </div>
          </form>

          {DEMO_MODE && (
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Demo mode enabled</span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-teal-600 hover:text-teal-800 font-semibold inline-flex items-center gap-1"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                Fill Demo Doctor
              </button>
            </div>
          )}
        </div>

        {/* Security & Regulatory footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Protected Health Information (PHI) encrypted end-to-end</span>
        </div>
      </div>
    </div>
  );
}
