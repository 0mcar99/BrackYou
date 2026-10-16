"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Flame, UserCheck, ShieldAlert, Award, Compass, Code, LayoutDashboard } from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState("student_a");

  useEffect(() => {
    const saved = localStorage.getItem("brackyou_user");
    if (saved) setCurrentUser(saved);
  }, []);

  const handleUserChange = (userId: string) => {
    setCurrentUser(userId);
    localStorage.setItem("brackyou_user", userId);
    window.dispatchEvent(new Event("userChanged"));
  };

  const navLinks = [
    { href: "/student/dashboard", label: "My Dashboard", icon: LayoutDashboard },
    { href: "/student/learn", label: "Skill Tree (DAG)", icon: Compass },
    { href: "/student/assess/q_di_1", label: "Live Assessment", icon: Code },
    { href: "/student/results/session_demo_alex", label: "Results & Replay", icon: Award },
    { href: "/trainer", label: "Trainer Console", icon: ShieldAlert },
  ];

  return (
    <header className="w-full bg-card border-b-[2.5px] border-accentBrown px-6 py-3.5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link href="/student/dashboard" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-accentOrange border-[2.5px] border-accentBrown flex items-center justify-center text-white shadow-[0_2px_0_#4A2C1A]">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="font-heading text-xl text-textPrimary tracking-tight">BrackYou</span>
            <span className="text-[10px] font-bold tracking-widest text-accentTeal block uppercase -mt-1">
              Adaptive Portal
            </span>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 bg-cream/70 p-1.5 rounded-pill border-[2px] border-borderLight">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 rounded-pill text-xs font-heading font-extrabold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? "bg-accentBrown text-white shadow-[0_2px_0_#2D1B0E]"
                    : "text-textSecondary hover:text-textPrimary hover:bg-cream"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Demo User Switcher & Avatar */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1 text-xs font-semibold bg-cream px-3 py-1.5 rounded-pill border-[2px] border-borderLight">
            <span className="text-textMuted">Demo Persona:</span>
            <select
              value={currentUser}
              onChange={(e) => handleUserChange(e.target.value)}
              className="bg-transparent font-bold text-accentOrange cursor-pointer focus:outline-none"
            >
              <option value="student_a">Alex Chen (Advanced)</option>
              <option value="student_b">Jonah Miller (Remedial Loop)</option>
              <option value="trainer_1">Dr. Sarah Vance (Trainer)</option>
            </select>
          </div>

          <div className="w-9 h-9 rounded-full bg-accentYellow border-[2px] border-accentBrown flex items-center justify-center text-textPrimary font-heading font-bold text-sm shadow-[0_2px_0_#4A2C1A]">
            {currentUser === "student_a" ? "AC" : currentUser === "student_b" ? "JM" : "SV"}
          </div>
        </div>
      </div>
    </header>
  );
};
