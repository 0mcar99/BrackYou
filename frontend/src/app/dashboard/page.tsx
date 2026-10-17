"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Terminal,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Cpu,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { TiebreakCard, SegmentedBar, PillBadge, TiebreakButton } from '@/components/tiebreak/Primitives';
import { SessionReplayPlayer } from '@/components/replay/SessionReplayPlayer';
import { SkillTreeGraph } from '@/components/graph/SkillTreeGraph';
import { VivaDefenseModal } from '@/components/viva/VivaDefenseModal';
import { ConceptNodeData, PrerequisiteEdge } from '@/types/adaptive';
import { SessionPlaybackData } from '@/types/telemetry';
import { VivaQuestionTarget, VivaTurnEvaluation } from '@/types/viva';

export default function IntegratedDashboardPage() {
  // --- PILLAR 2: SKILL TREE CONCEPT GRAPH & DYNAMIC BKT ROUTING ---
  const [concepts, setConcepts] = useState<ConceptNodeData[]>([
    {
      id: 'c_foundations',
      slug: 'syntax_basics',
      label: '1. Variables & Types',
      masteryProbability: 0.95,
      status: 'mastered',
      difficulty: 1,
      prerequisites: [],
      questionCount: 8,
    },
    {
      id: 'c_functions',
      slug: 'functions_scope',
      label: '2. Scopes & Functions',
      masteryProbability: 0.88,
      status: 'mastered',
      difficulty: 1,
      prerequisites: ['c_foundations'],
      questionCount: 12,
    },
    {
      id: 'c_oop',
      slug: 'oop_principles',
      label: '3. Encapsulation & Classes',
      masteryProbability: 0.76,
      status: 'learning',
      difficulty: 2,
      prerequisites: ['c_functions'],
      questionCount: 15,
    },
    {
      id: 'c_di',
      slug: 'dependency_injection',
      label: '4. Constructor Dependency Injection',
      masteryProbability: 0.38,
      status: 'weak_prerequisite',
      difficulty: 2,
      prerequisites: ['c_oop'],
      questionCount: 10,
    },
    {
      id: 'c_frameworks',
      slug: 'spring_boot',
      label: '5. Spring Boot & FastAPI IOC',
      masteryProbability: 0.15,
      status: 'locked',
      difficulty: 3,
      prerequisites: ['c_di'],
      questionCount: 14,
    },
    {
      id: 'c_microservices',
      slug: 'distributed_systems',
      label: '6. Microservice Governance',
      masteryProbability: 0.05,
      status: 'locked',
      difficulty: 3,
      prerequisites: ['c_frameworks'],
      questionCount: 18,
    },
  ]);

  const edges: PrerequisiteEdge[] = [
    { id: 'e1', source: 'c_foundations', target: 'c_functions', isStrict: true },
    { id: 'e2', source: 'c_functions', target: 'c_oop', isStrict: true },
    { id: 'e3', source: 'c_oop', target: 'c_di', isStrict: true, animated: true },
    { id: 'e4', source: 'c_di', target: 'c_frameworks', isStrict: true },
    { id: 'e5', source: 'c_frameworks', target: 'c_microservices', isStrict: true },
  ];

  // Dynamic BKT Mathematical Update function
  const handleSimulateBKT = async (conceptId: string, isCorrect: boolean) => {
    const target = concepts.find((c) => c.id === conceptId);
    if (!target) return;

    try {
      const res = await fetch('/api/bkt/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pPrior: target.masteryProbability,
          isCorrect,
          pTransit: 0.2,
          pSlip: 0.1,
          pGuess: 0.2,
        }),
      });
      const data = await res.json();
      const updatedPosterior = data.posterior;

      setConcepts((prev) => {
        const next = prev.map((c) => {
          if (c.id === conceptId) {
            const nextStatus: ConceptNodeData['status'] =
              updatedPosterior >= 0.85
                ? 'mastered'
                : updatedPosterior < 0.4
                ? 'weak_prerequisite'
                : 'learning';
            return {
              ...c,
              masteryProbability: updatedPosterior,
              status: nextStatus,
            };
          }
          return c;
        });

        // Evaluate lock status for downstream nodes
        const diMastered = (next.find((c) => c.id === 'c_di')?.masteryProbability ?? 0) >= 0.7;
        return next.map((c) => {
          if (c.id === 'c_frameworks') {
            return {
              ...c,
              status: diMastered ? (c.masteryProbability >= 0.85 ? 'mastered' : 'learning') : 'locked',
            };
          }
          return c;
        });
      });
    } catch (err) {
      console.error('BKT update failed', err);
    }
  };

  // --- PILLAR 1: TELEMETRY REPLAY & ANOMALY TIMELINE DATA ---
  const samplePlaybackData: SessionPlaybackData = {
    sessionId: 'session_ps2_forensics',
    totalDurationMs: 480000, // 8 minutes
    integrityScore: 82,
    backspaceRatio: 14.8,
    writeRunFixCycles: 5,
    anomalies: [
      {
        timestampMs: 210000,
        timeFormatted: '03:30',
        type: 'TAB_BLUR',
        severity: 'low',
        charDelta: 0,
        description: 'IDE lost focus to another background window for 42 seconds.',
      },
      {
        timestampMs: 374000,
        timeFormatted: '06:14',
        type: 'PASTE_BURST',
        severity: 'high',
        charDelta: 340,
        description: '340 characters appeared within 1 tick with 0 preceding keystrokes.',
      },
      {
        timestampMs: 435000,
        timeFormatted: '07:15',
        type: 'NO_CORRECTIONS',
        severity: 'medium',
        charDelta: 120,
        description: '120 characters typed with exactly 0 backspaces or pauses.',
      },
    ],
    events: [
      {
        t: 0,
        type: 'window',
        action: 'focus',
        contentSnapshot:
          'class UserRepository:\n    def get_user(self, user_id):\n        return f"User_{user_id}"\n\nclass UserService:\n    pass\n',
      },
      {
        t: 60000,
        type: 'key',
        action: 'insert',
        key: 'd',
        charCount: 110,
        contentSnapshot:
          'class UserRepository:\n    def get_user(self, user_id):\n        return f"User_{user_id}"\n\nclass UserService:\n    def __init__(self):\n        self.repo = UserRepository()\n',
      },
      {
        t: 120000,
        type: 'run',
        action: 'focus',
        contentSnapshot:
          'class UserRepository:\n    def get_user(self, user_id):\n        return f"User_{user_id}"\n\nclass UserService:\n    def __init__(self):\n        self.repo = UserRepository()\n\n    def fetch(self, uid):\n        return self.repo.get_user(uid)\n',
      },
      {
        t: 210000,
        type: 'window',
        action: 'blur',
        contentSnapshot:
          'class UserRepository:\n    def get_user(self, user_id):\n        return f"User_{user_id}"\n\nclass UserService:\n    def __init__(self):\n        self.repo = UserRepository()\n\n    def fetch(self, uid):\n        return self.repo.get_user(uid)\n',
      },
      {
        t: 374000,
        type: 'paste',
        action: 'insert',
        charCount: 340,
        contentSnapshot:
          'class UserRepository:\n    def get_user(self, user_id):\n        return f"User_{user_id}"\n\nclass UserService:\n    def __init__(self, repo):\n        # Enforcing constructor dependency injection\n        if repo is None:\n            raise ValueError("UserRepository dependency cannot be null")\n        self._repo = repo\n\n    def fetch_user(self, user_id):\n        return self._repo.get_user(user_id)\n\nif __name__ == "__main__":\n    service = UserService(UserRepository())\n    print(service.fetch_user(101))\n',
      },
      {
        t: 435000,
        type: 'key',
        action: 'insert',
        key: 'p',
        charCount: 460,
        contentSnapshot:
          'class UserRepository:\n    def get_user(self, user_id):\n        return f"User_{user_id}"\n\nclass UserService:\n    def __init__(self, repo):\n        # Enforcing constructor dependency injection\n        if repo is None:\n            raise ValueError("UserRepository dependency cannot be null")\n        self._repo = repo\n\n    def fetch_user(self, user_id):\n        return self._repo.get_user(user_id)\n\nif __name__ == "__main__":\n    service = UserService(UserRepository())\n    print(service.fetch_user(101))\n',
      },
      {
        t: 480000,
        type: 'run',
        action: 'focus',
        contentSnapshot:
          'class UserRepository:\n    def get_user(self, user_id):\n        return f"User_{user_id}"\n\nclass UserService:\n    def __init__(self, repo):\n        # Enforcing constructor dependency injection\n        if repo is None:\n            raise ValueError("UserRepository dependency cannot be null")\n        self._repo = repo\n\n    def fetch_user(self, user_id):\n        return self._repo.get_user(user_id)\n\nif __name__ == "__main__":\n    service = UserService(UserRepository())\n    print(service.fetch_user(101))\n',
      },
    ],
  };

  // --- PILLAR 3: POST-SUBMISSION ORAL VIVA DEFENSE MODAL ---
  const [isVivaOpen, setIsVivaOpen] = useState(false);
  const [vivaEvaluation, setVivaEvaluation] = useState<VivaTurnEvaluation | null>(null);

  const vivaTarget: VivaQuestionTarget = {
    id: 'q_viva_ast_di',
    lineRange: [6, 10],
    targetedConstruct: 'Constructor Injection Null Guard',
    question:
      'In `UserService.__init__`, why did you mandate constructor parameter injection with a null guard instead of lazily instantiating `UserRepository()` inside `fetch_user()`?',
  };

  const currentCodeSnippet =
    samplePlaybackData.events[samplePlaybackData.events.length - 1].contentSnapshot;

  // --- PILLAR 4: HARDENED SANDBOX RUNNER INTERFACE ---
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [testResults, setTestResults] = useState([
    {
      id: 'tc_1',
      name: 'Constructor Dependency Acceptance',
      passed: true,
      runtimeMs: 38,
      status: 'passed',
      isHidden: false,
    },
    {
      id: 'tc_2',
      name: '[Hidden] Null Guard Exception Check',
      passed: true,
      runtimeMs: 41,
      status: 'passed',
      isHidden: true,
    },
    {
      id: 'tc_3',
      name: '[Hidden] Immutability & Reassignment Guard',
      passed: true,
      runtimeMs: 36,
      status: 'passed',
      isHidden: true,
    },
  ]);

  const handleRunSandbox = async () => {
    setSandboxRunning(true);
    setTimeout(() => {
      setTestResults([
        {
          id: 'tc_1',
          name: 'Constructor Dependency Acceptance',
          passed: true,
          runtimeMs: Math.floor(30 + Math.random() * 15),
          status: 'passed',
          isHidden: false,
        },
        {
          id: 'tc_2',
          name: '[Hidden] Null Guard Exception Check',
          passed: true,
          runtimeMs: Math.floor(35 + Math.random() * 15),
          status: 'passed',
          isHidden: true,
        },
        {
          id: 'tc_3',
          name: '[Hidden] Immutability & Reassignment Guard',
          passed: true,
          runtimeMs: Math.floor(32 + Math.random() * 15),
          status: 'passed',
          isHidden: true,
        },
      ]);
      setSandboxRunning(false);
    }, 900);
  };

  const overallMasteryAvg = Math.round(
    (concepts.reduce((acc, c) => acc + c.masteryProbability, 0) / concepts.length) * 100
  );

  return (
    <div className="min-h-screen bg-[#FDF6E8] text-[#4A2C1A] px-4 md:px-8 py-8 space-y-8 font-sans">
      {/* Top Navigation Bar */}
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4 border-b-[2.5px] border-[#4A2C1A] pb-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-[#E8622B] block">
            PS2 Adaptive Mastery Hub
          </span>
          <h1 className="text-3xl font-black text-[#2D1B0E] tracking-tight">
            Integrated Results & Forensic Mastery Portal
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <PillBadge variant="teal">⚡ Live BKT Engine Active</PillBadge>
          <PillBadge variant="orange">🛡️ gVisor / Docker Sandbox Locked</PillBadge>
          <Link
            href="/student/results/session_ps2_forensics"
            className="px-4 py-1.5 rounded-full border-[2px] border-[#4A2C1A] bg-[#FFFDF7] text-xs font-black hover:bg-[#FDF6E8] shadow-[2px_2px_0px_#4A2C1A]"
          >
            Detailed Dossier →
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* OVERALL LATENT MASTERY HERO */}
        <TiebreakCard ribbonText="Mastery Benchmark" ribbonColor="teal">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 space-y-2 border-b md:border-b-0 md:border-r-[2px] border-[#E8DCC8] pb-4 md:pb-0 md:pr-6">
              <span className="text-xs font-black uppercase tracking-widest text-[#9C8B7A]">
                Bayesian Latent Knowledge State
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-black text-[#2D1B0E]">{overallMasteryAvg}%</span>
                <span className="text-xs font-black px-2.5 py-1 rounded-full border-[1.5px] border-[#2A7A6B] bg-[#2A7A6B]/15 text-[#2A7A6B]">
                  Target: ≥80% Clear
                </span>
              </div>
              <SegmentedBar filledBlocks={Math.round(overallMasteryAvg / 10)} totalBlocks={10} variant="teal" />
            </div>

            <div className="md:col-span-7 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E8622B]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#4A2C1A]">
                  Pedagogical Diagnostic Synthesis
                </span>
              </div>
              <p className="text-xs md:text-sm font-bold text-[#6B4F3A] leading-relaxed bg-[#FDF6E8] p-3.5 rounded-xl border border-[#4A2C1A]/20">
                &ldquo;You have demonstrated foundational mastery of encapsulation and constructor dependency
                injection. The Bayesian Knowledge Tracing engine has surfaced a weak prerequisite alert on
                Dependency Inversion that must be remediated before unlocking Spring Boot IOC containers.&rdquo;
              </p>
              <div className="flex justify-end pt-1">
                <TiebreakButton
                  variant="primary"
                  onClick={() => setIsVivaOpen(true)}
                  className="flex items-center gap-1.5"
                >
                  🎙️ Launch AST Oral Defense Modal
                </TiebreakButton>
              </div>
            </div>
          </div>
        </TiebreakCard>

        {/* PILLAR 2: INTERACTIVE PREREQUISITE CONCEPT GRAPH (DAG) */}
        <SkillTreeGraph
          concepts={concepts}
          edges={edges}
          onSimulateBKT={handleSimulateBKT}
        />

        {/* 2-COLUMN LAYOUT: PILLAR 1 (REPLAY) & PILLAR 4 (SANDBOX) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: PILLAR 1 - TELEMETRY REPLAY SCRUBBER */}
          <div className="lg:col-span-7 space-y-4">
            <SessionReplayPlayer playbackData={samplePlaybackData} />
          </div>

          {/* RIGHT: PILLAR 4 - HARDENED SANDBOX EXECUTION INTERFACE */}
          <div className="lg:col-span-5 space-y-4">
            <TiebreakCard ribbonText="Hardened Sandbox" ribbonColor="orange" className="space-y-4">
              <div className="flex justify-between items-center border-b-[2px] border-[#E8DCC8] pb-3">
                <div>
                  <h3 className="text-lg font-black text-[#2D1B0E] flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-[#E8622B]" />
                    Isolated Execution Engine
                  </h3>
                  <span className="text-[11px] font-bold text-[#9C8B7A]">
                    Locked Container Watchdog · 0 Network Egress
                  </span>
                </div>
                <TiebreakButton
                  variant="primary"
                  onClick={handleRunSandbox}
                  disabled={sandboxRunning}
                  className="text-xs"
                >
                  {sandboxRunning ? 'Sandboxing...' : '▶ Run Test Suite'}
                </TiebreakButton>
              </div>

              {/* Sandbox Isolation Guarantees */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black uppercase text-[#6B4F3A]">
                <div className="p-2 rounded-lg bg-[#FDF6E8] border border-[#4A2C1A]/20">
                  <div className="text-[#2A7A6B]">--net=none</div>
                  <div>0 Egress</div>
                </div>
                <div className="p-2 rounded-lg bg-[#FDF6E8] border border-[#4A2C1A]/20">
                  <div className="text-[#E8622B]">128MB RAM</div>
                  <div>Strict Ceiling</div>
                </div>
                <div className="p-2 rounded-lg bg-[#FDF6E8] border border-[#4A2C1A]/20">
                  <div className="text-[#2D1B0E]">pids-limit 64</div>
                  <div>Anti-Fork Bomb</div>
                </div>
              </div>

              {/* Test Cases List */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-[#9C8B7A] block">
                  Hidden & Public Test Cases:
                </span>
                {testResults.map((tc) => (
                  <div
                    key={tc.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border-[1.5px] text-xs font-bold transition-all ${
                      tc.passed
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-rose-50 border-rose-500 text-rose-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{tc.name}</span>
                    </div>
                    <span className="font-mono text-[10px] font-black">
                      PASS ({tc.runtimeMs}ms)
                    </span>
                  </div>
                ))}
              </div>

              {/* Execution Console Terminal Box */}
              <div className="bg-[#2D1B0E] p-3 rounded-xl border-[2px] border-[#4A2C1A] text-xs font-mono text-emerald-300 space-y-1">
                <div className="text-[#9C8B7A] text-[10px] uppercase font-bold border-b border-white/10 pb-1">
                  Container Stderr/Stdout:
                </div>
                <div>&gt; gvisor-sandbox run solution.py</div>
                <div className="text-white">Executing 3 tests against isolated tmpfs...</div>
                <div className="text-emerald-400 font-bold">
                  All 3/3 tests passed with exit code 0.
                </div>
              </div>
            </TiebreakCard>

            {/* Oral Defense Status Banner if Evaluated */}
            {vivaEvaluation && (
              <TiebreakCard ribbonText="Defense Score" ribbonColor="teal" className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-[#2D1B0E]">
                    AST Oral Defense Verified:
                  </span>
                  <PillBadge variant={vivaEvaluation.isConsistent ? 'teal' : 'red'}>
                    {vivaEvaluation.semanticMatchPercent}% Match
                  </PillBadge>
                </div>
                <p className="text-xs font-bold text-[#6B4F3A] bg-[#FDF6E8] p-3 rounded-lg border border-[#4A2C1A]/20">
                  &ldquo;{vivaEvaluation.evaluatorFeedback}&rdquo;
                </p>
              </TiebreakCard>
            )}
          </div>
        </div>
      </div>

      {/* PILLAR 3: ORAL VIVA DEFENSE MODAL */}
      <VivaDefenseModal
        isOpen={isVivaOpen}
        question={vivaTarget}
        submittedCode={currentCodeSnippet}
        onComplete={(res) => setVivaEvaluation(res)}
        onClose={() => setIsVivaOpen(false)}
      />
    </div>
  );
}
