"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Send, Lightbulb, Clock, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Terminal } from "lucide-react";
import { PillButton } from "@/components/ui/PillButton";
import { SegmentedBar } from "@/components/ui/SegmentedBar";
import { getQuestionDetail, runCode, submitCode, uploadTelemetryEvents } from "@/lib/api";

export default function AssessmentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const questionId = (params.id as string) || "q_di_1";

  const [question, setQuestion] = useState<any>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live telemetry metrics
  const [keystrokeCount, setKeystrokeCount] = useState(0);
  const [pasteCount, setPasteCount] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [showHint, setShowHint] = useState(false);

  // Execution outputs
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sessionIdRef = useRef<string>(`sess_${Date.now()}`);
  const eventBufferRef = useRef<any[]>([]);

  useEffect(() => {
    // Load Question
    getQuestionDetail(questionId).then((res) => {
      setQuestion(res);
      setCode(res.starter_code || "");
      setLanguage(res.language || "python");
    }).catch(console.error);

    // Timer
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    // Keystroke telemetry listeners
    const handleBlur = () => {
      setTabSwitches((t) => t + 1);
      recordEvent("blur", { reason: "window_blur" });
    };

    const handleFocus = () => {
      recordEvent("focus", { reason: "window_focus" });
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [questionId]);

  const recordEvent = (type: string, payload: any = {}) => {
    const event = {
      offsetMs: elapsedSeconds * 1000,
      type,
      payload
    };
    eventBufferRef.current.push(event);

    if (eventBufferRef.current.length >= 10 || type === "paste") {
      uploadTelemetryEvents(sessionIdRef.current, eventBufferRef.current).catch(console.error);
      eventBufferRef.current = [];
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setKeystrokeCount((k) => k + 1);
    if (e.key === "Backspace" || e.key === "Delete") {
      setBackspaceCount((b) => b + 1);
      recordEvent("delete", { key: e.key });
    } else {
      recordEvent("key", { key: e.key });
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData("text");
    setPasteCount((p) => p + 1);
    recordEvent("paste", { char_count: pasted.length, text_preview: pasted.slice(0, 50) });
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    recordEvent("run", {});
    try {
      const res = await runCode(code, language, questionId);
      setRunResult(res);
    } catch (err: any) {
      setRunResult({ stdout: "", stderr: err.message, status: "error", passed_count: 0, total_count: 0 });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    recordEvent("submit", {});
    try {
      const userId = localStorage.getItem("brackyou_user") || "student_a";
      const res = await submitCode({
        student_id: userId,
        question_id: questionId,
        code,
        language,
        session_id: sessionIdRef.current
      });
      // Route to results dashboard with full 6 formats
      router.push(`/student/results/${sessionIdRef.current}`);
    } catch (err) {
      console.error(err);
      alert("Submission failed to complete. Redirecting to demo results...");
      router.push(`/student/results/session_demo_alex`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const backspaceRatio = keystrokeCount > 0 ? Math.round((backspaceCount / keystrokeCount) * 100) : 18;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Session Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-[2px] border-borderLight pb-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-accentTeal/15 border-[2px] border-accentTeal rounded-pill text-xs font-heading font-extrabold text-accentTeal flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accentTeal animate-pulse" />
            Session Live
          </span>
          <span className="text-sm font-mono font-bold text-textPrimary flex items-center gap-1">
            <Clock className="w-4 h-4 text-textMuted" />
            {formatTimer(elapsedSeconds)} elapsed
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/student/results/session_demo_alex" className="text-xs font-heading font-extrabold text-textSecondary hover:underline">
            View Sample Evaluated Result →
          </Link>
        </div>
      </div>

      {/* Question Header Card */}
      <div className="tiebreak-card p-6 bg-card space-y-2">
        <div className="flex justify-between items-start">
          <span className="text-xs font-heading font-extrabold text-accentOrange uppercase tracking-wider">
            Diagnostic Exercise — {question?.difficulty?.toUpperCase()}
          </span>
          <span className="text-[11px] font-bold text-textSecondary px-3 py-0.5 bg-cream rounded-pill border-[1.5px] border-borderLight">
            Adapted to your weak area
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-heading font-extrabold text-textPrimary">
          {question?.title || "Loading Exercise..."}
        </h1>
        <p className="text-sm font-semibold text-textSecondary whitespace-pre-line">
          {question?.prompt}
        </p>
      </div>

      {/* Main Workspace: Code Editor (Left) & Telemetry Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Code Editor (8 cols) */}
        <div className="lg:col-span-8 tiebreak-card bg-card p-4 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b-[2px] border-borderLight pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-accentRed" />
              <span className="w-3 h-3 rounded-full bg-accentYellow" />
              <span className="w-3 h-3 rounded-full bg-accentTeal" />
              <span className="text-xs font-mono font-bold text-textSecondary ml-2">solution.py</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-cream border-[2px] border-borderLight px-3 py-1 rounded-pill text-xs font-heading font-bold text-textPrimary"
              >
                <option value="python">Python 3.11</option>
                <option value="java">Java 17 (OOP)</option>
              </select>
            </div>
          </div>

          {/* Monaco-like Editor Textarea */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            rows={16}
            className="w-full bg-[#FFFDF7] font-mono text-sm p-4 rounded-xl border-[2px] border-borderLight focus:border-accentBrown focus:outline-none text-textPrimary resize-y leading-relaxed"
            placeholder="Type your code here..."
            spellCheck={false}
          />

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex gap-3">
              <PillButton variant="neutral" size="sm" onClick={handleRunCode} disabled={isRunning}>
                <Play className="w-3.5 h-3.5 fill-current text-accentTeal" />
                {isRunning ? "Running Sandbox..." : "Run Tests ▶"}
              </PillButton>
            </div>

            <PillButton variant="primary" size="md" onClick={handleSubmit} disabled={isSubmitting}>
              <Send className="w-4 h-4 mr-1" />
              {isSubmitting ? "Submitting..." : "Submit Solution"}
            </PillButton>
          </div>

          {/* Terminal / Run Results Output */}
          {runResult && (
            <div className="mt-4 p-4 rounded-xl bg-accentBrown text-cream font-mono text-xs space-y-2 border-[2px] border-accentBrown">
              <div className="flex items-center justify-between text-accentYellow border-b border-cream/20 pb-1">
                <span className="flex items-center gap-1.5 font-bold">
                  <Terminal className="w-4 h-4" /> Sandbox Execution Console
                </span>
                <span>Status: {runResult.status?.toUpperCase()}</span>
              </div>
              {runResult.stdout && <div>{runResult.stdout}</div>}
              {runResult.stderr && <div className="text-rose-300">{runResult.stderr}</div>}
              <div className="text-textMuted pt-1">
                Passed {runResult.passed_count}/{runResult.total_count} sample test cases.
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Integrity Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Integrity Panel Card */}
          <div className="tiebreak-card p-6 bg-card space-y-4">
            <div className="flex items-center justify-between border-b-[2px] border-borderLight pb-2">
              <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-textSecondary flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-accentTeal" />
                Integrity Panel
              </span>
              <span className="text-[10px] font-bold text-accentTeal bg-accentTeal/10 px-2 py-0.5 rounded-pill animate-pulse">
                ● Recording
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between font-semibold text-textSecondary">
                <span>Recorded Keystrokes:</span>
                <span className="font-mono font-bold text-textPrimary">{keystrokeCount}</span>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-textSecondary mb-1">
                  <span>Typing Rhythm:</span>
                  <span className="font-bold text-accentTeal">
                    {pasteCount > 0 ? "Irregular (Paste detected)" : "Natural Cadence"}
                  </span>
                </div>
                <SegmentedBar value={pasteCount > 0 ? 40 : 85} color={pasteCount > 0 ? "orange" : "teal"} totalBlocks={6} />
              </div>

              <div className="flex justify-between font-semibold text-textSecondary pt-1">
                <span>Tab Switches:</span>
                <span className={`font-mono font-bold ${tabSwitches > 3 ? "text-accentOrange" : "text-textPrimary"}`}>
                  {tabSwitches} {tabSwitches <= 2 ? "✅ (Normal)" : "⚠️"}
                </span>
              </div>

              <div className="flex justify-between font-semibold text-textSecondary">
                <span>Paste Events:</span>
                <span className="font-mono font-bold">
                  {pasteCount === 0 ? "0 ✅" : `${pasteCount} ⚠️`}
                </span>
              </div>

              <div className="flex justify-between font-semibold text-textSecondary">
                <span>Backspace Ratio:</span>
                <span className="font-mono font-bold">{backspaceRatio}%</span>
              </div>
            </div>

            <div className="pt-2 border-t-[1.5px] border-borderLight">
              <Link href="/student/results/session_demo_alex" className="text-xs font-heading font-extrabold text-accentTeal hover:underline block text-center">
                View Full Timeline Replay →
              </Link>
            </div>
          </div>

          {/* Socratic Hint Card */}
          <div className="tiebreak-card p-5 bg-accentYellow/15 border-accentBrown space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-extrabold uppercase text-textPrimary flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-accentOrange fill-current" />
                Socratic Hint
              </span>
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-[11px] font-heading font-extrabold text-accentOrange hover:underline"
              >
                {showHint ? "Hide Hint" : "Reveal Hint"}
              </button>
            </div>

            {showHint ? (
              <p className="text-xs font-semibold text-textPrimary leading-relaxed">
                &ldquo;Look at your constructor initialization: if `repo` is omitted or null at runtime,
                how does your class prevent a NullPointerException when `fetch_user` is invoked?
                Can you guarantee it is never null?&rdquo;
              </p>
            ) : (
              <p className="text-xs text-textMuted font-semibold">
                Stuck on constructor injection? Click reveal for an adaptive hint.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
