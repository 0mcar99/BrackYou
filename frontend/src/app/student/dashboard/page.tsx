"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Flame, ArrowRight, AlertCircle, CheckCircle2, Lock, Clock, Zap, BookOpen } from "lucide-react";
import { RibbonCard } from "@/components/ui/RibbonCard";
import { SegmentedBar } from "@/components/ui/SegmentedBar";
import { PillButton } from "@/components/ui/PillButton";
import { getStudentMastery, getNextActivity } from "@/lib/api";

export default function StudentDashboardPage() {
  const [userId, setUserId] = useState("student_a");
  const [masteryData, setMasteryData] = useState<any>(null);
  const [nextActivity, setNextActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async (uid: string) => {
    setLoading(true);
    try {
      const [mRes, nRes] = await Promise.all([
        getStudentMastery(uid),
        getNextActivity(uid, "dependency_injection")
      ]);
      setMasteryData(mRes);
      setNextActivity(nRes);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
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

  const studentName = userId === "student_b" ? "Jonah" : "Alex";

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-accentTeal/15 border-[2px] border-accentTeal rounded-pill text-xs font-heading font-extrabold text-accentTeal">
            <span className="w-2 h-2 rounded-full bg-accentTeal animate-pulse" />
            Actively Learning
          </span>
          <span className="text-xs font-semibold text-textSecondary flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-textMuted" />
            Next diagnostic assessment: Today 4:00 PM
          </span>
        </div>

        {/* Path Divergence Badge */}
        {nextActivity?.recommendation?.is_diverted && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accentRed/10 border-[2px] border-accentRed rounded-pill text-xs font-heading font-extrabold text-accentRed">
            <AlertCircle className="w-4 h-4" />
            Adaptive Remediation Triggered
          </div>
        )}
      </div>

      {/* Greeting Banner */}
      <div>
        <h1 className="text-3xl md:text-4xl text-textPrimary tracking-tight">
          Hey {studentName}! Here&apos;s where you stand 👋
        </h1>
        <p className="text-sm font-semibold text-textSecondary mt-1">
          {userId === "student_b"
            ? "Your prerequisite diagnostic detected a gap in foundational OOP. Let's close it before frameworks!"
            : "You are on an accelerated path through Architecture Patterns and Dependency Injection."}
        </p>
      </div>

      {/* Overall Mastery Hero Card */}
      <RibbonCard
        ribbonText={masteryData?.overall_mastery_pct >= 70 ? "ON TRACK" : "PREREQUISITE REVISION"}
        ribbonColor={masteryData?.overall_mastery_pct >= 70 ? "teal" : "orange"}
        className="bg-card"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <span className="text-xs font-heading font-extrabold text-textSecondary uppercase tracking-widest block">
                🧠 Overall Knowledge Mastery
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-5xl md:text-6xl font-heading font-extrabold text-textPrimary">
                  {masteryData?.overall_mastery_pct ?? 67}%
                </span>
                <span className="text-xs font-extrabold text-accentTeal px-2.5 py-1 bg-accentTeal/15 rounded-pill border-[1.5px] border-accentTeal">
                  +12% this week 📈
                </span>
              </div>
            </div>

            <div className="text-right text-xs font-bold text-textSecondary">
              <span className="text-accentTeal font-extrabold">{masteryData?.solid_count ?? 4} Solid</span> ·{" "}
              <span className="text-accentOrange font-extrabold">{masteryData?.weak_count ?? 2} Need Work</span> ·{" "}
              <span className="text-textMuted font-extrabold">{masteryData?.locked_count ?? 1} Locked</span>
            </div>
          </div>

          <SegmentedBar
            value={masteryData?.overall_mastery_pct ?? 67}
            color={masteryData?.overall_mastery_pct >= 70 ? "teal" : "orange"}
            className="pt-2"
          />
        </div>
      </RibbonCard>

      {/* Side-by-Side Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Streak Card */}
        <div className="tiebreak-card p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-textSecondary block">
              🔥 Current Streak
            </span>
            <span className="text-4xl font-heading font-extrabold text-textPrimary block mt-1">
              {userId === "student_b" ? "5 Days" : "12 Days"}
            </span>
            <span className="text-xs font-semibold text-textMuted mt-1 block">
              Consistency boosts retention by 40%
            </span>
          </div>
          <div className="w-16 h-16 rounded-full bg-accentOrange/15 border-[2.5px] border-accentOrange flex items-center justify-center text-accentOrange shadow-[0_3px_0_#4A2C1A]">
            <Flame className="w-8 h-8 fill-current animate-bounce" />
          </div>
        </div>

        {/* Weakest Link / Adaptive Target */}
        <div className="tiebreak-card p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-textSecondary block">
              ⚡ Weakest Blocking Link
            </span>
            <span className="text-2xl font-heading font-extrabold text-textPrimary block mt-1">
              {masteryData?.weakest_link?.title || "Inheritance & Overriding"}
            </span>
            <span className="text-xs font-bold text-accentRed mt-1 block">
              Mastery: {masteryData?.weakest_link?.percentage ?? 23}% (Below 70% Gate Threshold)
            </span>
          </div>

          <div className="pt-4">
            <Link href={`/student/assess/${nextActivity?.question?.id || 'q_di_1'}`}>
              <PillButton variant="primary" size="sm">
                Start Fixing <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </PillButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Adaptive Recommendation Banner (Core Innovation) */}
      {nextActivity && (
        <div className="tiebreak-card p-6 bg-accentYellow/20 border-accentBrown">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-pill text-[10px] font-heading font-extrabold uppercase bg-accentOrange text-white">
                  Adaptive Dispatch
                </span>
                <span className="text-sm font-heading font-extrabold text-textPrimary">
                  Recommended: {nextActivity.recommendation.recommended_concept_title}
                </span>
              </div>
              <p className="text-xs font-semibold text-textSecondary">
                {nextActivity.recommendation.reason}
              </p>
            </div>

            <Link href={`/student/assess/${nextActivity.question.id}`}>
              <PillButton variant="secondary" size="md">
                Launch Challenge <Zap className="w-4 h-4 ml-1 fill-current" />
              </PillButton>
            </Link>
          </div>
        </div>
      )}

      {/* Syllabus Concept Progress Preview */}
      <div className="tiebreak-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-extrabold text-textPrimary">
            Syllabus Prerequisite Map — Java OOP
          </h2>
          <Link href="/student/learn" className="text-xs font-heading font-extrabold text-accentTeal hover:underline">
            Open Interactive Skill Tree →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {masteryData?.concept_states?.map((c: any) => {
            const statusConfig = {
              solid: { border: "border-accentTeal", bg: "bg-accentTeal/10", text: "text-accentTeal", label: "✅ Solid" },
              weak: { border: "border-accentOrange", bg: "bg-accentOrange/10", text: "text-accentOrange", label: "⚠️ Weak" },
              critical: { border: "border-accentRed", bg: "bg-accentRed/10", text: "text-accentRed", label: "🔴 Critical" },
              locked: { border: "border-borderLight", bg: "bg-cream/50", text: "text-textMuted", label: "🔒 Locked" },
            }[c.status as "solid" | "weak" | "critical" | "locked"] || { border: "border-borderLight", bg: "bg-cream", text: "text-textSecondary", label: "Normal" };

            return (
              <div
                key={c.concept_id}
                className={`p-4 rounded-2xl border-[2px] ${statusConfig.border} ${statusConfig.bg} space-y-2`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-textPrimary line-clamp-1">{c.title}</span>
                  <span className="text-[10px] font-heading font-extrabold">{statusConfig.label}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xl font-heading font-extrabold text-textPrimary">{c.percentage}%</span>
                  <span className="text-[10px] font-semibold text-textSecondary">{c.module}</span>
                </div>
                <SegmentedBar
                  value={c.percentage}
                  color={c.status === "solid" ? "teal" : c.status === "critical" ? "red" : "orange"}
                  totalBlocks={5}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
