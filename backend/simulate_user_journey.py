import urllib.request
import json
import uuid
import sys

def run_test(name, fn):
    print(f"\n--- Testing: {name} ---")
    try:
        fn()
        print(f" [PASS] {name}")
    except Exception as e:
        print(f" [FAIL] {name}: {e}")
        sys.exit(1)

def main():
    base_api = "http://127.0.0.1:8000"
    base_fe = "http://localhost:3000"
    unique_id = uuid.uuid4().hex[:6]
    test_email = f"user_{unique_id}@testbrackyou.com"
    test_phone = f"+9198765{unique_id[:5]}"
    test_name = f"Test Student {unique_id}"
    test_pass = "SecurePass123!"

    context = {}

    def step1_register():
        req = urllib.request.Request(
            f"{base_api}/api/auth/register",
            data=json.dumps({
                "name": test_name,
                "phone_number": test_phone,
                "email": test_email,
                "password": test_pass,
                "role": "student"
            }).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as res:
            assert res.status == 201
            data = json.loads(res.read().decode())
            context["user_id"] = data["user_id"]
            context["token"] = data["token"]
            print(f"  User registered: ID={data['user_id']}, Name={data['name']}, Email={data['email']}")

    def step2_login():
        req = urllib.request.Request(
            f"{base_api}/api/auth/login",
            data=json.dumps({
                "identifier": test_email,
                "password": test_pass
            }).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert data["user_id"] == context["user_id"]
            print(f"  Login verified with password! Token={data['token'][:20]}...")

    def step3_adaptive_curriculum():
        with urllib.request.urlopen(f"{base_api}/api/adaptive/next-activity/{context['user_id']}?target_concept_id=dependency_injection") as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            print(f"  Adaptive route determined: Mode={data.get('mode')}, Target={data.get('target_concept_title')}")

    def step4_run_code():
        sample_code = """class UserRepository:
    def get_user(self, user_id):
        return f"User_{user_id}"

class UserService:
    def __init__(self, repo):
        if repo is None:
            raise ValueError("UserRepository dependency cannot be null")
        self._repo = repo

    def fetch_user(self, user_id):
        return self._repo.get_user(user_id)
"""
        context["code"] = sample_code
        req = urllib.request.Request(
            f"{base_api}/api/assessment/run",
            data=json.dumps({
                "code": sample_code,
                "language": "python",
                "question_id": "q_di_1"
            }).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert data["status"] == "passed"
            print(f"  Code run: Status={data['status']}, Passed={data['passed_count']}/{data['total_count']}")

    def step5_telemetry_and_submit():
        sess_id = f"sess_{uuid.uuid4().hex[:10]}"
        context["session_id"] = sess_id

        # Ingest telemetry (blur, paste, run)
        events = [
            {"offsetMs": 0, "type": "key", "payload": {"key": "c"}},
            {"offsetMs": 180000, "type": "blur", "payload": {"reason": "window_blur"}},
            {"offsetMs": 195000, "type": "focus", "payload": {"reason": "window_focus"}},
            {"offsetMs": 310000, "type": "paste", "payload": {"char_count": len(context["code"]), "text": context["code"]}},
            {"offsetMs": 400000, "type": "run", "payload": {}}
        ]
        ev_req = urllib.request.Request(
            f"{base_api}/api/telemetry/events",
            data=json.dumps({"session_id": sess_id, "events": events}).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(ev_req) as res:
            assert res.status == 200

        # Submit code
        sub_req = urllib.request.Request(
            f"{base_api}/api/assessment/submit",
            data=json.dumps({
                "student_id": context["user_id"],
                "question_id": "q_di_1",
                "code": context["code"],
                "language": "python",
                "session_id": sess_id
            }).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(sub_req) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            context["submission_id"] = data["submission_id"]
            context["persona"] = data.get("persona")
            print(f"  Submitted! BKT Mastery: {data['mastery_update']['next_pct']}% (+{data['mastery_update']['delta_pct']}%)")
            print(f"  Evaluated Persona: {data.get('persona', {}).get('persona_title')}")
            print(f"  Qualification Verdict: {data.get('persona', {}).get('qualification_verdict')}")

    def step6_replay_and_viva():
        sess_id = context["session_id"]
        with urllib.request.urlopen(f"{base_api}/api/telemetry/session/{sess_id}/replay") as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert data["submission"]["passed_tests"] >= 1
            print(f"  Replay fetched: Question='{data['question_title']}', Signals flagged={len(data['signals'])}")
            print(f"  Viva question: '{data['viva']['question_text']}'")

            # Answer viva
            viva_req = urllib.request.Request(
                f"{base_api}/api/viva/evaluate",
                data=json.dumps({
                    "submission_id": context["submission_id"],
                    "question_text": data["viva"]["question_text"],
                    "student_answer": "Constructor injection ensures the dependency is validated once at instantiation time, making it immutable and testable.",
                    "key_concepts": ["constructor", "immutable", "dependency"]
                }).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(viva_req) as vres:
                assert vres.status == 200
                vdata = json.loads(vres.read().decode())
                print(f"  Viva graded: Match={vdata['match_score']}%, Feedback={vdata['rubric_feedback'][:60]}...")

    def step7_trainer_heatmap():
        with urllib.request.urlopen(f"{base_api}/api/trainer/cohort-heatmap") as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            student_match = next((s for s in data["students"] if s["student_id"] == context["user_id"]), None)
            assert student_match is not None
            print(f"  Trainer Heatmap contains new user: {student_match['student_name']} (Email: {student_match['email']}, Phone: {student_match['phone_number']})")
            print(f"  Cohort Persona: {student_match.get('persona', {}).get('persona_title')}")

    def step8_frontend_pages():
        routes = [
            "/login",
            "/student/dashboard",
            "/student/assess/q_di_1",
            f"/student/results/{context['session_id']}",
            "/trainer"
        ]
        for r in routes:
            url = f"{base_fe}{r}"
            with urllib.request.urlopen(url) as res:
                assert res.status == 200
                html = res.read().decode()
                assert len(html) > 500
                print(f"  Frontend {r} -> HTTP 200 OK ({len(html)} bytes)")

    run_test("Step 1: Student Registration (Name, Phone, Email, Password)", step1_register)
    run_test("Step 2: Student Authentication & Verification", step2_login)
    run_test("Step 3: Adaptive Prerequisite Routing", step3_adaptive_curriculum)
    run_test("Step 4: Live Code Sandbox Execution", step4_run_code)
    run_test("Step 5: Telemetry Ingestion & Code Submission", step5_telemetry_and_submit)
    run_test("Step 6: Dynamic Forensic Replay & AST Viva Defense", step6_replay_and_viva)
    run_test("Step 7: Trainer Heatmap & Persona Classification", step7_trainer_heatmap)
    run_test("Step 8: Next.js Frontend Pages End-to-End", step8_frontend_pages)

    print("\n========================================================")
    print(" ALL 8 REAL USER JOURNEY TESTS COMPLETED SUCCESSFULLY!")
    print("========================================================\n")

if __name__ == "__main__":
    main()
