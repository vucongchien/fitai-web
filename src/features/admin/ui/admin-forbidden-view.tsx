"use client";

import { ArrowLeft, KeyRound, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface AdminForbiddenViewProps {
  userName?: string;
  role?: string;
}

export function AdminForbiddenView({ userName, role }: AdminForbiddenViewProps) {
  return (
    <div className="min-h-screen bg-[#0F1117] text-white flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full rounded-3xl bg-[#1A1D27] border border-white/10 p-8 shadow-2xl text-center space-y-6">
        {/* Shield Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <ShieldAlert className="h-10 w-10" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold tracking-widest text-rose-400 uppercase bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
            403 Forbidden
          </span>
          <h1 className="text-2xl font-black font-display tracking-tight text-white pt-2">
            Access Denied
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Administrative privileges are required to access the FITAI Control Plane and Exercise Management Console.
          </p>
        </div>

        {/* Current Identity Banner */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-left space-y-1.5">
          <div className="text-[11px] font-medium text-slate-400">Current Session:</div>
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-200 truncate">{userName || "Athlete User"}</span>
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300 font-mono text-[10px]">
              Role: {role || "USER"}
            </span>
          </div>
          <p className="text-[11px] text-emerald-400/90 pt-1">
            ✓ Your workout and training session remains active and safe.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Link
            href="/home"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Athlete Dashboard</span>
          </Link>

          <Link
            href="/login?redirect=/admin"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
          >
            <KeyRound className="h-4 w-4" />
            <span>Switch to Admin Account</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
