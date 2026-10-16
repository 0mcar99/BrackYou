"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  User,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  BrainCircuit,
  Terminal,
  Activity
} from "lucide-react";
import { registerUser, loginUser } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("register");

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeSessionUser, setActiveSessionUser] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem("brackyou_user_profile");
    if (raw) {
      try {
        setActiveSessionUser(JSON.parse(raw));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setErrorMessage("Please enter a valid phone number (at least 7 digits).");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser({
        name: name.trim(),
        phone_number: phone.trim(),
        email: email.trim(),
        password,
        role,
      });

      setSuccessMessage(`Account created successfully! Welcome, ${res.user.name}. Redirecting...`);
      localStorage.setItem("brackyou_user", res.user.id);
      localStorage.setItem("brackyou_user_profile", JSON.stringify(res.user));
      window.dispatchEvent(new Event("userChanged"));

      setTimeout(() => {
        if (res.user.role === "trainer") {
          router.push("/trainer");
        } else {
          router.push("/student/dashboard");
        }
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || "Registration failed. Please check inputs and retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const identifier = (email || phone).trim();
    if (!identifier) {
      setErrorMessage("Please provide your registered Email or Phone Number.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser({
        identifier,
        password: password || undefined,
      });

      setSuccessMessage(`Welcome back, ${res.user.name}! Redirecting to portal...`);
      localStorage.setItem("brackyou_user", res.user.id);
      localStorage.setItem("brackyou_user_profile", JSON.stringify(res.user));
      window.dispatchEvent(new Event("userChanged"));

      setTimeout(() => {
        if (res.user.role === "trainer") {
          router.push("/trainer");
        } else {
          router.push("/student/dashboard");
        }
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid credentials. Please verify and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoId: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await loginUser({ identifier: demoId, password: "password123" });
      localStorage.setItem("brackyou_user", res.user.id);
      localStorage.setItem("brackyou_user_profile", JSON.stringify(res.user));
      window.dispatchEvent(new Event("userChanged"));
      if (res.user.role === "trainer") {
        router.push("/trainer");
      } else {
        router.push("/student/dashboard");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to launch demo persona.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream px-4 py-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-5xl">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-full bg-accentOrange border-[2.5px] border-accentBrown flex items-center justify-center text-white shadow-[0_2px_0_#4A2C1A]">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <span className="font-heading text-2xl text-textPrimary tracking-tight">BrackYou</span>
              <span className="text-[11px] font-bold tracking-widest text-accentTeal block uppercase -mt-1">
                Adaptive Assessment Portal
              </span>
            </div>
          </Link>

          <Link
            href="/student/dashboard"
            className="text-xs font-heading font-extrabold text-accentBrown hover:text-accentOrange transition-colors flex items-center gap-1.5"
          >
            Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Main Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Educational Highlights & Persona Quick-Login */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border-[2.5px] border-accentBrown rounded-2xl p-6 shadow-[4px_4px_0_#2D1B0E]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-accentTeal/10 text-accentTeal text-xs font-bold uppercase tracking-wider mb-3 border border-accentTeal/30">
                <Sparkles className="w-3.5 h-3.5" /> Hackathon Core Innovations
              </div>
              <h2 className="font-heading text-2xl text-textPrimary leading-snug mb-3">
                Process-Based Coding & Adaptive Mastery
              </h2>
              <p className="text-textSecondary text-sm leading-relaxed mb-4">
                Unlike traditional competitive programming platforms that only grade unit tests, BrackYou evaluates 
                <em> how</em> you develop algorithms, traces conceptual prerequisites, and prompts for code justification.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accentOrange/10 border border-accentOrange/40 flex items-center justify-center text-accentOrange shrink-0">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-heading font-bold text-textPrimary">Bayesian Knowledge Tracing</h4>
                    <p className="text-[11px] text-textSecondary">
                      Dynamic concept updates (P(L)=0.95 vs P(L)=0.45) with directed acyclic graph prerequisite gating.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accentTeal/10 border border-accentTeal/40 flex items-center justify-center text-accentTeal shrink-0">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-heading font-bold text-textPrimary">Real-Time Isolated Sandbox</h4>
                    <p className="text-[11px] text-textSecondary">
                      Real-time code execution with syntax error diagnostics, custom stdin input, and output tolerance.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accentYellow/20 border border-accentYellow/60 flex items-center justify-center text-accentBrown shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-heading font-bold text-textPrimary">Keystroke Telemetry & Socratic Viva</h4>
                    <p className="text-[11px] text-textSecondary">
                      Full timeline reconstruction, paste detection heuristics, and automated conceptual defense questions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Demo Personas */}
            <div className="bg-card border-[2.5px] border-accentBrown rounded-2xl p-5 shadow-[4px_4px_0_#2D1B0E]">
              <span className="text-[10px] uppercase font-bold tracking-widest text-textMuted block mb-2">
                1-Click Evaluator Fast-Pass
              </span>
              <p className="text-xs text-textSecondary mb-3">
                Pre-configured student & trainer accounts for immediate live testing:
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemoLogin("student_a")}
                  className="w-full text-left p-2.5 rounded-xl border-[2px] border-borderLight hover:border-accentBrown bg-cream/50 hover:bg-cream transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-accentOrange text-white flex items-center justify-center font-bold text-xs">
                      AC
                    </div>
                    <div>
                      <p className="text-xs font-heading font-bold text-textPrimary group-hover:text-accentOrange transition-colors">
                        Alex Chen (Advanced Student)
                      </p>
                      <p className="text-[10px] text-textMuted">alex@brackyou.dev • Ready for Dependency Injection</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-accentOrange bg-accentOrange/10 px-2 py-0.5 rounded-pill">
                    Fast Pass →
                  </span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemoLogin("student_b")}
                  className="w-full text-left p-2.5 rounded-xl border-[2px] border-borderLight hover:border-accentBrown bg-cream/50 hover:bg-cream transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-accentTeal text-white flex items-center justify-center font-bold text-xs">
                      JM
                    </div>
                    <div>
                      <p className="text-xs font-heading font-bold text-textPrimary group-hover:text-accentTeal transition-colors">
                        Jonah Miller (Remedial Loop)
                      </p>
                      <p className="text-[10px] text-textMuted">jonah@brackyou.dev • Needs Classes & Objects remedial</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-accentTeal bg-accentTeal/10 px-2 py-0.5 rounded-pill">
                    Fast Pass →
                  </span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemoLogin("trainer_1")}
                  className="w-full text-left p-2.5 rounded-xl border-[2px] border-borderLight hover:border-accentBrown bg-cream/50 hover:bg-cream transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-accentBrown text-white flex items-center justify-center font-bold text-xs">
                      SV
                    </div>
                    <div>
                      <p className="text-xs font-heading font-bold text-textPrimary group-hover:text-accentBrown transition-colors">
                        Dr. Sarah Vance (Lead Trainer)
                      </p>
                      <p className="text-[10px] text-textMuted">sarah.vance@brackyou.dev • Cohort Heatmap & Reviews</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-accentBrown bg-accentBrown/10 px-2 py-0.5 rounded-pill">
                    Fast Pass →
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Student Portal Form */}
          <div className="lg:col-span-7">
            <div className="bg-card border-[2.5px] border-accentBrown rounded-2xl p-6 sm:p-8 shadow-[4px_4px_0_#2D1B0E]">
              {/* Form Navigation Tabs */}
              <div className="flex items-center gap-2 bg-cream p-1.5 rounded-pill border-[2px] border-borderLight mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setTab("register");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-heading font-extrabold rounded-pill transition-all ${
                    tab === "register"
                      ? "bg-accentOrange text-white shadow-[0_2px_0_#2D1B0E]"
                      : "text-textSecondary hover:text-textPrimary"
                  }`}
                >
                  Create Student Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab("login");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-heading font-extrabold rounded-pill transition-all ${
                    tab === "login"
                      ? "bg-accentBrown text-white shadow-[0_2px_0_#2D1B0E]"
                      : "text-textSecondary hover:text-textPrimary"
                  }`}
                >
                  Sign In
                </button>
              </div>

              {/* Status Alerts */}
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-accentRed/10 border-[2px] border-accentRed/40 flex items-center gap-2.5 text-accentRed text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-accentTeal/10 border-[2px] border-accentTeal/40 flex items-center gap-2.5 text-accentTeal text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* REGISTER FORM */}
              {tab === "register" && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-heading font-bold text-textPrimary uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-textMuted">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Maya Lin"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-[2px] border-borderLight focus:border-accentBrown focus:outline-none bg-cream/40 text-textPrimary text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-heading font-bold text-textPrimary uppercase tracking-wider mb-1.5">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-textMuted">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border-[2px] border-borderLight focus:border-accentBrown focus:outline-none bg-cream/40 text-textPrimary text-sm font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold text-textPrimary uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-textMuted">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="maya@university.edu"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border-[2px] border-borderLight focus:border-accentBrown focus:outline-none bg-cream/40 text-textPrimary text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold text-textPrimary uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-textMuted">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border-[2px] border-borderLight focus:border-accentBrown focus:outline-none bg-cream/40 text-textPrimary text-sm font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-textMuted hover:text-textPrimary"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold text-textPrimary uppercase tracking-wider mb-1.5">
                      Role / Purpose
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole("student")}
                        className={`p-2.5 rounded-xl border-[2px] text-xs font-bold transition-all text-center ${
                          role === "student"
                            ? "bg-accentTeal/15 border-accentTeal text-accentTeal"
                            : "border-borderLight bg-cream/30 text-textSecondary hover:border-accentBrown"
                        }`}
                      >
                        🎓 Student / Learner
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("trainer")}
                        className={`p-2.5 rounded-xl border-[2px] text-xs font-bold transition-all text-center ${
                          role === "trainer"
                            ? "bg-accentOrange/15 border-accentOrange text-accentOrange"
                            : "border-borderLight bg-cream/30 text-textSecondary hover:border-accentBrown"
                        }`}
                      >
                        🔬 Trainer / Instructor
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-textMuted leading-relaxed pt-1">
                    By registering, your account is immediately provisioned in our Bayesian knowledge engine with initial baseline skill graph nodes.
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-accentOrange hover:bg-accentOrange/90 text-white rounded-xl font-heading font-extrabold text-sm border-[2px] border-accentBrown shadow-[0_3px_0_#2D1B0E] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="animate-pulse">Creating Account & Initializing Skill DAG...</span>
                    ) : (
                      <>
                        Complete Registration <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* LOGIN FORM */}
              {tab === "login" && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-heading font-bold text-textPrimary uppercase tracking-wider mb-1.5">
                      Email Address or Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-textMuted">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. alex@brackyou.dev or +1-555-0101"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-[2px] border-borderLight focus:border-accentBrown focus:outline-none bg-cream/40 text-textPrimary text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-heading font-bold text-textPrimary uppercase tracking-wider">
                        Password
                      </label>
                      <span className="text-[11px] text-textMuted">Default demo: password123</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-textMuted">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your account password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border-[2px] border-borderLight focus:border-accentBrown focus:outline-none bg-cream/40 text-textPrimary text-sm font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-textMuted hover:text-textPrimary"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-cream/50 rounded-xl border border-borderLight text-[11px] text-textSecondary flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-accentTeal shrink-0" />
                    <span>Protected by PBKDF2-HMAC-SHA256 salted credentials with role-based routing.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-accentBrown hover:bg-accentBrown/90 text-white rounded-xl font-heading font-extrabold text-sm border-[2px] border-accentBrown shadow-[0_3px_0_#000] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="animate-pulse">Authenticating Session...</span>
                    ) : (
                      <>
                        Sign In to Portal <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Active session banner if present */}
              {activeSessionUser && (
                <div className="mt-6 pt-5 border-t-[2px] border-borderLight flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accentTeal text-white font-bold flex items-center justify-center text-xs">
                      {activeSessionUser.name ? activeSessionUser.name.slice(0, 2).toUpperCase() : "U"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-textPrimary">
                        Currently logged in as {activeSessionUser.name}
                      </p>
                      <p className="text-[10px] text-textMuted">
                        {activeSessionUser.email} {activeSessionUser.phone_number ? `• ${activeSessionUser.phone_number}` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem("brackyou_user");
                      localStorage.removeItem("brackyou_user_profile");
                      setActiveSessionUser(null);
                      window.dispatchEvent(new Event("userChanged"));
                    }}
                    className="text-xs font-bold text-accentRed hover:underline"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
