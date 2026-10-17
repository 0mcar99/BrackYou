"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock, AlertTriangle, ShieldCheck, Activity, Zap, Radar, Dna, FlaskConical, Briefcase, Target, Sparkles, RefreshCw } from "lucide-react";
import { PillButton } from "@/components/ui/PillButton";
import { SegmentedBar } from "@/components/ui/SegmentedBar";
import { 
  getStudentMastery, 
  getCurriculumGraph,
  getLearningGapRadar,
  getErrorDNA,
  getPredictionScenarios,
  evaluatePrediction,
  getJobRoleGap
} from "@/lib/api";

export default function SkillTreePage() {
  const [userId, setUserId] = useState("student_a");
  const [masteryData, setMasteryData] = useState<any>(null);
  const [selectedConcept, setSelectedConcept] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Simulated live telemetry stream state
  const [telemetryMode, setTelemetryMode] = useState<"normal" | "burst">("normal");

  // Innovations State
  const [activeTab, setActiveTab] = useState<"dag" | "radar" | "dna" | "prediction" | "career">("dag");
  const [radarData, setRadarData] = useState<any>(null);
  const [errorDnaData, setErrorDnaData] = useState<any>(null);
  const [predictionScenarios, setPredictionScenarios] = useState<any[]>([]);
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [evaluatingPrediction, setEvaluatingPrediction] = useState(false);
  const [jobRoleData, setJobRoleData] = useState<any>(null);
  const [targetRole, setTargetRole] = useState<string>("backend_developer");

  const loadData = async (uid: string) => {
    setLoading(true);
    try {
      const res = await getStudentMastery(uid);
      setMasteryData(res);
      if (res?.concept_states?.length > 0) {
        setSelectedConcept(res.concept_states[2]); // Default to Classes & Objects
      }
      getLearningGapRadar(uid).then(setRadarData).catch(console.error);
      getErrorDNA(uid).then(setErrorDnaData).catch(console.error);
      getPredictionScenarios().then(setPredictionScenarios).catch(console.error);
      getJobRoleGap(uid, targetRole).then(setJobRoleData).catch(console.error);
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

  const handleEvaluatePrediction = async (scenarioId: string, optId: string) => {
    setSelectedOption(optId);
    setEvaluatingPrediction(true);
    try {
      const res = await evaluatePrediction({
        student_id: userId,
        scenario_id: scenarioId,
        selected_option: optId,
      });
      setPredictionResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluatingPrediction(false);
    }
  };

  const handleRoleChange = async (role: string) => {
    setTargetRole(role);
    try {
      const res = await getJobRoleGap(userId, role);
      setJobRoleData(res);
    } catch (err) {
      console.error(err);
    }
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
          <Link
            href="/dashboard"
            className="px-3 py-1.5 bg-[#E8622B] text-white text-xs font-heading font-black rounded-pill border-[2px] border-[#4A2C1A] shadow-[2px_2px_0px_#4A2C1A] hover:bg-[#d45520]"
          >
            ⚡ Open Full PS2 Knowledge DAG & Replay
          </Link>
          <span className="px-3 py-1 bg-accentOrange/10 border-[1.5px] border-accentOrange rounded-pill text-xs font-heading font-extrabold text-accentOrange">
            {userId === "student_a" ? "Alex Chen (Advanced)" : "Jonah Miller (Remedial)"}
          </span>
        </div>
      </div>

      {/* 5 Signature Innovation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-card tiebreak-card">
        {[
          { id: "dag", label: "Prerequisite Concept DAG", icon: Zap },
          { id: "radar", label: "AI Learning Gap Radar", icon: Radar },
          { id: "dna", label: "Personal Error DNA", icon: Dna },
          { id: "prediction", label: "Code Change Prediction Lab", icon: FlaskConical },
          { id: "career", label: "Job-Role Skill Gap Analyzer", icon: Briefcase },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-pill text-xs font-heading font-extrabold border-[2px] transition-all cursor-pointer ${
                isActive
                  ? "bg-accentOrange text-white border-accentBrown shadow-[2px_2px_0px_#4A2C1A]"
                  : "bg-cream text-textSecondary border-transparent hover:border-borderLight"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "dag" && (
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
      )}

      {/* Tab 2: Innovation 1 — AI Learning Gap Radar */}
      {activeTab === "radar" && (
        <div className="space-y-6">
          <div className="tiebreak-card p-6 bg-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b-[2px] border-borderLight pb-4">
              <div>
                <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-accentOrange block">
                  Innovation 1
                </span>
                <h2 className="text-2xl font-heading font-black text-textPrimary">
                  AI Learning Gap Radar
                </h2>
                <p className="text-xs text-textSecondary font-medium mt-0.5">
                  Automated prerequisite bottleneck detection and targeted remediation recommendations
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cream rounded-xl border-[1.5px] border-borderLight text-center">
                  <span className="text-[10px] font-bold text-textMuted uppercase block">Overall Readiness</span>
                  <span className="text-xl font-heading font-black text-accentOrange">
                    {radarData?.overall_readiness_pct || 42}%
                  </span>
                </div>
                <div className="p-3 bg-cream rounded-xl border-[1.5px] border-borderLight text-center">
                  <span className="text-[10px] font-bold text-textMuted uppercase block">Active Gaps</span>
                  <span className="text-xl font-heading font-black text-accentRed">
                    {radarData?.active_gaps_count || 2}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Actionable Recommendation Alert */}
            {radarData?.recommended_action && (
              <div className="p-4 bg-accentOrange/10 border-[2px] border-accentOrange rounded-xl flex items-start gap-3">
                <Radar className="w-5 h-5 text-accentOrange shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-accentOrange uppercase tracking-wider block">
                    AI Diagnostic Recovery Recommendation:
                  </span>
                  <p className="text-xs font-semibold text-textPrimary">
                    {radarData.recommended_action}
                  </p>
                </div>
              </div>
            )}

            {/* Radar Concept Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {radarData?.radar_metrics?.map((m: any) => (
                <div
                  key={m.concept_id}
                  className={`p-4 rounded-2xl border-[2px] space-y-3 ${
                    m.is_bottleneck
                      ? "bg-rose-50/80 border-rose-500 shadow-[3px_3px_0px_#4A2C1A]"
                      : m.mastery_pct >= 75
                      ? "bg-emerald-50/60 border-emerald-500"
                      : "bg-cream border-accentBrown"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-heading font-extrabold text-xs text-textPrimary">
                      {m.title}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-pill ${
                      m.risk_level === "High"
                        ? "bg-rose-200 text-rose-900"
                        : m.risk_level === "Medium"
                        ? "bg-amber-200 text-amber-900"
                        : "bg-emerald-200 text-emerald-900"
                    }`}>
                      {m.risk_level} Risk
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-textSecondary mb-1">
                      <span>Mastery P(L):</span>
                      <span className="font-bold text-textPrimary">{m.mastery_pct}% / {m.target_pct}%</span>
                    </div>
                    <div className="w-full bg-borderLight h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${m.mastery_pct >= 75 ? "bg-accentTeal" : "bg-accentOrange"}`}
                        style={{ width: `${m.mastery_pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-[10px] text-textMuted space-y-0.5 pt-1 border-t border-borderLight">
                    <div>Prerequisite: <strong className="text-textPrimary">{m.prerequisite_title}</strong></div>
                    {m.is_bottleneck && (
                      <div className="text-rose-700 font-bold flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3" /> Prerequisite Bottleneck Detected!
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Innovation 3 — Personal Error DNA */}
      {activeTab === "dna" && (
        <div className="space-y-6">
          <div className="tiebreak-card p-6 bg-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b-[2px] border-borderLight pb-4">
              <div>
                <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-accentTeal block">
                  Innovation 3
                </span>
                <h2 className="text-2xl font-heading font-black text-textPrimary">
                  Personal Error DNA
                </h2>
                <p className="text-xs text-textSecondary font-medium mt-0.5">
                  Individual recurring mistake profiling, boundary error tracking, and targeted recovery plans
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-pill bg-accentTeal/10 border border-accentTeal text-xs font-heading font-bold text-accentTeal">
                  Improvement Velocity: +{errorDnaData?.improvement_velocity_pct || 24}%
                </span>
              </div>
            </div>

            {errorDnaData?.dna_summary && (
              <div className="p-4 bg-white/80 rounded-xl border-[2px] border-borderLight text-xs text-textPrimary font-medium leading-relaxed">
                🧬 <strong>Profile Diagnostic:</strong> {errorDnaData.dna_summary}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {errorDnaData?.patterns?.map((p: any, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl bg-cream border-[2px] border-accentBrown shadow-[3px_3px_0px_#4A2C1A] space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-accentOrange uppercase tracking-wider block">
                        {p.concept}
                      </span>
                      <h4 className="font-heading font-extrabold text-sm text-textPrimary">
                        {p.detected_pattern}
                      </h4>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-black/5 rounded-pill">
                        {p.frequency}x Flagged
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-pill ${
                        p.trend === "improving" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {p.trend === "improving" ? "Improving ↗" : "Recurring ⚠"}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-black/85 text-rose-300 font-mono text-[10px] rounded-lg">
                    {p.sample_flag}
                  </div>

                  <div className="p-3 bg-white/70 rounded-xl border border-borderLight space-y-1 text-xs">
                    <span className="text-[10px] font-bold text-textMuted uppercase block">Recommended Action:</span>
                    <p className="font-semibold text-textPrimary">{p.recommended_action}</p>
                  </div>

                  <Link
                    href={`/student/assess/${p.recovery_exercise_id}`}
                    className="block text-center py-2 bg-accentOrange text-white text-xs font-heading font-black rounded-pill border-[2px] border-accentBrown shadow-[0_2px_0_#4A2C1A] hover:bg-accentOrange/90 transition-all"
                  >
                    Solve Targeted Recovery Exercise →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Innovation 4 — Code Change Prediction Lab */}
      {activeTab === "prediction" && (
        <div className="space-y-6">
          <div className="tiebreak-card p-6 bg-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b-[2px] border-borderLight pb-4">
              <div>
                <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-accentOrange block">
                  Innovation 4
                </span>
                <h2 className="text-2xl font-heading font-black text-textPrimary">
                  Code Change Prediction Lab
                </h2>
                <p className="text-xs text-textSecondary font-medium mt-0.5">
                  Predict program state transitions, loop iterations, and invariant mutations before executing code
                </p>
              </div>
              <span className="px-3 py-1 bg-accentYellow/40 border border-accentBrown rounded-pill text-xs font-heading font-extrabold text-accentBrown">
                Logical Reasoning Lab
              </span>
            </div>

            {/* Scenario Selector Pills */}
            <div className="flex flex-wrap gap-2">
              {predictionScenarios.map((sc, idx) => (
                <button
                  key={sc.scenario_id}
                  onClick={() => {
                    setActiveScenarioIdx(idx);
                    setSelectedOption(null);
                    setPredictionResult(null);
                  }}
                  className={`px-3 py-1.5 rounded-pill text-xs font-heading font-extrabold border-[2px] transition-all cursor-pointer ${
                    activeScenarioIdx === idx
                      ? "bg-accentOrange text-white border-accentBrown shadow-[2px_2px_0px_#4A2C1A]"
                      : "bg-cream text-textSecondary border-borderLight"
                  }`}
                >
                  Scenario #{idx + 1}: {sc.title}
                </button>
              ))}
            </div>

            {/* Active Scenario Canvas */}
            {predictionScenarios[activeScenarioIdx] && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                {/* Left: Code Mutation Canvas */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="p-4 bg-white/80 rounded-2xl border-[2px] border-borderLight space-y-2">
                    <span className="text-[10px] font-bold text-textMuted uppercase block">Original Program Snippet:</span>
                    <pre className="p-3 bg-[#4A2C1A] text-cream font-mono text-[11px] rounded-xl overflow-x-auto">
                      {predictionScenarios[activeScenarioIdx].original_code}
                    </pre>
                  </div>

                  <div className="p-3.5 bg-accentOrange/10 border-[2px] border-accentOrange rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-accentOrange uppercase block">Proposed Code Mutation:</span>
                    <p className="font-heading font-extrabold text-xs text-textPrimary">
                      {predictionScenarios[activeScenarioIdx].mutation_description}
                    </p>
                  </div>
                </div>

                {/* Right: Prediction Options & Execution Verification */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="p-4 bg-cream rounded-2xl border-[2px] border-accentBrown space-y-3">
                    <span className="text-xs font-heading font-extrabold text-textPrimary block">
                      {predictionScenarios[activeScenarioIdx].question}
                    </span>

                    <div className="space-y-2">
                      {predictionScenarios[activeScenarioIdx].options?.map((opt: any) => {
                        const isChosen = selectedOption === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleEvaluatePrediction(predictionScenarios[activeScenarioIdx].scenario_id, opt.id)}
                            disabled={evaluatingPrediction}
                            className={`w-full p-3 rounded-xl border-[2px] text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                              isChosen
                                ? "bg-accentYellow border-accentBrown shadow-[2px_2px_0px_#4A2C1A]"
                                : "bg-white/80 border-borderLight hover:bg-white"
                            }`}
                          >
                            <span><strong>{opt.id}.</strong> {opt.text}</span>
                            {isChosen && <CheckCircle2 className="w-4 h-4 text-accentOrange shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Prediction Evaluation Output */}
                  {predictionResult && (
                    <div className={`p-4 rounded-2xl border-[2px] space-y-2 text-xs ${
                      predictionResult.is_correct
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                        : "bg-rose-50 border-rose-500 text-rose-900"
                    }`}>
                      <div className="flex justify-between items-center font-bold">
                        <span>{predictionResult.is_correct ? "✅ Prediction Verified!" : "❌ Divergence Detected"}</span>
                        <span className="font-mono text-[10px]">{predictionResult.mastery_delta}</span>
                      </div>
                      <p className="font-medium">{predictionResult.reasoning_feedback}</p>
                      <p className="text-[11px] opacity-90">{predictionResult.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Innovation 5 — Job-Role Skill Gap Analyzer */}
      {activeTab === "career" && (
        <div className="space-y-6">
          <div className="tiebreak-card p-6 bg-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b-[2px] border-borderLight pb-4">
              <div>
                <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-accentOrange block">
                  Innovation 5
                </span>
                <h2 className="text-2xl font-heading font-black text-textPrimary">
                  Job-Role Skill Gap Analyzer
                </h2>
                <p className="text-xs text-textSecondary font-medium mt-0.5">
                  Benchmark demonstrated competencies against software engineering job standards
                </p>
              </div>

              {/* Role Toggle */}
              <div className="flex gap-2">
                {[
                  { id: "backend_developer", label: "Backend Engineer" },
                  { id: "sde_intern", label: "SDE Intern" }
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleRoleChange(r.id)}
                    className={`px-3 py-1.5 rounded-pill text-xs font-heading font-extrabold border-[2px] transition-all cursor-pointer ${
                      targetRole === r.id
                        ? "bg-accentOrange text-white border-accentBrown shadow-[2px_2px_0px_#4A2C1A]"
                        : "bg-cream text-textSecondary border-borderLight"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Role Match Summary Card */}
            <div className="p-4 bg-white/80 rounded-2xl border-[2px] border-borderLight flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-textMuted uppercase block">Career Benchmark:</span>
                <h3 className="text-lg font-heading font-black text-textPrimary">
                  {jobRoleData?.role_name || "Software Engineer"}
                </h3>
                <p className="text-xs text-textSecondary mt-0.5">
                  {jobRoleData?.career_readiness_summary}
                </p>
              </div>
              <div className="text-center p-3 bg-cream rounded-xl border border-accentBrown">
                <span className="text-[10px] font-bold text-textMuted uppercase block">Skill Match</span>
                <span className="text-2xl font-heading font-black text-accentTeal">
                  {jobRoleData?.role_match_pct || 67}%
                </span>
              </div>
            </div>

            {/* Competency Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-[2px] border-borderLight text-textMuted uppercase font-bold text-[10px]">
                    <th className="py-2.5 px-3">Competency / Skill</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Current Mastery</th>
                    <th className="py-2.5 px-3">Industry Target</th>
                    <th className="py-2.5 px-3">Actionable Next Step</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderLight font-semibold">
                  {jobRoleData?.skills_evaluation?.map((sk: any, i: number) => (
                    <tr key={i} className="hover:bg-black/2">
                      <td className="py-3 px-3 font-bold text-textPrimary">{sk.skill}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-pill text-[10px] font-bold ${
                          sk.status === "Demonstrated"
                            ? "bg-emerald-100 text-emerald-800"
                            : sk.status === "Developing"
                            ? "bg-amber-100 text-amber-800"
                            : sk.status === "Needs More Evidence"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {sk.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-textPrimary">{sk.student_score_pct}%</td>
                      <td className="py-3 px-3 font-mono text-textMuted">{sk.target_score_pct}%</td>
                      <td className="py-3 px-3 text-accentOrange">{sk.recommended_action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
