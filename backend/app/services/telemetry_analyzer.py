import math
from typing import List, Dict, Any, Tuple

class TelemetryAnalyzer:
    def __init__(self, baseline_wpm: float = 45.0):
        self.baseline_wpm = baseline_wpm

    def analyze_events(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyzes a chronological list of session events and extracts integrity signals.
        Framing rule: Always framed as 'evidence for human review', never automatic accusations.
        """
        signals = []
        if not events:
            return signals

        # Sort chronologically by timestamp_offset_ms
        events = sorted(events, key=lambda e: e.get("timestamp_offset_ms", 0))

        # 1. Detect large paste operations
        for ev in events:
            if ev.get("event_type") == "paste":
                payload = ev.get("payload", {})
                char_count = payload.get("char_count", 0) or len(payload.get("text", ""))
                if char_count >= 40:
                    ts = ev.get("timestamp_offset_ms", 0)
                    minutes = ts // 60000
                    seconds = (ts % 60000) // 1000
                    signals.append({
                        "signal_type": "large_paste",
                        "timestamp_offset_ms": ts,
                        "timestamp_formatted": f"{minutes:02d}:{seconds:02d}",
                        "severity": "review_recommended",
                        "title": f"Large Paste Detected ({char_count} chars)",
                        "evidence_description": f"At {minutes:02d}:{seconds:02d}, {char_count} characters were inserted in a single clipboard paste operation. Review suggested.",
                        "char_count": char_count
                    })

        # 2. Detect Tab Switches / Attention drift
        tab_switches = 0
        blur_time = None
        for ev in events:
            ev_type = ev.get("event_type")
            ts = ev.get("timestamp_offset_ms", 0)
            if ev_type == "blur":
                blur_time = ts
                tab_switches += 1
            elif ev_type == "focus" and blur_time is not None:
                duration_sec = (ts - blur_time) // 1000
                if duration_sec >= 15:
                    minutes = blur_time // 60000
                    seconds = (blur_time % 60000) // 1000
                    signals.append({
                        "signal_type": "tab_switch_prolonged",
                        "timestamp_offset_ms": blur_time,
                        "timestamp_formatted": f"{minutes:02d}:{seconds:02d}",
                        "severity": "info",
                        "title": f"Editor Focus Lost for {duration_sec}s",
                        "evidence_description": f"Browser tab lost focus at {minutes:02d}:{seconds:02d} for {duration_sec} seconds before returning to active editing.",
                        "duration_sec": duration_sec
                    })
                blur_time = None

        # 3. Detect Missing Write-Run-Fix Cycle
        runs = [e for e in events if e.get("event_type") == "run"]
        keys = [e for e in events if e.get("event_type") == "key"]
        deletes = [e for e in events if e.get("event_type") == "delete"]

        if len(runs) <= 1 and len(keys) > 60:
            signals.append({
                "signal_type": "missing_cycle",
                "timestamp_offset_ms": events[-1].get("timestamp_offset_ms", 0),
                "timestamp_formatted": "Final",
                "severity": "info",
                "title": "Minimal Run-Debug Cycle",
                "evidence_description": f"Submission was completed with only {len(runs)} code execution(s). Honest novice sessions typically exhibit multiple test-error-fix iterations.",
            })

        # 4. Detect Uniform No-Correction Typing (Manual AI Transcription)
        # Look for contiguous 100+ key events with 0 deletes
        consecutive_keys_without_del = 0
        streak_start_ts = 0
        for ev in events:
            ev_type = ev.get("event_type")
            if ev_type == "key":
                if consecutive_keys_without_del == 0:
                    streak_start_ts = ev.get("timestamp_offset_ms", 0)
                consecutive_keys_without_del += 1
                if consecutive_keys_without_del == 120:
                    minutes = streak_start_ts // 60000
                    seconds = (streak_start_ts % 60000) // 1000
                    signals.append({
                        "signal_type": "uniform_no_correction",
                        "timestamp_offset_ms": streak_start_ts,
                        "timestamp_formatted": f"{minutes:02d}:{seconds:02d}",
                        "severity": "review_recommended",
                        "title": "Continuous Uniform Typing with Zero Corrections",
                        "evidence_description": f"120+ characters typed uniformly starting at {minutes:02d}:{seconds:02d} with 0 backspaces or deletions. Often indicative of manual transcription from a secondary display.",
                    })
            elif ev_type in ("delete", "paste"):
                consecutive_keys_without_del = 0

        # Calculate positive signals
        backspace_ratio = (len(deletes) / max(len(keys), 1)) * 100
        positive_signals = []
        if backspace_ratio >= 10.0:
            positive_signals.append(f"Natural editing pattern observed ({int(backspace_ratio)}% backspace/delete frequency).")
        if len(runs) >= 3:
            positive_signals.append(f"Iterative write-run-fix cycle present ({len(runs)} test runs recorded).")
        if not [s for s in signals if s["signal_type"] == "large_paste"]:
            positive_signals.append("Zero large paste operations recorded.")

        return {
            "signals": signals,
            "positive_signals": positive_signals,
            "metrics": {
                "total_events": len(events),
                "key_count": len(keys),
                "delete_count": len(deletes),
                "paste_count": len([e for e in events if e.get("event_type") == "paste"]),
                "run_count": len(runs),
                "tab_switches": tab_switches,
                "backspace_ratio": round(backspace_ratio, 1),
                "integrity_status": "Review Recommended" if any(s["severity"] == "review_recommended" for s in signals) else "Clean"
            }
        }
