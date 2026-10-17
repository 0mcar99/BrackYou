"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, ShieldAlert, Award, Compass, Code, LayoutDashboard, LogIn, UserCircle, Layers } from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState("student_a");
  const [userProfile, setUserProfile] = useState<any>(null);

  const syncUser = () => {
    const saved = localStorage.getItem("brackyou_user");
    if (saved) setCurrentUser(saved);
    const rawProfile = localStorage.getItem("brackyou_user_profile");
    if (rawProfile) {
      try {
        setUserProfile(JSON.parse(rawProfile));
      } catch (e) {
        setUserProfile(null);
      }
    } else {
      setUserProfile(null);
    }
  };

  useEffect(() => {
    syncUser();
    window.addEventListener("userChanged", syncUser);
    return () => window.removeEventListener("userChanged", syncUser);
  }, []);

  const handleUserChange = (userId: string) => {
    setCurrentUser(userId);
    localStorage.setItem("brackyou_user", userId);
    // remove custom profile if selecting predefined demo
    if (["student_a", "student_b", "trainer_1"].includes(userId)) {
      const demoProfiles: Record<string, any> = {
        student_a: { id: "student_a", name: "Alex Chen", role: "student", email: "alex@brackyou.dev", phone_number: "+1-555-0101" },
        student_b: { id: "student_b", name: "Jonah Miller", role: "student", email: "jonah@brackyou.dev", phone_number: "+1-555-0102" },
        trainer_1: { id: "trainer_1", name: "Dr. Sarah Vance", role: "trainer", email: "sarah.vance@brackyou.dev", phone_number: "+1-555-0105" },
      };
      localStorage.setItem("brackyou_user_profile", JSON.stringify(demoProfiles[userId]));
      setUserProfile(demoProfiles[userId]);
    }
    window.dispatchEvent(new Event("userChanged"));
  };

  const navLinks = [
    { href: "/student/dashboard", label: "My Dashboard", icon: LayoutDashboard },
    { href: "/dashboard", label: "Mastery Hub", icon: Layers },
    { href: "/student/learn", label: "Skill Tree (DAG)", icon: Compass },
    { href: "/student/assess/q_di_1", label: "Live Assessment", icon: Code },
    { href: "/student/results/session_demo_alex", label: "Results & Replay", icon: Award },
    { href: "/trainer", label: "Trainer Console", icon: ShieldAlert },
  ];

  const getInitials = () => {
    if (userProfile?.name) {
      const parts = userProfile.name.split(" ");
      return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0].slice(0, 2).toUpperCase();
    }
    if (currentUser === "student_a") return "AC";
    if (currentUser === "student_b") return "JM";
    if (currentUser === "trainer_1") return "SV";
    return "ST";
  };

  const displayName = userProfile?.name || (currentUser === "student_a" ? "Alex Chen" : currentUser === "student_b" ? "Jonah Miller" : currentUser === "trainer_1" ? "Dr. Sarah Vance" : "Student");

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

        {/* Demo User Switcher & Portal Action */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1 text-xs font-semibold bg-cream px-3 py-1.5 rounded-pill border-[2px] border-borderLight">
            <span className="text-textMuted">Persona:</span>
            <select
              value={currentUser}
              onChange={(e) => handleUserChange(e.target.value)}
              className="bg-transparent font-bold text-accentOrange cursor-pointer focus:outline-none"
            >
              <option value="student_a">Alex Chen (Advanced)</option>
              <option value="student_b">Jonah Miller (Remedial)</option>
              <option value="trainer_1">Dr. Sarah Vance (Trainer)</option>
              {userProfile && !["student_a", "student_b", "trainer_1"].includes(userProfile.id) && (
                <option value={userProfile.id}>{userProfile.name} (Custom)</option>
              )}
            </select>
          </div>

          {/* Link to Login Portal */}
          <Link
            href="/login"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-pill border-[2px] border-accentBrown bg-cream hover:bg-card text-textPrimary text-xs font-heading font-extrabold shadow-[0_2px_0_#2D1B0E] transition-all"
            title="Student / Trainer Login Portal"
          >
            <LogIn className="w-3.5 h-3.5 text-accentOrange" />
            <span>Portal</span>
          </Link>

          {/* User Initials Avatar */}
          <Link
            href="/login"
            title={`Logged in as ${displayName} (${userProfile?.email || "Demo"})`}
            className="w-9 h-9 rounded-full bg-accentYellow border-[2px] border-accentBrown flex items-center justify-center text-textPrimary font-heading font-bold text-xs shadow-[0_2px_0_#4A2C1A] hover:scale-105 transition-transform"
          >
            {getInitials()}
          </Link>
        </div>
      </div>
    </header>
  );
};
