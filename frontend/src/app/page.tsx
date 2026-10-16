"use client";

import React from "react";
import Link from "next/link";
import { Zap, Compass, Code, ShieldAlert, Award, ArrowRight } from "lucide-react";
import { PillButton } from "@/components/ui/PillButton";
import { RibbonCard } from "@/components/ui/RibbonCard";

export default function HomePage() {
  const setDemoUser = (user: string) => {
    localStorage.setItem("brackyou_user", user);
    window.dispatchEvent(new Event("userChanged"));
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
      {/* Hero Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-pill bg-accentOrange/10 border-[2px] border-accentOrange text-xs font-heading font-extrabold text-accentOrange uppercase tracking-wider">
          <Zap className="w-4 h-4 fill-current" /> PS2 Hackathon Submission
        </div>

        <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-textPrimary tracking-tight">
          Adaptive Learning & Evidentiary Assessment Portal
        </h1>

        <p className="text-base font-semibold text-textSecondary leading-relaxed">
          Evaluates how students arrive at an answer, not just the code itself.
          Driven by Bayesian Knowledge Tracing over a Prerequisite DAG, hardened sandbox isolation, and millisecond keystroke telemetry.
        </p>

        <div className="pt-4 flex flex-wrap justify-center gap-4">
          <Link href="/student/dashboard" onClick={() => setDemoUser("student_a")}>
            <PillButton variant="primary" size="lg">
              Launch Student Journey <ArrowRight className="w-4 h-4 ml-1" />
            </PillButton>
          </Link>
          <Link href="/trainer">
            <PillButton variant="secondary" size="lg">
              Open Trainer Console <ShieldAlert className="w-4 h-4 ml-1" />
            </PillButton>
          </Link>
        </div>
      </div>

      {/* Demo Persona Cards */}
      <div className="space-y-4">
        <h2 className="text-center text-xs font-heading font-extrabold text-textSecondary uppercase tracking-widest">
          Choose a Live Demo Persona
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Persona 1: Student A */}
          <Link
            href="/student/dashboard"
            onClick={() => setDemoUser("student_a")}
            className="block group"
          >
            <RibbonCard ribbonText="ACCELERATED" ribbonColor="teal" className="h-full group-hover:border-accentOrange">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-accentTeal text-white font-heading font-extrabold text-base flex items-center justify-center border-[2px] border-accentBrown shadow-sm">
                  AC
                </div>
                <div>
                  <h3 className="text-lg font-heading font-extrabold text-textPrimary">Alex Chen</h3>
                  <span className="text-xs font-bold text-accentTeal block">Advanced Student (Mastery 78%)</span>
                </div>
                <p className="text-xs font-semibold text-textSecondary leading-relaxed">
                  OOP fundamentals are solid (92%). System skips recap and directs Alex straight to Dependency Injection and Spring Boot.
                </p>
                <span className="text-xs font-heading font-extrabold text-accentTeal group-hover:underline block pt-2">
                  Launch Alex&apos;s Path →
                </span>
              </div>
            </RibbonCard>
          </Link>

          {/* Persona 2: Student B */}
          <Link
            href="/student/dashboard"
            onClick={() => setDemoUser("student_b")}
            className="block group"
          >
            <RibbonCard ribbonText="REMEDIAL LOOP" ribbonColor="red" className="h-full group-hover:border-accentOrange">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-accentRed text-white font-heading font-extrabold text-base flex items-center justify-center border-[2px] border-accentBrown shadow-sm">
                  JM
                </div>
                <div>
                  <h3 className="text-lg font-heading font-extrabold text-textPrimary">Jonah Miller</h3>
                  <span className="text-xs font-bold text-accentRed block">Needs Prerequisite Help (Mastery 42%)</span>
                </div>
                <p className="text-xs font-semibold text-textSecondary leading-relaxed">
                  Weak prerequisite detected in Inheritance (25%). BKT engine blocks Spring Boot and routes Jonah to an Object Reference drill.
                </p>
                <span className="text-xs font-heading font-extrabold text-accentRed group-hover:underline block pt-2">
                  Launch Jonah&apos;s Divergent Path →
                </span>
              </div>
            </RibbonCard>
          </Link>

          {/* Persona 3: Trainer */}
          <Link
            href="/trainer"
            className="block group"
          >
            <RibbonCard ribbonText="INSTRUCTOR" ribbonColor="yellow" className="h-full group-hover:border-accentOrange">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-accentYellow text-textPrimary font-heading font-extrabold text-base flex items-center justify-center border-[2px] border-accentBrown shadow-sm">
                  SV
                </div>
                <div>
                  <h3 className="text-lg font-heading font-extrabold text-textPrimary">Dr. Sarah Vance</h3>
                  <span className="text-xs font-bold text-textPrimary block">Lead Trainer</span>
                </div>
                <p className="text-xs font-semibold text-textSecondary leading-relaxed">
                  Inspect the batch-wide Cohort Mastery Heatmap and review flagged sessions with timestamped replay scrubbing and human disposition.
                </p>
                <span className="text-xs font-heading font-extrabold text-textPrimary group-hover:underline block pt-2">
                  Open Trainer Heatmap →
                </span>
              </div>
            </RibbonCard>
          </Link>
        </div>
      </div>
    </div>
  );
}
