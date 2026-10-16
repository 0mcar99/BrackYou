"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Award, CheckCircle2, XCircle, ArrowRight, Play, MessageSquare,
  ShieldAlert, Clock, User, Terminal, Sparkles, AlertTriangle
} from "lucide-react";
import { RibbonCard } from "@/components/ui/RibbonCard";
import { SegmentedBar } from "@/components/ui/SegmentedBar";
import { PillButton } from "@/components/ui/PillButton";
import { getSessionReplay, evaluateViva } from "@/lib/api";

export default function ResultsDashboardPage() {
  const params = useParams();
  const sessionId = (params.id as string) || "session_demo_alex";

  const [replayData, setReplayData] = useState<any>(null);
  const [activeScrubberMs, setActiveScrubberMs] = useState(374000); // Default to flagged paste at 06:14
  const [selectedSignal, setSelectedSignal] = useState<any>(null);

  // Viva interactive chat state
  const [vivaAnswer, setVivaAnswer] = useState(
    "I used constructor injection to ensure that the UserRepository dependency is provided at instantiation time and cannot be reassigned or null during execution."
  );
  const [vivaSubmitted, setVivaSubmitted] = useState(true);
  const [vivaResult, setVivaResult] = useState<any>({
    match_score: 95,
    status: "Verified",
    feedback: "Excellent technical reasoning. Your explanation clearly matches the code's immutable constructor initialization."
  });

  useEffect(() => {
    getSessionReplay(sessionId).then((res) => {
      setReplayData(res);
      if (res.signals && res.signals.length > 0) {
        setSelectedSignal(res.signals[0]);
      }
    }).catch(console.error);
  }, [sessionId]);

  const handleEvaluateViva = async () => {
    try {
      const res = await evaluateViva(
        "sub_demo_alex",
        "Why did you choose Constructor injection over Setter injection in UserService?",
        vivaAnswer,
        ["constructor", "dependency injection", "null", "immutable", "testability"]
      );
      setVivaResult(res);
      setVivaSubmitted(true);
    } catch (err) {
      console.error(err);
    }
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
            Submitted 2 mins ago · Java & Python Sandbox
          </span>
        </div>

        <Link href="/student/dashboard" className="text-xs font-heading font-extrabold text-accentTeal hover:underline">
          ← Return to My Dashboard
        </Link>
      </div>

      <div>
        <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-accentOrange block">
          Assessment Evaluation Dossier
        </span>
        <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-textPrimary tracking-tight mt-1">
          Dependency Injection & Inversion of Control
        </h1>
      </div>

      {/* FORMAT 1: Percentage Format & FORMAT 2: Summary Format */}
      <RibbonCard ribbonText="GREAT EFFORT!" ribbonColor="teal" className="bg-card">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Format 1: BKT Percentage */}
          <div className="md:col-span-5 space-y-2 border-b md:border-b-0 md:border-r-[2px] border-borderLight pb-4 md:pb-0 md:pr-6">
            <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-textSecondary block">
              1. BKT Latent Mastery Update
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-heading font-extrabold text-textPrimary">78%</span>
              <span className="text-xs font-heading font-extrabold text-accentTeal px-2.5 py-1 bg-accentTeal/15 border-[1.5px] border-accentTeal rounded-pill">
                +14% from previous 📈
              </span>
            </div>
            <SegmentedBar value={78} color="teal" className="pt-2" />
          </div>

          {/* Format 2: Conversational Pedagogical Summary */}
          <div className="md:col-span-7 space-y-2">
            <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-textSecondary block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accentOrange" />
              2. Pedagogical Code Evaluation
            </span>
            <p className="text-sm font-semibold text-textPrimary leading-relaxed bg-cream/60 p-4 rounded-2xl border-[1.5px] border-borderLight">
              &ldquo;You demonstrated clean constructor injection and eliminated tight coupling inside the service class.
              However, edge cases in circular references require attention before proceeding to Spring Boot.&rdquo;
            </p>
          </div>
        </div>
      </RibbonCard>

      {/* FORMAT 3: Graphical Format (Test Cases) & FORMAT 5: Comparative Format */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Format 3: Test Cases Checklist */}
        <div className="tiebreak-card p-6 bg-card space-y-4">
          <div className="flex justify-between items-center border-b-[2px] border-borderLight pb-2">
            <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-textSecondary">
              3. Test Cases (Actual Execution)
            </span>
            <span className="text-xs font-mono font-bold text-accentTeal">2/2 Passed (100%)</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border-[2px] border-emerald-500 text-emerald-800 text-xs font-bold">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Basic Constructor Dependency Injection
              </span>
              <span className="font-mono text-[11px]">Pass (42ms)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border-[2px] border-emerald-500 text-emerald-800 text-xs font-bold">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                [Hidden] Null Dependency Injection Guard
              </span>
              <span className="font-mono text-[11px]">Pass (42ms)</span>
            </div>
          </div>

          <SegmentedBar value={100} color="teal" totalBlocks={4} />
        </div>

        {/* Format 5: Comparative Peer Cohort Format */}
        <div className="tiebreak-card p-6 bg-card space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b-[2px] border-borderLight pb-2">
              <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-textSecondary">
                5. Cohort Context (You vs Crew)
              </span>
              <span className="text-xs font-heading font-extrabold text-accentTeal">+14% Ahead</span>
            </div>

            <div className="space-y-4 pt-3">
              <div>
                <div className="flex justify-between text-xs font-bold text-textPrimary mb-1">
                  <span>Your Mastery Score:</span>
                  <span className="font-mono text-accentTeal">78%</span>
                </div>
                <SegmentedBar value={78} color="teal" />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-textSecondary mb-1">
                  <span>Crew Batch Average:</span>
                  <span className="font-mono text-textMuted">64%</span>
                </div>
                <SegmentedBar value={64} color="orange" />
              </div>
            </div>
          </div>

          <p className="text-xs font-semibold text-textSecondary">
            You are in the top 20% of your batch on Dependency Injection. Prerequisite gates for Spring Boot are 80% cleared.
          </p>
        </div>
      </div>

      {/* FORMAT 6: Timeline / Replay Scrubber (The Process Forensics Feature!) */}
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
            <span className="text-xs font-heading font-extrabold px-3 py-1 rounded-pill bg-amber-50 text-amber-800 border-[1.5px] border-amber-400">
              1 Evidence Marker Flagged for Review
            </span>
          </div>
        </div>

        {/* Visual Timeline Bar */}
        <div className="space-y-2 py-2">
          <div className="h-6 w-full bg-cream rounded-pill border-[2px] border-accentBrown relative flex items-center px-4">
            {/* Event Markers on Timeline */}
            <div className="absolute left-[15%] w-3 h-3 rounded-full bg-accentTeal" title="First execution" />
            <div className="absolute left-[35%] w-3 h-3 rounded-full bg-accentYellow border border-accentBrown" title="Tab switch blur" />
            {/* Flagged large paste at 06:14 (approx 65% of session) */}
            <button
              onClick={() => setActiveScrubberMs(374000)}
              className="absolute left-[65%] w-6 h-6 -top-0.5 rounded-full bg-accentRed text-white text-[11px] font-heading font-extrabold flex items-center justify-center border-[2px] border-accentBrown shadow-sm animate-pulse cursor-pointer"
              title="Click to jump to 06:14 large paste"
            >
              ⚠
            </button>
            <div className="absolute left-[92%] w-3 h-3 rounded-full bg-accentTeal" title="Final submission" />
          </div>

          <div className="flex justify-between text-[11px] font-mono font-semibold text-textMuted px-2">
            <span>00:00</span>
            <span>03:30 (Focus lost)</span>
            <span className="text-accentRed font-bold font-heading">06:14 (Large Paste Flag)</span>
            <span>07:30 (Submit)</span>
          </div>
        </div>

        {/* Clicked Flag Detail Card */}
        <div className="p-4 rounded-2xl bg-rose-50/70 border-[2px] border-rose-300 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-extrabold text-accentRed flex items-center gap-1.5 uppercase">
              <AlertTriangle className="w-4 h-4" />
              Flagged Moment: 06:14 — Large Paste Operation (340 characters)
            </span>
            <span className="text-[11px] font-bold text-textSecondary bg-white px-2 py-0.5 rounded-pill border">
              Evidence For Review
            </span>
          </div>
          <p className="text-xs font-semibold text-textPrimary leading-relaxed">
            340 characters appeared in 1 tick without keystrokes. Followed by immediate compilation.
          </p>
          <div className="text-[11px] font-semibold text-textSecondary border-t border-rose-200 pt-2 flex justify-between items-center">
            <span>Student Rebuttal: &ldquo;I consulted the official documentation to check constructor signatures.&rdquo;</span>
            <span className="text-accentTeal font-bold">Human Review: Pending Trainer</span>
          </div>
        </div>
      </div>

      {/* FORMAT 4: Actual Result Format (Code Viewer + Terminal) */}
      <div className="tiebreak-card p-6 bg-card space-y-4">
        <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-textSecondary block">
          4. Actual Code & Terminal Output
        </span>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 p-4 bg-cream rounded-2xl border-[2px] border-borderLight font-mono text-xs text-textPrimary overflow-x-auto leading-relaxed">
            <pre>{`class UserRepository:
    def get_user(self, user_id):
        return f"User_{user_id}"

class UserService:
    def __init__(self, repo):
        # Enforcing constructor dependency injection
        if repo is None:
            raise ValueError("UserRepository dependency cannot be null")
        self._repo = repo

    def fetch_user(self, user_id):
        return self._repo.get_user(user_id)

if __name__ == '__main__':
    service = UserService(UserRepository())
    print(service.fetch_user(101))`}</pre>
          </div>

          <div className="lg:col-span-4 p-4 bg-accentBrown rounded-2xl border-[2px] border-accentBrown font-mono text-xs text-cream space-y-2 flex flex-col justify-between">
            <div>
              <div className="text-accentYellow font-bold flex items-center gap-1.5 border-b border-cream/20 pb-2 mb-2">
                <Terminal className="w-4 h-4" /> Sandbox Execution Console
              </div>
              <div className="text-emerald-300">Running Test Suite...</div>
              <div>Test 1 (Basic Injection): PASSED (42ms)</div>
              <div>Test 2 (Null Guard): PASSED (42ms)</div>
              <div className="text-accentYellow pt-2">Result: 2/2 Passed (100%)</div>
            </div>
            <div className="text-[10px] text-cream/70 border-t border-cream/20 pt-2">
              Hardened Sandbox · 0 network egress · 128MB ceiling
            </div>
          </div>
        </div>
      </div>

      {/* EXPLAIN-YOUR-CODE VIVA SECTION */}
      <div className="tiebreak-card p-6 bg-card space-y-4 border-accentTeal border-[2.5px]">
        <div className="flex items-center justify-between border-b-[2px] border-borderLight pb-2">
          <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-accentTeal flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            Explain-Your-Code AI Viva
          </span>
          <span className="text-xs font-heading font-extrabold px-2.5 py-0.5 rounded-pill bg-accentTeal/15 text-accentTeal">
            Comprehension Match: {vivaResult?.match_score ?? 95}%
          </span>
        </div>

        <div className="space-y-4">
          {/* AI Question */}
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-accentOrange border-[2px] border-accentBrown flex items-center justify-center text-white font-heading font-bold text-xs shrink-0 shadow-sm">
              AI
            </div>
            <div className="bg-cream p-4 rounded-2xl rounded-tl-none border-[2px] border-borderLight text-xs font-semibold text-textPrimary max-w-2xl">
              &ldquo;In `UserService`, you instantiated `UserRepository` through the constructor and added a null guard. Why is constructor injection preferable to instantiating dependencies directly inside methods?&rdquo;
            </div>
          </div>

          {/* Student Explanation */}
          <div className="flex gap-3 items-start justify-end">
            <div className="bg-accentTeal/10 p-4 rounded-2xl rounded-tr-none border-[2px] border-accentTeal text-xs font-semibold text-textPrimary max-w-2xl text-right">
              {vivaAnswer}
            </div>
            <div className="w-8 h-8 rounded-full bg-accentYellow border-[2px] border-accentBrown flex items-center justify-center text-textPrimary font-heading font-bold text-xs shrink-0 shadow-sm">
              You
            </div>
          </div>

          {/* Viva Evaluation Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border-[2px] border-emerald-500 text-emerald-800 text-xs font-bold flex items-center justify-between">
            <span>✅ {vivaResult?.feedback}</span>
            <span className="font-mono text-xs">Verified by Rubric</span>
          </div>
        </div>
      </div>
    </div>
  );
}
