"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight,
  Eye, RefreshCw, Check, Sparkles, Filter
} from "lucide-react";
import { RibbonCard } from "@/components/ui/RibbonCard";
import { PillButton } from "@/components/ui/PillButton";
import { getCohortHeatmap, getIntegrityReviews, updateSignalDisposition } from "@/lib/api";

export default function TrainerDashboardPage() {
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"heatmap" | "reviews">("heatmap");

  const loadData = async () => {
    setLoading(true);
    try {
      const [hm, rev] = await Promise.all([
        getCohortHeatmap(),
        getIntegrityReviews()
      ]);
      setHeatmapData(hm);
      setReviews(rev);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDisposition = async (signalId: string, disposition: string) => {
    try {
      await updateSignalDisposition(signalId, disposition);
      setReviews((prev) =>
        prev.map((r) => (r.signal_id === signalId ? { ...r, trainer_disposition: disposition } : r))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-[2px] border-borderLight pb-4">
        <div>
          <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-accentOrange block">
            Trainer & Instructor Console
          </span>
          <h1 className="text-3xl font-heading font-extrabold text-textPrimary tracking-tight mt-1">
            Java Fundamentals — Batch A (Spring 2026)
          </h1>
          <div className="flex items-center gap-3 mt-1.5 text-xs font-bold text-textSecondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accentTeal" /> 12 Students Active
            </span>
            <span>·</span>
            <span>Batch Average Mastery: 58%</span>
            <span>·</span>
            <span className="text-accentRed font-extrabold">2 Sessions Flagged for Review</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 bg-cream p-1.5 rounded-pill border-[2px] border-borderLight">
          <button
            onClick={() => setActiveTab("heatmap")}
            className={`px-4 py-1.5 rounded-pill text-xs font-heading font-extrabold transition-all ${
              activeTab === "heatmap"
                ? "bg-accentBrown text-white shadow-sm"
                : "text-textSecondary hover:text-textPrimary"
            }`}
          >
            Cohort Heatmap
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-4 py-1.5 rounded-pill text-xs font-heading font-extrabold transition-all flex items-center gap-1.5 ${
              activeTab === "reviews"
                ? "bg-accentBrown text-white shadow-sm"
                : "text-textSecondary hover:text-textPrimary"
            }`}
          >
            Integrity Review Queue
            <span className="w-4 h-4 rounded-full bg-accentRed text-white text-[10px] flex items-center justify-center">
              {reviews.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === "heatmap" ? (
        <div className="space-y-6">
          {/* CLASS MASTERY HEATMAP (From the user specification prompt!) */}
          <div className="tiebreak-card p-6 bg-card space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-textSecondary">
                Class Mastery Matrix (BKT Heatmap)
              </span>
              <div className="flex items-center gap-3 text-xs font-bold text-textSecondary">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 🟢 Solid (80%+)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 🟡 Weak (40-79%)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> 🔴 Critical (&lt;40%)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> 🔒 Locked</span>
              </div>
            </div>

            {/* Grid Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-[2px] border-borderLight text-xs font-heading font-extrabold text-textSecondary">
                    <th className="py-3 px-4">Student</th>
                    {heatmapData?.concepts?.map((c: any) => (
                      <th key={c.id} className="py-3 px-3 text-center">{c.title}</th>
                    ))}
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderLight text-xs font-bold text-textPrimary">
                  {heatmapData?.students?.map((s: any) => {
                    const isAlex = s.student_id === "student_a";
                    const isJonah = s.student_id === "student_b";

                    return (
                      <tr key={s.student_id} className="hover:bg-cream/40 transition-colors">
                        <td className="py-3 px-4 font-heading font-extrabold">
                          <div className="flex items-center gap-2">
                            <span>{s.student_name}</span>
                            {isAlex && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accentTeal/10 text-accentTeal font-bold">Advanced</span>}
                            {isJonah && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accentRed/10 text-accentRed font-bold">Needs Help</span>}
                          </div>
                        </td>

                        {heatmapData?.concepts?.map((c: any) => {
                          const state = s.concepts[c.id];
                          const dotColor = {
                            solid: "bg-emerald-500 text-emerald-950",
                            weak: "bg-amber-400 text-amber-950",
                            critical: "bg-rose-500 text-rose-950",
                          }[state?.status as "solid" | "weak" | "critical"] || "bg-slate-300 text-slate-500";

                          return (
                            <td key={c.id} className="py-3 px-3 text-center">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-heading font-extrabold text-[11px] shadow-sm ${dotColor}`}>
                                {state?.percentage ?? 10}%
                              </span>
                            </td>
                          );
                        })}

                        <td className="py-3 px-4 text-center">
                          {isJonah ? (
                            <span className="px-2.5 py-1 rounded-pill bg-rose-100 text-rose-800 text-[10px] font-heading font-extrabold border border-rose-300">
                              Remedial Loop
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-pill bg-emerald-100 text-emerald-800 text-[10px] font-heading font-extrabold border border-emerald-300">
                              On Track
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* NEEDS ATTENTION ACTION STRIP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="tiebreak-card p-5 bg-card space-y-2 border-l-[6px] border-l-accentRed">
              <span className="text-[11px] font-heading font-extrabold uppercase text-accentRed block">
                Critical Prerequisite Blocker
              </span>
              <h3 className="text-base font-heading font-extrabold text-textPrimary">Jonah Miller</h3>
              <p className="text-xs font-semibold text-textSecondary">
                Stuck on Inheritance prerequisite chain (25% mastery). Spring Boot module gated.
              </p>
              <div className="pt-2 flex gap-2">
                <Link href="/student/assess/q_obj_1">
                  <PillButton variant="neutral" size="sm">Assign Drill</PillButton>
                </Link>
              </div>
            </div>

            <div className="tiebreak-card p-5 bg-card space-y-2 border-l-[6px] border-l-accentOrange">
              <span className="text-[11px] font-heading font-extrabold uppercase text-accentOrange block">
                Integrity Flag for Review
              </span>
              <h3 className="text-base font-heading font-extrabold text-textPrimary">Alex Chen</h3>
              <p className="text-xs font-semibold text-textSecondary">
                Large paste detected at 06:14 (340 chars). Student submitted rebuttal.
              </p>
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setActiveTab("reviews")}
                  className="text-xs font-heading font-extrabold text-accentTeal hover:underline"
                >
                  Review Forensic Replay →
                </button>
              </div>
            </div>

            <div className="tiebreak-card p-5 bg-card space-y-2 border-l-[6px] border-l-accentTeal">
              <span className="text-[11px] font-heading font-extrabold uppercase text-accentTeal block">
                Ready for Next Module
              </span>
              <h3 className="text-base font-heading font-extrabold text-textPrimary">Sam Taylor</h3>
              <p className="text-xs font-semibold text-textSecondary">
                Solid mastery across all prerequisites (85%+). Ready to unlock Spring Boot.
              </p>
              <div className="pt-2">
                <PillButton variant="secondary" size="sm">Unlock Module</PillButton>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* INTEGRITY REVIEW QUEUE */
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-50 border-[2px] border-amber-300 text-xs font-semibold text-amber-900 flex items-center justify-between">
            <span>
              <strong>Crucial Ethical Principle:</strong> All telemetry signals are framed as falsifiable evidence for human evaluation, never automated cheating verdicts.
            </span>
            <span className="font-heading font-extrabold text-xs">Human-in-the-Loop</span>
          </div>

          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.signal_id} className="tiebreak-card p-6 bg-card space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-[2px] border-borderLight pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-accentRed text-white flex items-center justify-center font-heading font-extrabold text-sm shadow-sm">
                      ⚠
                    </span>
                    <div>
                      <span className="text-sm font-heading font-extrabold text-textPrimary block">
                        {r.signal_type === "large_paste" ? "Large Clipboard Paste Operation" : "Editor Focus Lost"}
                      </span>
                      <span className="text-xs font-semibold text-textSecondary">
                        Student: Alex Chen · Session: {r.session_id} · Timestamp: 06:14 in replay
                      </span>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-pill text-xs font-heading font-extrabold ${
                    r.trainer_disposition === "explained"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}>
                    Disposition: {r.trainer_disposition.toUpperCase()}
                  </span>
                </div>

                <div className="bg-cream/60 p-4 rounded-xl border-[1.5px] border-borderLight text-xs space-y-2">
                  <p className="font-bold text-textPrimary">
                    Evidence: {r.evidence_description}
                  </p>
                  {r.student_rebuttal && (
                    <div className="border-t border-borderLight pt-2 text-textSecondary">
                      <span className="font-bold text-accentTeal">Student Rebuttal:</span> &ldquo;{r.student_rebuttal}&rdquo;
                    </div>
                  )}
                </div>

                {/* Trainer Human Disposition Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <Link href={`/student/results/${r.session_id}`} className="text-xs font-heading font-extrabold text-accentTeal hover:underline flex items-center gap-1">
                    <Eye className="w-4 h-4" /> Open Replay at exact millisecond →
                  </Link>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDisposition(r.signal_id, "explained")}
                      className="px-3.5 py-1.5 rounded-pill text-xs font-heading font-extrabold bg-emerald-50 border-[2px] border-emerald-600 text-emerald-800 hover:bg-emerald-100"
                    >
                      ✓ Mark Explained (No Action)
                    </button>
                    <button
                      onClick={() => handleDisposition(r.signal_id, "conversation")}
                      className="px-3.5 py-1.5 rounded-pill text-xs font-heading font-extrabold bg-amber-50 border-[2px] border-amber-600 text-amber-800 hover:bg-amber-100"
                    >
                      💬 Schedule 1:1 Viva
                    </button>
                    <button
                      onClick={() => handleDisposition(r.signal_id, "escalated")}
                      className="px-3.5 py-1.5 rounded-pill text-xs font-heading font-extrabold bg-rose-50 border-[2px] border-rose-600 text-rose-800 hover:bg-rose-100"
                    >
                      ⚠ Escalate Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
