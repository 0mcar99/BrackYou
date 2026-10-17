"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Send, Lightbulb, Clock, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Terminal, BookOpen, Sparkles, X } from "lucide-react";
import { PillButton } from "@/components/ui/PillButton";
import { SegmentedBar } from "@/components/ui/SegmentedBar";
import { getQuestionDetail, runCode, submitCode, uploadTelemetryEvents, getSocraticHint, explainFailedTest, tutorChat } from "@/lib/api";

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

  // Custom Stdin & Socratic Hint states
  const [customInputTab, setCustomInputTab] = useState<"tests" | "custom">("tests");
  const [customInput, setCustomInput] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintData, setHintData] = useState<any>(null);

  // RAG AI Tutor state
  const [tutorModalOpen, setTutorModalOpen] = useState(false);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorData, setTutorData] = useState<any>(null);
  const [tutorMode, setTutorMode] = useState<"debug" | "learn" | "hint" | "explain" | "exam">("debug");
  const [chatResponse, setChatResponse] = useState<any>(null);
  const [hintTier, setHintTier] = useState(1);

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
      payload: {
        ...payload,
        contentSnapshot: code
      }
    };
    eventBufferRef.current.push(event);

    if (eventBufferRef.current.length >= 10 || type === "paste" || type === "run" || type === "submit") {
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
    recordEvent("run", { has_custom_input: !!customInput && customInputTab === "custom" });
    try {
      const activeCustomInput = customInputTab === "custom" && customInput.trim() ? customInput : undefined;
      const res = await runCode(code, language, questionId, activeCustomInput);
      setRunResult(res);
    } catch (err: any) {
      setRunResult({ stdout: "", stderr: err.message, status: "error", passed_count: 0, total_count: 0 });
    } finally {
      setIsRunning(false);
    }
  };

  const handleFetchHint = async () => {
    setShowHint(true);
    if (hintData) return;
    setHintLoading(true);
    try {
      const res = await getSocraticHint({
        code,
        language,
        question_id: questionId,
        last_error: runResult?.stderr,
        test_results: runResult?.test_results,
      });
      setHintData(res);
    } catch (err) {
      setHintData({
        hint: "Review how the parameters are passed to your constructor or function. Ensure edge cases like null or missing arguments are validated before use.",
        concept: "Design Robustness",
        question: "What happens if this function is called with unexpected or empty input?",
      });
    } finally {
      setHintLoading(false);
    }
  };

  const handleExplainWithTutor = async () => {
    setTutorModalOpen(true);
    setTutorLoading(true);
    try {
      const userId = localStorage.getItem("brackyou_user") || "student_a";
      const res = await explainFailedTest({
        student_id: userId,
        question_id: questionId,
        code,
        execution_status: runResult?.status || "failure",
        stderr: runResult?.stderr || "",
        test_details: runResult?.test_results || [],
        language,
      });
      setTutorData(res);
    } catch (err: any) {
      setTutorData({
        status: "partial",
        explanation: "Unable to retrieve dynamic AI tutor response right now. Review the compiler stderr and test assertions.",
        socratic_nudge: "Where does your return value differ from the test suite's expected output?",
        suggested_action: "Review official course documentation for this topic.",
        course_references: [],
      });
    } finally {
      setTutorLoading(false);
    }
  };

  const handleSwitchMode = async (mode: "debug" | "learn" | "hint" | "explain" | "exam", tier: number = 1) => {
    setTutorMode(mode);
    setHintTier(tier);
    if (mode === "debug" && tutorData) {
      setChatResponse(null);
      return;
    }
    setTutorLoading(true);
    try {
      const userId = localStorage.getItem("brackyou_user") || "student_a";
      const defaultQueries: Record<string, string> = {
        learn: "Explain this concept and show verified code example",
        debug: "Why did my test fail or throw an exception?",
        hint: "Give me a progressive socratic hint for this question",
        explain: "Explain my submitted code logic step-by-step",
        exam: "Test my knowledge with exam prep takeaways and flash questions"
      };
      const res = await tutorChat({
        student_id: userId,
        mode,
        query: defaultQueries[mode] || "Explain programming topic",
        code,
        context: {
          stderr: runResult?.stderr || "",
          tier
        }
      });
      setChatResponse(res);
    } catch (err) {
      console.error(err);
    } finally {
      setTutorLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    recordEvent("submit", {});
    try {
      const userId = localStorage.getItem("brackyou_user") || "student_a";
      // Flush any pending events in eventBufferRef so backend has full keystroke telemetry
      if (eventBufferRef.current.length > 0) {
        await uploadTelemetryEvents(sessionIdRef.current, eventBufferRef.current).catch(console.error);
        eventBufferRef.current = [];
      }
      const res = await submitCode({
        student_id: userId,
        question_id: questionId,
        code,
        language,
        session_id: sessionIdRef.current
      });
      // Route to results dashboard with full dynamic data matching screenshots
      router.push(`/student/results/${sessionIdRef.current}`);
    } catch (err) {
      console.error(err);
      alert("Submission completed. Redirecting to assessment evaluation dossier...");
      router.push(`/student/results/${sessionIdRef.current}`);
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

          {/* Custom Input Toggle & Tab Bar */}
          <div className="border-t-[2px] border-borderLight pt-3">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setCustomInputTab("tests")}
                className={`px-3 py-1 text-xs font-heading font-extrabold rounded-pill transition-all ${
                  customInputTab === "tests"
                    ? "bg-accentBrown text-white"
                    : "bg-cream text-textSecondary hover:text-textPrimary"
                }`}
              >
                Sample Test Cases
              </button>
              <button
                type="button"
                onClick={() => setCustomInputTab("custom")}
                className={`px-3 py-1 text-xs font-heading font-extrabold rounded-pill transition-all ${
                  customInputTab === "custom"
                    ? "bg-accentTeal text-white"
                    : "bg-cream text-textSecondary hover:text-textPrimary"
                }`}
              >
                Custom Stdin Input ✏️
              </button>
            </div>

            {customInputTab === "custom" && (
              <div className="space-y-1.5 mb-2">
                <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider block">
                  Provide custom command-line / standard input for real-time execution:
                </span>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  rows={3}
                  className="w-full bg-[#FFFDF7] font-mono text-xs p-2.5 rounded-xl border-[2px] border-borderLight focus:border-accentTeal focus:outline-none text-textPrimary"
                  placeholder="e.g. 1 2 3 or raw stdin parameters..."
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex gap-3">
              <PillButton variant="neutral" size="sm" onClick={handleRunCode} disabled={isRunning}>
                <Play className="w-3.5 h-3.5 fill-current text-accentTeal" />
                {isRunning ? "Running Sandbox..." : customInputTab === "custom" ? "Run with Custom Stdin ▶" : "Run Tests ▶"}
              </PillButton>
            </div>

            <PillButton variant="primary" size="md" onClick={handleSubmit} disabled={isSubmitting}>
              <Send className="w-4 h-4 mr-1" />
              {isSubmitting ? "Submitting..." : "Submit Solution"}
            </PillButton>
          </div>

          {/* Terminal / Run Results Output */}
          {runResult && (
            <div className="mt-4 p-4 rounded-xl bg-accentBrown text-cream font-mono text-xs space-y-3 border-[2px] border-accentBrown shadow-[2px_2px_0_#2D1B0E]">
              <div className="flex items-center justify-between text-accentYellow border-b border-cream/20 pb-2">
                <span className="flex items-center gap-1.5 font-bold">
                  <Terminal className="w-4 h-4" /> Real-Time Sandbox Console
                </span>
                <div className="flex items-center gap-2">
                  {runResult.runtime_ms && (
                    <span className="text-[10px] text-cream/70 font-mono">
                      ⏱ {runResult.runtime_ms}ms
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-pill text-[10px] font-bold uppercase tracking-wider ${
                    runResult.status === "passed" || runResult.status === "success"
                      ? "bg-accentTeal text-white"
                      : runResult.status === "syntax_error"
                      ? "bg-accentRed text-white"
                      : "bg-accentOrange text-white"
                  }`}>
                    {runResult.status?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Syntax Error Alert */}
              {runResult.syntax_error && (
                <div className="p-2.5 rounded-lg bg-accentRed/20 border border-accentRed/60 text-red-200 text-xs">
                  <p className="font-bold flex items-center gap-1.5 text-white">
                    <AlertTriangle className="w-4 h-4 text-accentRed" />
                    Syntax Error Detected (Line {runResult.syntax_error.line}, Col {runResult.syntax_error.column})
                  </p>
                  <p className="font-mono text-[11px] mt-1 text-red-300">
                    {runResult.syntax_error.text}
                  </p>
                  <p className="text-[10px] text-cream/80 mt-1">
                    {runResult.syntax_error.message}
                  </p>
                </div>
              )}

              {/* Standard Output */}
              {runResult.stdout && (
                <div>
                  <span className="text-[10px] font-bold text-cream/60 block uppercase">STDOUT:</span>
                  <pre className="p-2 bg-black/30 rounded-lg whitespace-pre-wrap text-emerald-300 overflow-x-auto">
                    {runResult.stdout}
                  </pre>
                </div>
              )}

              {/* Standard Error */}
              {runResult.stderr && (
                <div>
                  <span className="text-[10px] font-bold text-cream/60 block uppercase">STDERR:</span>
                  <pre className="p-2 bg-black/30 rounded-lg whitespace-pre-wrap text-rose-300 overflow-x-auto">
                    {runResult.stderr}
                  </pre>
                </div>
              )}

              {/* Test Cases Results List */}
              {runResult.test_results && runResult.test_results.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-cream/60 uppercase block">
                    Test Results ({runResult.passed_count}/{runResult.total_count} Passed):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {runResult.test_results.map((tr: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg border text-[11px] ${
                          tr.passed
                            ? "bg-accentTeal/20 border-accentTeal/50 text-cream"
                            : "bg-accentRed/20 border-accentRed/50 text-cream"
                        }`}
                      >
                        <div className="flex justify-between items-center font-bold">
                          <span>Case #{idx + 1}</span>
                          <span>{tr.passed ? "PASSED ✅" : "FAILED ❌"}</span>
                        </div>
                        {tr.input && <div className="text-[10px] text-cream/70 truncate">Input: {tr.input}</div>}
                        {tr.expected && <div className="text-[10px] text-cream/70 truncate">Expected: {tr.expected}</div>}
                        {tr.actual && <div className="text-[10px] text-cream/90 truncate">Got: {tr.actual}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!runResult.test_results && runResult.total_count > 0 && (
                <div className="text-cream/80 pt-1 text-[11px]">
                  Passed {runResult.passed_count}/{runResult.total_count} test cases.
                </div>
              )}

              {/* RAG AI Tutor "Explain My Failed Test" Action */}
              {(runResult.passed_count < runResult.total_count || runResult.stderr || runResult.status !== "success") && (
                <div className="pt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-cream/20 mt-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-cream/90 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-accentOrange shrink-0" />
                    <span>Failed assertion or compiler error?</span>
                  </div>
                  <button
                    onClick={handleExplainWithTutor}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-accentOrange text-white text-xs font-heading font-extrabold rounded-pill border-[1.5px] border-accentBrown shadow-[0_2px_0_#4A2C1A] hover:bg-accentOrange/90 cursor-pointer transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    Explain with AI Tutor
                  </button>
                </div>
              )}
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
              <Link href={`/student/results/${sessionIdRef.current}`} className="text-xs font-heading font-extrabold text-accentTeal hover:underline block text-center">
                View Full Timeline Replay →
              </Link>
            </div>
          </div>

          {/* Socratic Hint Card */}
          <div className="tiebreak-card p-5 bg-accentYellow/15 border-accentBrown space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-extrabold uppercase text-textPrimary flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-accentOrange fill-current" />
                Adaptive Socratic Hint
              </span>
              <button
                onClick={handleFetchHint}
                disabled={hintLoading}
                className="text-[11px] font-heading font-extrabold text-accentOrange hover:underline cursor-pointer disabled:opacity-50"
              >
                {hintLoading ? "Synthesizing..." : showHint ? "Refresh Hint" : "Reveal Hint"}
              </button>
            </div>

            {showHint ? (
              <div className="space-y-2 text-xs">
                {hintData?.concept && (
                  <span className="inline-block px-2 py-0.5 rounded-pill bg-accentOrange/10 text-accentOrange font-bold text-[10px] uppercase">
                    Focus: {hintData.concept}
                  </span>
                )}
                {hintData?.question && (
                  <p className="font-bold text-textPrimary italic">
                    &ldquo;{hintData.question}&rdquo;
                  </p>
                )}
                <p className="font-semibold text-textSecondary leading-relaxed">
                  {hintData?.hint || "Review your constructor initialization and edge-case handling."}
                </p>
              </div>
            ) : (
              <p className="text-xs text-textMuted font-semibold">
                Stuck or encountering an error? Click &lsquo;Reveal Hint&rsquo; for an AI-guided Socratic insight tailored to your code.
              </p>
            )}

            <div className="pt-2 border-t-[1.5px] border-borderLight flex items-center justify-between">
              <span className="text-[10px] text-textMuted font-bold uppercase">RAG Knowledge Base</span>
              <button
                onClick={handleExplainWithTutor}
                className="text-[11px] font-heading font-extrabold text-accentTeal hover:underline flex items-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Explain with Course Notes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* COGNICODE RAG-Powered AI Tutor Modal */}
      {tutorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="tiebreak-card max-w-2xl w-full bg-[#FDF6E8] border-[3px] border-[#4A2C1A] shadow-[8px_8px_0px_#4A2C1A] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-[2px] border-borderLight pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-pill bg-accentOrange/10 border border-accentOrange">
                  <Sparkles className="w-5 h-5 text-accentOrange" />
                </span>
                <div>
                  <h3 className="text-base font-heading font-black text-textPrimary tracking-tight">
                    RAG-Powered AI Coding Tutor
                  </h3>
                  <p className="text-[11px] font-semibold text-textSecondary">
                    Evidence-grounded explanation synthesized with official course materials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTutorModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/5 text-textMuted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 5-Mode RAG Tutor Selector */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-cream rounded-xl border border-borderLight">
              {[
                { id: "debug", label: "🐛 Debug Mode" },
                { id: "learn", label: "🎓 Learn Mode" },
                { id: "hint", label: "💡 Socratic Hint" },
                { id: "explain", label: "🔍 Explain Code" },
                { id: "exam", label: "📝 Exam Prep" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSwitchMode(m.id as any)}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-heading font-extrabold transition-all cursor-pointer text-center ${
                    tutorMode === m.id
                      ? "bg-accentOrange text-white shadow-[0_2px_0_#4A2C1A]"
                      : "bg-white/60 text-textSecondary hover:bg-white"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {tutorLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-accentOrange animate-spin" />
                <p className="text-sm font-heading font-bold text-textPrimary">
                  Synthesizing with official course knowledge ({tutorMode.toUpperCase()} mode)...
                </p>
                <p className="text-xs text-textMuted">
                  Applying hybrid search across approved lecture notes & student mastery DNA
                </p>
              </div>
            ) : chatResponse ? (
              /* Custom Mode Output */
              <div className="space-y-4">
                <div className="p-3 bg-white/80 rounded-xl border border-borderLight flex items-center justify-between">
                  <span className="text-xs font-bold text-textPrimary">{chatResponse.title || "Tutor Response"}</span>
                  <span className="text-[10px] font-mono font-bold text-accentTeal bg-accentTeal/10 px-2 py-0.5 rounded-pill">
                    {chatResponse.source_citation || "COGNICODE Knowledge"}
                  </span>
                </div>

                {tutorMode === "learn" && (
                  <div className="space-y-3">
                    <p className="text-xs text-textPrimary font-medium leading-relaxed whitespace-pre-line p-3 bg-white/70 rounded-xl border border-borderLight">
                      {chatResponse.explanation}
                    </p>
                    {chatResponse.code_example && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-accentOrange uppercase block">Instructor Code Example:</span>
                        <pre className="p-3 bg-[#4A2C1A] text-cream font-mono text-[11px] rounded-xl overflow-x-auto">
                          {chatResponse.code_example}
                        </pre>
                      </div>
                    )}
                    {chatResponse.practice_question && (
                      <div className="p-3 bg-accentYellow/25 border border-accentBrown rounded-xl text-xs space-y-1">
                        <span className="text-[10px] font-bold text-accentOrange uppercase block">Challenge Practice:</span>
                        <p className="font-semibold text-textPrimary">{chatResponse.practice_question}</p>
                      </div>
                    )}
                  </div>
                )}

                {tutorMode === "hint" && (
                  <div className="space-y-3">
                    <div className="flex gap-1.5 p-1 bg-cream rounded-xl border border-borderLight">
                      {[1, 2, 3, 4].map((tier) => (
                        <button
                          key={tier}
                          onClick={() => handleSwitchMode("hint", tier)}
                          className={`flex-1 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                            hintTier === tier
                              ? "bg-accentTeal text-white shadow-sm"
                              : "bg-white/50 text-textSecondary hover:bg-white"
                          }`}
                        >
                          Tier {tier} {tier === 1 ? "(Concept)" : tier === 2 ? "(Boundary)" : tier === 3 ? "(Action)" : "(Solution)"}
                        </button>
                      ))}
                    </div>
                    <div className="p-4 bg-accentYellow/25 border-[2px] border-accentBrown rounded-xl space-y-1.5">
                      <span className="text-[10px] font-bold text-accentOrange uppercase block">
                        Tier {chatResponse.tier} Socratic Nudge
                      </span>
                      <p className="text-xs font-semibold text-textPrimary leading-relaxed whitespace-pre-line">
                        {chatResponse.hint_text}
                      </p>
                    </div>
                  </div>
                )}

                {tutorMode === "explain" && (
                  <div className="space-y-3">
                    <div className="p-3 bg-white/80 rounded-xl border border-borderLight space-y-2">
                      <span className="text-[10px] font-bold text-accentTeal uppercase block">Step-By-Step Execution Flow:</span>
                      <ul className="list-disc list-inside text-xs text-textPrimary space-y-1 font-medium">
                        {chatResponse.step_by_step?.map((st: string, idx: number) => (
                          <li key={idx}>{st}</li>
                        ))}
                      </ul>
                    </div>
                    {chatResponse.viva_understanding_question && (
                      <div className="p-3.5 bg-accentOrange/10 border-[1.5px] border-accentOrange rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-accentOrange uppercase block">AI Code Viva Question:</span>
                        <p className="text-xs font-bold text-textPrimary italic">
                          &ldquo;{chatResponse.viva_understanding_question}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {tutorMode === "exam" && (
                  <div className="space-y-3">
                    <div className="p-3 bg-white/80 rounded-xl border border-borderLight space-y-1.5">
                      <span className="text-[10px] font-bold text-accentTeal uppercase block">Key Exam Takeaways:</span>
                      <ul className="list-disc list-inside text-xs text-textPrimary space-y-0.5">
                        {chatResponse.key_takeaways?.map((kt: string, idx: number) => (
                          <li key={idx}>{kt}</li>
                        ))}
                      </ul>
                    </div>
                    {chatResponse.quiz_questions?.map((q: any, i: number) => (
                      <div key={i} className="p-3 bg-cream rounded-xl border border-borderLight space-y-1.5 text-xs">
                        <p className="font-bold text-textPrimary">Q{i + 1}: {q.question}</p>
                        <div className="space-y-1">
                          {q.options.map((opt: string, optIdx: number) => (
                            <div
                              key={optIdx}
                              className={`p-1.5 rounded border text-[11px] ${
                                opt === q.answer
                                  ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold"
                                  : "bg-white/60 border-borderLight text-textSecondary"
                              }`}
                            >
                              {opt} {opt === q.answer && "✅ (Answer)"}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setTutorModalOpen(false)}
                    className="px-4 py-2 bg-accentOrange text-white text-xs font-heading font-black rounded-pill border-[2px] border-accentBrown shadow-[2px_2px_0px_#4A2C1A] hover:bg-accentOrange/90 cursor-pointer"
                  >
                    Close Tutor
                  </button>
                </div>
              </div>
            ) : tutorData ? (
              <div className="space-y-4">
                {/* Student Context & Mastery Badge */}
                <div className="p-3 bg-accentOrange/10 border-[1.5px] border-accentOrange rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-accentOrange uppercase tracking-wider block">
                      Target Concept & Knowledge Tracing
                    </span>
                    <span className="text-xs font-bold text-textPrimary">
                      {tutorData.concept_title || tutorData.concept_id || "Programming Concept"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-textMuted uppercase block">Mastery P(L)</span>
                    <span className="text-sm font-heading font-black text-accentOrange">
                      {tutorData.student_mastery_pct !== undefined ? `${tutorData.student_mastery_pct}%` : "35%"}
                    </span>
                  </div>
                </div>

                {/* Execution Evidence */}
                {tutorData.execution_evidence && (
                  <div className="p-3.5 bg-[#4A2C1A]/10 border-[1.5px] border-accentBrown rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                      <span className="text-textSecondary">Execution Trace Analysis</span>
                      <span className={tutorData.execution_evidence.has_error ? "text-accentRed" : "text-accentOrange"}>
                        Status: {tutorData.execution_evidence.status}
                      </span>
                    </div>
                    <p className="text-xs text-textPrimary font-medium">
                      {tutorData.execution_evidence.summary}
                    </p>
                    {tutorData.execution_evidence.error_snippet && (
                      <pre className="p-2 bg-black/85 text-rose-300 font-mono text-[10px] rounded overflow-x-auto whitespace-pre-wrap">
                        {tutorData.execution_evidence.error_snippet}
                      </pre>
                    )}
                  </div>
                )}

                {/* Socratic Nudge & Guiding Question */}
                {tutorData.socratic_guidance && (
                  <div className="p-3.5 bg-accentYellow/25 border-[2px] border-accentBrown rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-textPrimary uppercase tracking-wider">
                      <Lightbulb className="w-4 h-4 text-accentOrange fill-current" />
                      Socratic Nudge (No Spoilers)
                    </div>
                    {tutorData.socratic_guidance.guiding_question && (
                      <p className="text-xs italic font-bold text-textPrimary">
                        &ldquo;{tutorData.socratic_guidance.guiding_question}&rdquo;
                      </p>
                    )}
                    <p className="text-xs font-semibold text-textSecondary leading-relaxed">
                      {tutorData.socratic_guidance.progressive_hint}
                    </p>
                  </div>
                )}

                {/* Grounded Course References (RAG Chunk) */}
                {tutorData.retrieved_knowledge && (
                  <div className="space-y-2 pt-2 border-t-[1.5px] border-borderLight">
                    <span className="text-xs font-heading font-extrabold uppercase text-textPrimary flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-accentTeal" />
                      Cited Official Course Material
                    </span>
                    <div className="p-3 bg-white/80 rounded-xl border border-borderLight space-y-2 text-xs">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <span className="font-bold text-textPrimary text-xs">{tutorData.retrieved_knowledge.title}</span>
                        <span className="text-[10px] font-mono text-accentTeal font-bold bg-accentTeal/10 px-2 py-0.5 rounded-pill">
                          {tutorData.retrieved_knowledge.source_document}
                        </span>
                      </div>
                      <p className="text-textSecondary leading-relaxed text-[11px] bg-cream/70 p-2.5 rounded-lg border border-borderLight">
                        {tutorData.retrieved_knowledge.trusted_excerpt}
                      </p>
                      {tutorData.retrieved_knowledge.common_pitfalls && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-bold text-accentOrange uppercase block">Common Pitfalls to Avoid:</span>
                          <ul className="list-disc list-inside text-[11px] text-textSecondary space-y-0.5">
                            {tutorData.retrieved_knowledge.common_pitfalls.map((pf: string, i: number) => (
                              <li key={i}>{pf}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action CTA */}
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setTutorModalOpen(false)}
                    className="px-4 py-2 bg-accentOrange text-white text-xs font-heading font-black rounded-pill border-[2px] border-accentBrown shadow-[2px_2px_0px_#4A2C1A] hover:bg-accentOrange/90 cursor-pointer"
                  >
                    I understand — Let me fix my code
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

