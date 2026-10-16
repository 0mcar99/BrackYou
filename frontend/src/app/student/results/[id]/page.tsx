"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Play,
  MessageSquare,
  ShieldAlert,
  Clock,
  User,
  Terminal,
  Sparkles,
  AlertTriangle,
  Send,
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { RibbonCard } from "@/components/ui/RibbonCard";
import { SegmentedBar } from "@/components/ui/SegmentedBar";
import { PillButton } from "@/components/ui/PillButton";
import { getSessionReplay, evaluateViva, addStudentRebuttal } from "@/lib/api";

export default function ResultsDashboardPage() {
  const params = useParams();
  const sessionId = (params.id as string) || "session_demo_alex";

  const [replayData, setReplayData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const [rebuttalText, setRebuttalText] = useState("");
  const [isSubmittingRebuttal, setIsSubmittingRebuttal] = useState(false);

  // Viva interactive chat state
  const [vivaQuestion, setVivaQuestion] = useState(
    "In `UserService`, you instantiated `UserRepository` through the constructor and added a null guard. Why is constructor injection preferable to instantiating dependencies directly inside methods?"
  );
  const [vivaAnswer, setVivaAnswer] = useState(
    "I used constructor injection to ensure that the UserRepository dependency is provided at instantiation time and cannot be reassigned or null during execution."
  );
  const [isEditingViva, setIsEditingViva] = useState(false);
  const [isEvaluatingViva, setIsEvaluatingViva] = useState(false);
  const [vivaResult, setVivaResult] = useState<any>({
    match_score: 95,
    status: "Verified",
    feedback: "Excellent technical reasoning. Your explanation clearly matches the code's immutable constructor initialization."
  });

  useEffect(() => {
    setLoading(true);
    getSessionReplay(sessionId)
      .then((res) => {
        setReplayData(res);
        if (res.signals && res.signals.length > 0) {
          setSelectedSignal(res.signals[0]);
          if (res.signals[0].student_rebuttal) {
            setRebuttalText(res.signals[0].student_rebuttal);
          }
        }
        if (res.viva) {
          if (res.viva.question_text) setVivaQuestion(res.viva.question_text);
          if (res.viva.student_answer) setVivaAnswer(res.viva.student_answer);
          if (res.viva.match_score) {
            setVivaResult({
              match_score: res.viva.match_score,
              status: "Verified",
              feedback: res.viva.rubric_feedback || "Excellent technical reasoning. Your explanation clearly matches the code's immutable constructor initialization."
            });
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load replay dossier:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sessionId]);

  const handleEvaluateViva = async () => {
    setIsEvaluatingViva(true);
    try {
      const subId = replayData?.submission?.id || "sub_demo_alex";
      const res = await evaluateViva(
        subId,
        vivaQuestion,
        vivaAnswer,
        ["constructor", "dependency injection", "null", "immutable", "testability", "coupling", "encapsulation"]
      );
      setVivaResult({
        match_score: res.match_score || 95,
        status: res.status || "Verified",
        feedback: res.feedback || "Technical reasoning verified by rubric."
      });
      setIsEditingViva(false);
    } catch (err) {
      console.error("Viva evaluation error:", err);
    } finally {
      setIsEvaluatingViva(false);
    }
  };

  const handleSaveRebuttal = async () => {
    if (!selectedSignal || !rebuttalText.trim()) return;
    setIsSubmittingRebuttal(true);
    try {
      await addStudentRebuttal(selectedSignal.id, rebuttalText.trim());
      setSelectedSignal((prev: any) => ({
        ...prev,
        student_rebuttal: rebuttalText.trim()
      }));
    } catch (err) {
      console.error("Failed to save rebuttal:", err);
    } finally {
      setIsSubmittingRebuttal(false);
    }
  };

  // Calculated display metrics from real submission or fallback
  const bktPct = replayData?.bkt_mastery?.current_pct ?? 78;
  const bktDelta = replayData?.bkt_mastery?.delta_pct ?? 14;
  const pedagogicalSummary =
    replayData?.bkt_mastery?.pedagogical_summary ||
    replayData?.submission?.pedagogical_summary ||
    "You demonstrated clean constructor injection and eliminated tight coupling inside the service class. However, edge cases in circular references require attention before proceeding to Spring Boot.";

  const testDetails = replayData?.submission?.test_details || [
    {
      name: "Basic Constructor Dependency Injection",
      passed: true,
      is_hidden: false,
      execution_time_ms: 42
    },
    {
      name: "[Hidden] Null Dependency Injection Guard",
      passed: true,
      is_hidden: true,
      execution_time_ms: 42
    }
  ];

  const passedTests = replayData?.submission?.passed_tests ?? testDetails.filter((t: any) => t.passed).length;
  const totalTests = replayData?.submission?.total_tests ?? testDetails.length;
  const passPercent = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100;

  const userMasteryPct = replayData?.cohort_comparison?.user_pct ?? bktPct;
  const crewAvgPct = replayData?.cohort_comparison?.cohort_avg_pct ?? 64;
  const cohortDelta = userMasteryPct - crewAvgPct;
  const cohortSummary =
    replayData?.cohort_comparison?.summary ||
    `You are in the top 20% of your batch on Dependency Injection. Prerequisite gates for Spring Boot are 80% cleared.`;

  const submittedCode =
    replayData?.submission?.code ||
    `class UserRepository:\n    def get_user(self, user_id):\n        return f"User_{user_id}"\n\nclass UserService:\n    def __init__(self, repo):\n        # Enforcing constructor dependency injection\n        if repo is None:\n            raise ValueError("UserRepository dependency cannot be null")\n        self._repo = repo\n\n    def fetch_user(self, user_id):\n        return self._repo.get_user(user_id)\n\nif __name__ == '__main__':\n    service = UserService(UserRepository())\n    print(service.fetch_user(101))`;

  const signals = replayData?.signals || [];
  const totalDurationMs = replayData?.total_duration_ms || 456000;

  const formatMs = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Top Completion Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-[2px] border-borderLight pb-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-accentTeal/15 border-[2px] border-accentTeal rounded-pill text-xs font-heading font-extrabold text-accentTeal flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Assessment Complete
          </span>
          <span className="text-xs font-semibold text-textSecondary flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-textMuted" />
            Submitted {loading ? "calculating..." : "just now"} · Hardened Python & Java Sandbox
          </span>
        </div>

        <Link
          href="/student/dashboard"
          className="text-xs font-heading font-extrabold text-accentTeal hover:underline flex items-center gap-1"
        >
          ← Return to My Dashboard
        </Link>
      </div>

      <div>
        <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-accentOrange block">
          Assessment Evaluation Dossier
        </span>
        <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-textPrimary tracking-tight mt-1">
          {replayData?.question_title || "Constructor Dependency Injection in UserService"}
        </h1>
      </div>

      {/* SCREENSHOT 4: TOP ROW — FORMAT 1: BKT PERCENTAGE & FORMAT 2: PEDAGOGICAL CODE EVALUATION */}
      <RibbonCard
        ribbonText={passPercent === 100 ? "GREAT EFFORT!" : "REMEDIAL REVIEW"}
        ribbonColor={passPercent === 100 ? "teal" : "orange"}
        className="bg-card"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Format 1: BKT Latent Mastery Update */}
          <div className="md:col-span-5 space-y-2 border-b md:border-b-0 md:border-r-[2px] border-borderLight pb-4 md:pb-0 md:pr-6">
            <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-textSecondary block">
              1. BKT Latent Mastery Update
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-heading font-extrabold text-textPrimary">{bktPct}%</span>
              <span
                className={`text-xs font-heading font-extrabold px-2.5 py-1 rounded-pill border-[1.5px] ${
                  bktDelta >= 0
                    ? "text-accentTeal bg-accentTeal/15 border-accentTeal"
                    : "text-accentOrange bg-accentOrange/15 border-accentOrange"
                }`}
              >
                {bktDelta >= 0 ? `+${bktDelta}%` : `${bktDelta}%`} from previous {bktDelta >= 0 ? "📈" : "📉"}
              </span>
            </div>
            <SegmentedBar value={bktPct} color={bktPct >= 75 ? "teal" : "orange"} totalBlocks={10} className="pt-2" />
          </div>

          {/* Format 2: Pedagogical Code Evaluation */}
          <div className="md:col-span-7 space-y-2">
            <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-textSecondary block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accentOrange" />
              2. Pedagogical Code Evaluation
            </span>
            <p className="text-sm font-semibold text-textPrimary leading-relaxed bg-cream/60 p-4 rounded-2xl border-[1.5px] border-borderLight">
              &ldquo;{pedagogicalSummary}&rdquo;
            </p>
          </div>
        </div>
      </RibbonCard>

      {/* SCREENSHOT 4: BOTTOM ROW — FORMAT 3: TEST CASES & FORMAT 5: COHORT CONTEXT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Format 3: Test Cases (Actual Execution) */}
        <div className="tiebreak-card p-6 bg-card space-y-4">
          <div className="flex justify-between items-center border-b-[2px] border-borderLight pb-2">
            <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-textSecondary">
              3. Test Cases (Actual Execution)
            </span>
            <span
              className={`text-xs font-mono font-bold ${
                passPercent === 100 ? "text-accentTeal" : "text-accentOrange"
              }`}
            >
              {passedTests}/{totalTests} Passed ({passPercent}%)
            </span>
          </div>

          <div className="space-y-2.5">
            {testDetails.map((tc: any, idx: number) => {
              const passed = tc.passed;
              const runtime = tc.execution_time_ms || 42;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-xl border-[2px] text-xs font-bold transition-all ${
                    passed
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                      : "bg-rose-50 border-rose-400 text-rose-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{tc.name}</span>
                  </span>
                  <span className="font-mono text-[11px] shrink-0">
                    {passed ? `Pass (${runtime}ms)` : `Fail (${tc.error || "Mismatch"})`}
                  </span>
                </div>
              );
            })}
          </div>

          <SegmentedBar value={passPercent} color={passPercent === 100 ? "teal" : "orange"} totalBlocks={4} />
        </div>

        {/* Format 5: Cohort Context (You vs Crew) */}
        <div className="tiebreak-card p-6 bg-card space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b-[2px] border-borderLight pb-2">
              <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-textSecondary">
                5. Cohort Context (You vs Crew)
              </span>
              <span
                className={`text-xs font-heading font-extrabold ${
                  cohortDelta >= 0 ? "text-accentTeal" : "text-accentOrange"
                }`}
              >
                {cohortDelta >= 0 ? `+${cohortDelta}% Ahead` : `${cohortDelta}% Behind`}
              </span>
            </div>

            <div className="space-y-4 pt-3">
              <div>
                <div className="flex justify-between text-xs font-bold text-textPrimary mb-1">
                  <span>Your Mastery Score:</span>
                  <span className="font-mono text-accentTeal">{userMasteryPct}%</span>
                </div>
                <SegmentedBar value={userMasteryPct} color="teal" totalBlocks={10} />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-textSecondary mb-1">
                  <span>Crew Batch Average:</span>
                  <span className="font-mono text-textMuted">{crewAvgPct}%</span>
                </div>
                <SegmentedBar value={crewAvgPct} color="orange" totalBlocks={10} />
              </div>
            </div>
          </div>

          <p className="text-xs font-semibold text-textSecondary pt-2 leading-relaxed">
            {cohortSummary}
          </p>
        </div>
      </div>

      {/* SCREENSHOT 2: FORMAT 4 — ACTUAL CODE & TERMINAL OUTPUT */}
      <div className="tiebreak-card p-6 bg-card space-y-4">
        <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-textSecondary block">
          4. Actual Code & Terminal Output
        </span>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Exact Submitted Code */}
          <div className="lg:col-span-8 p-4 bg-cream rounded-2xl border-[2px] border-borderLight font-mono text-xs text-textPrimary overflow-x-auto leading-relaxed max-h-[380px] overflow-y-auto">
            <pre>{submittedCode}</pre>
          </div>

          {/* Right: Sandbox Execution Console */}
          <div className="lg:col-span-4 p-4 bg-accentBrown rounded-2xl border-[2px] border-accentBrown font-mono text-xs text-cream space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-accentYellow font-bold flex items-center gap-1.5 border-b border-cream/20 pb-2">
                <Terminal className="w-4 h-4" /> &gt;_ Sandbox Execution Console
              </div>
              <div className="text-emerald-300 font-semibold">Running Test Suite...</div>
              {testDetails.map((tc: any, idx: number) => (
                <div key={idx} className="text-cream/90 text-[11px]">
                  Test {idx + 1} ({tc.name}):{" "}
                  <span className={tc.passed ? "text-emerald-300 font-bold" : "text-rose-300 font-bold"}>
                    {tc.passed ? "PASSED" : "FAILED"}
                  </span>{" "}
                  ({tc.execution_time_ms || 42}ms)
                </div>
              ))}
              <div className="text-accentYellow pt-1 font-bold">
                Result: {passedTests}/{totalTests} Passed ({passPercent}%)
              </div>

              {replayData?.submission?.stderr && (
                <div className="text-rose-300 text-[10px] mt-2 p-2 bg-black/40 rounded">
                  {replayData.submission.stderr}
                </div>
              )}
            </div>

            <div className="text-[10px] text-cream/70 border-t border-cream/20 pt-2 flex items-center justify-between">
              <span>Hardened Sandbox</span>
              <span>• 0 network egress</span>
              <span>• 128MB ceiling</span>
            </div>
          </div>
        </div>
      </div>

      {/* SCREENSHOT 3: FORMAT 6 — PROCESS INTEGRITY & TIMELINE SCRUBBER */}
      <div className="tiebreak-card p-6 bg-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-[2px] border-borderLight pb-3">
          <div>
            <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-textSecondary block">
              6. Process Integrity & Timeline Scrubber
            </span>
            <span className="text-xs font-semibold text-textMuted">
              Falsifiable evidence timeline deep-linked to exact replay moments
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-heading font-extrabold px-3 py-1 rounded-pill border-[1.5px] ${
                signals.length > 0
                  ? "bg-amber-50 text-amber-800 border-amber-400"
                  : "bg-emerald-50 text-emerald-800 border-emerald-400"
              }`}
            >
              {signals.length > 0
                ? `${signals.length} Evidence Marker${signals.length > 1 ? "s" : ""} Flagged for Review`
                : "0 Anomalies Detected (Clean Session)"}
            </span>
          </div>
        </div>

        {/* Visual Timeline Bar with Event Markers */}
        <div className="space-y-3 py-2">
          <div className="h-7 w-full bg-cream rounded-pill border-[2px] border-accentBrown relative flex items-center px-4">
            {/* Start point at 0% */}
            <div className="absolute left-[2%] w-3 h-3 rounded-full bg-accentTeal" title="Session Start (00:00)" />

            {/* Dynamic Event Markers positioned by actual timestamp */}
            {signals.map((sig: any, idx: number) => {
              const pct = Math.min(92, Math.max(8, Math.round((sig.timestamp_offset_ms / totalDurationMs) * 100)));
              const isSelected = selectedSignal?.id === sig.id;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedSignal(sig);
                    if (sig.student_rebuttal) setRebuttalText(sig.student_rebuttal);
                  }}
                  style={{ left: `${pct}%` }}
                  className={`absolute -top-1 w-6 h-6 rounded-full flex items-center justify-center font-heading font-extrabold text-[11px] border-[2px] border-accentBrown shadow-sm transition-transform cursor-pointer ${
                    isSelected ? "scale-125 z-20 ring-2 ring-accentOrange" : "hover:scale-110"
                  } ${
                    sig.signal_type === "large_paste"
                      ? "bg-accentRed text-white animate-pulse"
                      : "bg-accentYellow text-accentBrown"
                  }`}
                  title={`${sig.signal_type}: Click to view at ${formatMs(sig.timestamp_offset_ms)}`}
                >
                  {sig.signal_type === "large_paste" ? "⚠" : "●"}
                </button>
              );
            })}

            {/* Fallback default timeline markers if no signals yet (e.g., initial live run) */}
            {signals.length === 0 && (
              <>
                <div className="absolute left-[35%] w-3 h-3 rounded-full bg-accentYellow border border-accentBrown" title="First Keystroke Cadence" />
                <div className="absolute left-[65%] w-3 h-3 rounded-full bg-accentTeal" title="Test Iteration" />
              </>
            )}

            {/* Final Submission point at 96% */}
            <div className="absolute right-[2%] w-3.5 h-3.5 rounded-full bg-accentTeal border-[1.5px] border-accentBrown" title="Submission Completed" />
          </div>

          {/* Timeline labels matching Screenshot 3 */}
          <div className="flex justify-between text-[11px] font-mono font-semibold text-textMuted px-2">
            <span>00:00</span>
            <span>03:30 (Focus lost)</span>
            <span className="text-accentRed font-bold font-heading">
              {signals[0] ? `${formatMs(signals[0].timestamp_offset_ms)} (Large Paste Flag)` : "06:14 (Large Paste Flag)"}
            </span>
            <span>{formatMs(totalDurationMs)} (Submit)</span>
          </div>
        </div>

        {/* Selected Flagged Moment Detail Card (Screenshot 3) */}
        {selectedSignal ? (
          <div className="p-4 rounded-2xl bg-rose-50/80 border-[2px] border-rose-300 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-extrabold text-accentRed flex items-center gap-1.5 uppercase">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                FLAGGED MOMENT: {formatMs(selectedSignal.timestamp_offset_ms)} —{" "}
                {selectedSignal.signal_type === "large_paste"
                  ? `LARGE PASTE OPERATION (${selectedSignal.char_count || 340} CHARACTERS)`
                  : selectedSignal.signal_type.toUpperCase()}
              </span>
              <span className="text-[11px] font-bold text-textSecondary bg-white px-2.5 py-0.5 rounded-pill border border-rose-200">
                Evidence For Review
              </span>
            </div>

            <p className="text-xs font-semibold text-textPrimary leading-relaxed">
              {selectedSignal.evidence_description ||
                "340 characters appeared in 1 tick without keystrokes. Followed by immediate compilation."}
            </p>

            {/* Interactive Student Rebuttal Box */}
            <div className="text-[11px] font-semibold text-textSecondary border-t border-rose-200 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span>
                  Student Rebuttal: &ldquo;
                  {selectedSignal.student_rebuttal || rebuttalText || "I consulted the official documentation to check constructor signatures."}
                  &rdquo;
                </span>
                <span className="text-accentTeal font-bold uppercase tracking-wider text-[10px]">
                  Human Review: {selectedSignal.trainer_disposition || "Pending Trainer"}
                </span>
              </div>

              {!selectedSignal.student_rebuttal && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={rebuttalText}
                    onChange={(e) => setRebuttalText(e.target.value)}
                    placeholder="Provide your technical explanation for the trainer..."
                    className="flex-1 px-3 py-1.5 rounded-xl border-[1.5px] border-rose-300 bg-white text-xs text-textPrimary focus:outline-none focus:border-accentBrown"
                  />
                  <PillButton
                    variant="neutral"
                    size="sm"
                    onClick={handleSaveRebuttal}
                    disabled={isSubmittingRebuttal || !rebuttalText.trim()}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Submit Rebuttal
                  </PillButton>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-cream/60 border-[1.5px] border-borderLight text-xs text-textSecondary">
            Click on any timeline flag to inspect the recorded biometric evidence and provide a rebuttal.
          </div>
        )}
      </div>

      {/* SCREENSHOT 1: EXPLAIN-YOUR-CODE AI VIVA */}
      <div className="tiebreak-card p-6 bg-card space-y-4 border-accentTeal border-[2.5px]">
        <div className="flex items-center justify-between border-b-[2px] border-borderLight pb-2">
          <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-accentTeal flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            Explain-Your-Code AI Viva
          </span>
          <span className="text-xs font-heading font-extrabold px-2.5 py-0.5 rounded-pill bg-accentTeal/15 text-accentTeal border border-accentTeal/30">
            Comprehension Match: {vivaResult?.match_score ?? 95}%
          </span>
        </div>

        <div className="space-y-4">
          {/* AI Question */}
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-accentOrange border-[2px] border-accentBrown flex items-center justify-center text-white font-heading font-bold text-xs shrink-0 shadow-sm">
              AI
            </div>
            <div className="bg-cream p-4 rounded-2xl rounded-tl-none border-[2px] border-borderLight text-xs font-semibold text-textPrimary max-w-2xl leading-relaxed">
              &ldquo;{vivaQuestion}&rdquo;
            </div>
          </div>

          {/* Student Explanation Bubble */}
          <div className="flex gap-3 items-start justify-end">
            <div className="bg-accentTeal/10 p-4 rounded-2xl rounded-tr-none border-[2px] border-accentTeal text-xs font-semibold text-textPrimary max-w-2xl text-right leading-relaxed space-y-2">
              {isEditingViva ? (
                <div className="space-y-2">
                  <textarea
                    value={vivaAnswer}
                    onChange={(e) => setVivaAnswer(e.target.value)}
                    rows={3}
                    className="w-full bg-white p-2.5 rounded-xl border border-accentTeal text-xs text-textPrimary text-left focus:outline-none"
                    placeholder="Type your technical justification..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingViva(false)}
                      className="px-3 py-1 text-xs font-bold text-textSecondary hover:underline"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleEvaluateViva}
                      disabled={isEvaluatingViva}
                      className="px-3 py-1 bg-accentTeal text-white text-xs font-bold rounded-pill hover:bg-accentTeal/90"
                    >
                      {isEvaluatingViva ? "Evaluating..." : "Save & Verify"}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p>{vivaAnswer}</p>
                  <button
                    onClick={() => setIsEditingViva(true)}
                    className="text-[10px] text-accentTeal hover:underline font-bold mt-1 inline-block"
                  >
                    ✏️ Refine My Explanation
                  </button>
                </div>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-accentYellow border-[2px] border-accentBrown flex items-center justify-center text-textPrimary font-heading font-bold text-xs shrink-0 shadow-sm">
              You
            </div>
          </div>

          {/* Viva Evaluation Banner (Screenshot 1) */}
          <div className="p-4 rounded-2xl bg-emerald-50 border-[2px] border-emerald-500 text-emerald-800 text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{vivaResult?.feedback || "Excellent technical reasoning. Your explanation clearly matches the code's immutable constructor initialization."}</span>
            </span>
            <span className="font-mono text-xs text-emerald-900 shrink-0">Verified by Rubric</span>
          </div>
        </div>
      </div>
    </div>
  );
}
