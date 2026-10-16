from typing import Dict, Any, List

class StudentPersonaEngine:
    """
    Evaluates how each student is qualified based on multi-dimensional evidence:
      - Bayesian Knowledge Tracing (BKT) Posterior Mastery
      - Process Telemetry (Paste Bursts, Inter-Keystroke Delay, Tab Switches)
      - Write-Run-Fix Cadence (Number of iterations)
      - AST Socratic Viva Comprehension Match
    """

    @staticmethod
    def classify_persona(
        mastery_pct: int,
        viva_match_pct: int,
        passed_ratio: float,
        paste_count: int,
        max_paste_chars: int,
        run_count: int,
        critical_prereqs_count: int = 0
    ) -> Dict[str, Any]:
        
        # 1. Check for integrity anomalies requiring verification hold
        if max_paste_chars >= 150 and run_count <= 1:
            return {
                "persona_id": "assisted_dependent",
                "persona_title": "Assisted / Verification Hold",
                "tag": "Verification Hold",
                "badge_color": "border-accentOrange bg-accentOrange/10 text-accentOrange",
                "qualification_verdict": "Pending Viva Verification",
                "qualification_level": "Under Human Review",
                "qualification_summary": "High-volume paste operation with minimal write-run-fix cycles. Human review and verbal viva defense required before credit grant.",
                "spring_boot_unlocked": False,
                "recommended_action": "Schedule 1-on-1 viva defense on constructor immutability."
            }

        # 2. Check for critical prerequisite gap (e.g., Jonah Miller persona)
        if critical_prereqs_count > 0 or mastery_pct < 40:
            return {
                "persona_id": "foundational_remedial",
                "persona_title": "Foundational Learner (Remedial)",
                "tag": "Remedial Loop",
                "badge_color": "border-accentRed bg-accentRed/10 text-accentRed",
                "qualification_verdict": "Prerequisite Deficit",
                "qualification_level": "Remedially Gated",
                "qualification_summary": "Identified conceptual blockers in foundational prerequisite chains. Advanced frameworks gated to prevent compounding cognitive debt.",
                "spring_boot_unlocked": False,
                "recommended_action": "Route to remedial inheritance & encapsulation practice sets."
            }

        # 3. Check for Fast-Track Architect (e.g., Alex Chen persona)
        if mastery_pct >= 80 and viva_match_pct >= 85 and passed_ratio >= 1.0:
            return {
                "persona_id": "architect_fast_track",
                "persona_title": "Fast-Track Architect",
                "tag": "Advanced Master",
                "badge_color": "border-accentTeal bg-accentTeal/10 text-accentTeal",
                "qualification_verdict": "Fully Qualified (Tier 1)",
                "qualification_level": "Industry & Advanced Ready",
                "qualification_summary": "Demonstrated robust architectural separation of concerns, defensive programming guards, and exceptional conceptual defense.",
                "spring_boot_unlocked": True,
                "recommended_action": "Unlock Spring Boot, Microservices & Reactive Streams."
            }

        # 4. Pragmatic Hands-on Implementer
        return {
            "persona_id": "pragmatic_implementer",
            "persona_title": "Pragmatic Implementer",
            "tag": "Competent Practitioner",
            "badge_color": "border-accentYellow bg-accentYellow/15 text-accentBrown",
            "qualification_verdict": "Qualified (Empirical)",
            "qualification_level": "Competent with Iteration",
            "qualification_summary": "Strong empirical problem-solving skills with visible iterative write-run-fix stamina. Solid grasp of core requirements.",
            "spring_boot_unlocked": mastery_pct >= 70,
            "recommended_action": "Proceed with intermediate patterns and edge-case testing."
        }
