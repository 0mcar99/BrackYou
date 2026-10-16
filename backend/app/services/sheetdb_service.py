import os
import requests
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

SHEETDB_CONFIG_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "sheetdb_config.json")

class SheetDBService:
    """
    Integrates the BrackYou Assessment Portal with SheetDB (Google Sheets REST API).
    Synchronizes:
      1. Student Registration & Sign-in (Name, Phone, Email, Password Timestamp, Role)
      2. Learning Activities & Code Submissions (BKT Mastery %, Tests Passed, Execution Time)
      3. Process Forensics & Keystroke Telemetry (Large Pastes, Focus Losses)
      4. AST Code Viva & Explainable Evaluation
      5. Student Qualification & Persona Classification
    """

    def __init__(self):
        self._cached_url: Optional[str] = None

    def get_api_url(self) -> str:
        """Retrieves SheetDB API URL from environment or persistent config"""
        if self._cached_url:
            return self._cached_url
        env_url = os.getenv("SHEETDB_API_URL", "").strip()
        if env_url:
            self._cached_url = env_url
            return env_url
        if os.path.exists(SHEETDB_CONFIG_FILE):
            try:
                with open(SHEETDB_CONFIG_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self._cached_url = data.get("api_url", "").strip()
                    return self._cached_url or ""
            except Exception:
                pass
        return ""

    def set_api_url(self, url: str) -> None:
        """Updates the SheetDB API URL and persists it to disk"""
        clean_url = url.strip()
        self._cached_url = clean_url
        try:
            with open(SHEETDB_CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump({"api_url": clean_url, "updated_at": datetime.now(timezone.utc).isoformat()}, f, indent=2)
        except Exception as e:
            print(f"[SheetDB] Warning persisting config: {e}")

    def is_configured(self) -> bool:
        return bool(self.get_api_url())

    def _send_payload(self, rows: List[Dict[str, Any]], sheet_name: Optional[str] = None) -> Dict[str, Any]:
        """Sends data payload to SheetDB with non-blocking error handling"""
        url = self.get_api_url()
        if not url:
            return {
                "success": False,
                "message": "SheetDB API URL is not configured. Set it in .env or the Trainer Console."
            }

        target_url = url
        if sheet_name:
            target_url = f"{url}?sheet={sheet_name}"

        try:
            headers = {"Content-Type": "application/json", "Accept": "application/json"}
            payload = {"data": rows}
            resp = requests.post(target_url, json=payload, headers=headers, timeout=5.0)
            if resp.status_code in (200, 201):
                return {"success": True, "created": len(rows), "status_code": resp.status_code}
            else:
                return {
                    "success": False,
                    "status_code": resp.status_code,
                    "error": resp.text[:200]
                }
        except Exception as ex:
            return {"success": False, "error": str(ex)}

    def log_user_signup(self, user_id: str, name: str, email: str, phone: str, role: str = "student") -> Dict[str, Any]:
        """Logs student registration to SheetDB"""
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        row = {
            "Timestamp": now,
            "Event_Type": "STUDENT_SIGNUP",
            "User_ID": user_id,
            "Name": name,
            "Email": email,
            "Phone": phone,
            "Role": role,
            "Persona_Classification": "New Enrollee",
            "Qualification_Status": "Prerequisites Initialized",
            "Activity_Details": f"Registered new student account with phone {phone}",
            "Score_Or_Mastery": "10%",
            "Integrity_Flags": "Clean"
        }
        return self._send_payload([row])

    def log_user_signin(self, user_id: str, name: str, email: str, phone: str) -> Dict[str, Any]:
        """Logs student login to SheetDB"""
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        row = {
            "Timestamp": now,
            "Event_Type": "STUDENT_LOGIN",
            "User_ID": user_id,
            "Name": name,
            "Email": email,
            "Phone": phone,
            "Role": "student",
            "Persona_Classification": "Active Learner",
            "Qualification_Status": "Session Active",
            "Activity_Details": "Logged into BrackYou portal",
            "Score_Or_Mastery": "-",
            "Integrity_Flags": "Clean"
        }
        return self._send_payload([row])

    def log_assessment_activity(
        self,
        user_id: str,
        name: str,
        email: str,
        phone: str,
        question_id: str,
        passed_tests: int,
        total_tests: int,
        bkt_mastery_pct: int,
        persona: str,
        qualification: str,
        viva_score: int,
        flagged_signals: int,
        pedagogical_summary: str
    ) -> Dict[str, Any]:
        """Logs live coding assessment completion and BKT update to SheetDB"""
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        row = {
            "Timestamp": now,
            "Event_Type": "ASSESSMENT_SUBMIT",
            "User_ID": user_id,
            "Name": name,
            "Email": email,
            "Phone": phone,
            "Role": "student",
            "Persona_Classification": persona,
            "Qualification_Status": qualification,
            "Activity_Details": f"Submitted question {question_id} ({passed_tests}/{total_tests} tests passed, Viva: {viva_score}%)",
            "Score_Or_Mastery": f"{bkt_mastery_pct}%",
            "Integrity_Flags": f"{flagged_signals} signal(s) flagged" if flagged_signals > 0 else "Clean"
        }
        return self._send_payload([row])
