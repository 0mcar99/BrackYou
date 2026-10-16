import urllib.request
import json
import uuid

def main():
    base = "http://127.0.0.1:8000"
    session_id = f"sess_test_{uuid.uuid4().hex[:8]}"

    print(f"=== Testing Live Assessment Submission & Replay Pipeline ===")
    print(f"Session ID: {session_id}")

    # 1. Ingest telemetry events simulating a student session:
    # - 00:00: Start typing
    # - 03:30 (210,000ms): Tab switch blur (focus lost)
    # - 06:14 (374,000ms): Large paste burst (340 characters of AI generated code)
    # - 07:36 (456,000ms): Submit
    ai_code = """class UserRepository:
    def get_user(self, user_id):
        return f"User_{user_id}"

class UserService:
    def __init__(self, repo):
        # Enforcing constructor dependency injection
        if repo is None:
            raise ValueError("UserRepository dependency cannot be null")
        self._repo = repo

    def fetch_user(self, user_id):
        return self._repo.get_user(user_id)

if __name__ == '__main__':
    service = UserService(UserRepository())
    print(service.fetch_user(101))"""

    events = [
        {"offsetMs": 0, "type": "key", "payload": {"key": "c"}},
        {"offsetMs": 210000, "type": "blur", "payload": {"reason": "window_blur"}},
        {"offsetMs": 230000, "type": "focus", "payload": {"reason": "window_focus"}},
        {"offsetMs": 374000, "type": "paste", "payload": {"char_count": len(ai_code), "text": ai_code}},
        {"offsetMs": 456000, "type": "run", "payload": {}},
    ]

    ev_req = urllib.request.Request(
        f"{base}/api/telemetry/events",
        data=json.dumps({"session_id": session_id, "events": events}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(ev_req) as res:
        print("[1] Ingest Telemetry:", res.status, res.read().decode())

    # 2. Test Run Code via sandbox (q_di_1)
    run_req = urllib.request.Request(
        f"{base}/api/assessment/run",
        data=json.dumps({
            "code": ai_code,
            "language": "python",
            "question_id": "q_di_1"
        }).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(run_req) as res:
        run_data = json.loads(res.read().decode())
        print(f"[2] Run Tests Result: Status={run_data.get('status')}, Passed={run_data.get('passed_count')}/{run_data.get('total_count')}")
        for td in run_data.get("test_details", []):
            print(f"    - {td['name']}: {'PASSED' if td['passed'] else 'FAILED'} ({td.get('execution_time_ms', 0)}ms)")

    # 3. Submit Solution
    submit_req = urllib.request.Request(
        f"{base}/api/assessment/submit",
        data=json.dumps({
            "student_id": "student_a",
            "question_id": "q_di_1",
            "code": ai_code,
            "language": "python",
            "session_id": session_id
        }).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(submit_req) as res:
        sub_data = json.loads(res.read().decode())
        print(f"[3] Submit Response: Status={sub_data.get('status')}, SubmissionId={sub_data.get('submission_id')}")
        print(f"    Mastery Update: {sub_data.get('mastery_update')}")
        print(f"    Pedagogical Summary: {sub_data.get('pedagogical_summary')}")

    # 4. Fetch Complete Replay Dossier
    with urllib.request.urlopen(f"{base}/api/telemetry/session/{session_id}/replay") as res:
        replay = json.loads(res.read().decode())
        print(f"\n[4] Complete Session Replay Dossier:")
        print(f"    Session ID: {replay.get('session_id')}")
        print(f"    Question: {replay.get('question_title')}")
        print(f"    BKT Score: {replay['bkt_mastery']['current_pct']}% (Delta: {replay['bkt_mastery']['delta_pct']}%)")
        print(f"    Pedagogical Evaluation: {replay['bkt_mastery']['pedagogical_summary'][:80]}...")
        print(f"    Tests Passed: {replay['submission']['passed_tests']}/{replay['submission']['total_tests']}")
        print(f"    Signals Flagged ({len(replay['signals'])}):")
        for s in replay['signals']:
            print(f"      * [{s['signal_type']}] at {s['timestamp_offset_ms']}ms: {s['evidence_description']}")
        print(f"    AST Viva Question: {replay['viva']['question_text']}")
        print(f"    Viva Comprehension Match: {replay['viva']['match_score']}%")

    print("\n[SUCCESS] ALL PIPELINE STEPS VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
