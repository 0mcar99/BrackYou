"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock, AlertTriangle, ShieldCheck, Activity, Zap } from "lucide-react";
import { PillButton } from "@/components/ui/PillButton";
import { SegmentedBar } from "@/components/ui/SegmentedBar";
import { getStudentMastery, getCurriculumGraph } from "@/lib/api";

export default function SkillTreePage() {
  const [userId, setUserId] = useState("student_a");
  const [masteryData, setMasteryData] = useState<any>(null);
  const [selectedConcept, setSelectedConcept] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Simulated live telemetry stream state
  const [telemetryMode, setTelemetryMode] = useState<"normal" | "burst">("normal");

  const loadData = async (uid: string) => {
    setLoading(true);
    try {
      const res = await getStudentMastery(uid);
      setMasteryData(res);
      if (res?.concept_states?.length > 0) {
        setSelectedConcept(res.concept_states[2]); // Default to Classes & Objects
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("brackyou_user") || "student_a";
    setUserId(saved);
    loadData(saved);

    const onUserChanged = () => {
      const u = localStorage.getItem("brackyou_user") || "student_a";
      setUserId(u);
      loadData(u);
    };

    window.addEventListener("userChanged", onUserChanged);
    return () => window.removeEventListener("userChanged", onUserChanged);
  }, []);

  const handleSimulateStep = (positive: boolean) => {
    if (!selectedConcept) return;
    const delta = positive ? 0.08 : -0.12;
    const newP = Math.max(0.05, Math.min(0.98, selectedConcept.p_known + delta));
    const newPct = Math.round(newP * 100);

    setSelectedConcept({
      ...selectedConcept,
      p_known: newP,
      percentage: newPct,
      status: newPct >= 80 ? "solid" : newPct >= 40 ? "weak" : "critical"
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-textPrimary tracking-tight">
            Prerequisite Concept Map & BKT Telemetry Inspector
          </h1>
          <p className="text-sm font-semibold text-textSecondary mt-0.5">
            Model the syllabus as a Directed Acyclic Graph (DAG) with real-time latent knowledge updates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-textSecondary">Active Persona:</span>
          <span className="px-3 py-1 bg-accentOrange/10 border-[1.5px] border-accentOrange rounded-pill text-xs font-heading font-extrabold text-accentOrange">
            {userId === "student_a" ? "Alex Chen (Advanced)" : "Jonah Miller (Remedial)"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Prerequisite DAG Canvas */}
        <div className="lg:col-span-7 tiebreak-card p-6 bg-card flex flex-col justify-between min-h-[520px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-textSecondary">
                Prerequisite Concept DAG
              </span>
              <span className="text-xs font-semibold text-textMuted">Click node to inspect</span>
            </div>

            {/* Visual Node Flowchart */}
            <div className="flex flex-col items-center py-6 space-y-4">
              {masteryData?.concept_states?.map((c: any, index: number) => {
                const isSelected = selectedConcept?.concept_id === c.concept_id;

                const nodeColors = {
                  solid: "bg-emerald-50 border-emerald-600 text-emerald-800 shadow-[0_3px_0_#059669]",
                  weak: "bg-amber-50 border-amber-500 text-amber-800 shadow-[0_3px_0_#d97706]",
                  critical: "bg-rose-50 border-rose-600 text-rose-800 shadow-[0_3px_0_#e11d48]",
                  locked: "bg-slate-100 border-slate-300 text-slate-400 opacity-60 cursor-not-allowed",
                }[c.status as "solid" | "weak" | "critical" | "locked"] || "bg-cream border-accentBrown";

                return (
                  <React.Fragment key={c.concept_id}>
                    <button
                      onClick={() => setSelectedConcept(c)}
                      className={`w-64 p-3.5 rounded-2xl border-[2.5px] text-center font-heading font-extrabold transition-all duration-150 ${nodeColors} ${
                        isSelected ? "scale-105 ring-4 ring-accentOrange/40" : "hover:scale-[1.02]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold tracking-tight">{c.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/70 border border-current font-mono">
                          P={c.p_known}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-left text-current/80 mt-1 flex items-center justify-between">
                        <span>{c.module}</span>
                        <span>{c.status.toUpperCase()}</span>
                      </div>
                    </button>

                    {index < (masteryData?.concept_states?.length - 1) && (
                      <div className="w-0.5 h-6 bg-accentBrown/60 border-dashed border-l-2 relative">
                        <div className="w-2 h-2 rounded-full bg-accentBrown -left-[3px] absolute bottom-0" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="border-t-[2px] border-borderLight pt-4 flex flex-wrap items-center justify-between text-xs font-bold text-textSecondary gap-2">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Solid (≥80%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Weak (40-79%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500" /> Critical (&lt;40%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-300" /> Locked</span>
          </div>
        </div>

        {/* Right: Diagnostics & Telemetry Inspector (Matching User's Reference Slide!) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Concept Diagnostics Panel */}
          <div className="tiebreak-card p-6 bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-heading font-extrabold text-textPrimary">
                {selectedConcept?.title || "Concept Diagnostics"}
              </h3>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-400 font-mono font-bold text-xs rounded-pill">
                P(L) = {selectedConcept?.p_known ?? 0.88}
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-heading font-extrabold text-textSecondary block uppercase">
                Simulate Challenge Result (BKT Step)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <PillButton variant="secondary" size="sm" onClick={() => handleSimulateStep(true)}>
                  Pass Challenge (+)
                </PillButton>
                <PillButton variant="danger" size="sm" onClick={() => handleSimulateStep(false)}>
                  Fail Challenge (-)
                </PillButton>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs font-heading font-extrabold text-textSecondary block uppercase mb-1">
                Estimated Mastery
              </span>
              <SegmentedBar
                value={selectedConcept?.percentage ?? 88}
                color={selectedConcept?.percentage >= 80 ? "teal" : selectedConcept?.percentage >= 40 ? "orange" : "red"}
                showLabels
              />
            </div>
          </div>

          {/* Telemetry Stream Preview (Matching User Slide!) */}
          <div className="tiebreak-card p-6 bg-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-textSecondary">
                Telemetry Stream
              </span>
              <span className="text-xs font-semibold text-textMuted">Keystroke Cadence</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setTelemetryMode("normal")}
                className={`flex-1 py-1.5 rounded-pill text-xs font-heading font-extrabold border-[2px] border-accentBrown transition-all ${
                  telemetryMode === "normal"
                    ? "bg-accentTeal text-white shadow-[0_2px_0_#4A2C1A]"
                    : "bg-cream text-textSecondary"
                }`}
              >
                Human Normal
              </button>
              <button
                onClick={() => setTelemetryMode("burst")}
                className={`flex-1 py-1.5 rounded-pill text-xs font-heading font-extrabold border-[2px] border-accentBrown transition-all ${
                  telemetryMode === "burst"
                    ? "bg-accentRed text-white shadow-[0_2px_0_#4A2C1A]"
                    : "bg-cream text-textSecondary"
                }`}
              >
                AI Burst Paste
              </button>
            </div>

            {/* Waveform Graph Simulation */}
            <div className="h-24 bg-cream/70 rounded-2xl border-[2px] border-borderLight flex items-end justify-between px-4 py-2">
              {telemetryMode === "normal" ? (
                // Natural varying wave
                [20, 35, 15, 45, 60, 25, 10, 50, 40, 65, 30, 20].map((h, i) => (
                  <div key={i} className="w-2.5 bg-accentTeal rounded-t-sm transition-all duration-300" style={{ height: `${h}%` }} />
                ))
              ) : (
                // Flat spike burst
                [5, 5, 5, 95, 95, 95, 95, 5, 5, 5, 5, 5].map((h, i) => (
                  <div key={i} className="w-2.5 bg-accentRed rounded-t-sm transition-all duration-300" style={{ height: `${h}%` }} />
                ))
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-2.5 rounded-xl bg-cream border-[1.5px] border-borderLight">
                <span className="text-[10px] font-bold text-textMuted uppercase block">Burst Speed</span>
                <span className="text-base font-heading font-extrabold text-textPrimary">
                  {telemetryMode === "normal" ? "28 char/s" : "480 char/s ⚠"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-cream border-[1.5px] border-borderLight">
                <span className="text-[10px] font-bold text-textMuted uppercase block">Paste Ratio</span>
                <span className="text-base font-heading font-extrabold text-textPrimary">
                  {telemetryMode === "normal" ? "3.1%" : "84.5% ⚠"}
                </span>
              </div>
            </div>

            <div className={`p-3 rounded-xl border-[2px] text-xs font-semibold ${
              telemetryMode === "normal"
                ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                : "bg-rose-50 border-rose-500 text-rose-800"
            }`}>
              {telemetryMode === "normal" ? (
                <span><strong>INTEGRITY STATUS: CLEAN.</strong> Student typing metrics exhibit organic human cadence and natural pauses.</span>
              ) : (
                <span><strong>INTEGRITY STATUS: FLAGGED.</strong> Large bulk paste detected (&gt;40 chars in single tick). Clickable evidence marker added to replay.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
