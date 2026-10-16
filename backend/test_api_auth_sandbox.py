import urllib.request
import json
import sys

def main():
    base = "http://127.0.0.1:8000"
    
    # 1. Health
    with urllib.request.urlopen(f"{base}/api/health") as res:
        print("[1] Health:", res.status, res.read().decode())
        
    # 2. Register
    reg_payload = json.dumps({
        "name": "Jordan Lee",
        "phone_number": "+1-555-4321",
        "email": "jordan.lee@brackyou.dev",
        "password": "SecurePassword123",
        "role": "student"
    }).encode("utf-8")
    
    req = urllib.request.Request(
        f"{base}/api/auth/register",
        data=reg_payload,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as res:
            print("[2] Register Success:", res.status, res.read().decode())
    except urllib.error.HTTPError as e:
        print("[2] Register HTTP Response:", e.code, e.read().decode())
        
    # 3. Login with email
    login_payload = json.dumps({
        "identifier": "jordan.lee@brackyou.dev",
        "password": "SecurePassword123"
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{base}/api/auth/login",
        data=login_payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        print("[3] Login by Email:", res.status, res.read().decode())

    # 4. Login with phone number
    login_phone_payload = json.dumps({
        "identifier": "+1-555-4321",
        "password": "SecurePassword123"
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{base}/api/auth/login",
        data=login_phone_payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        print("[4] Login by Phone:", res.status, res.read().decode())

    # 5. Sandbox Real-time Execution with Custom Stdin Input
    run_payload = json.dumps({
        "code": "import sys\nline = sys.stdin.read().strip()\nprint(f'ECHO: {line}')",
        "language": "python",
        "custom_input": "Test Custom Input Line 42"
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{base}/api/assessment/run",
        data=run_payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        print("[5] Real-Time Run Sandbox with Custom Stdin:", res.read().decode())

    # 6. Real-time Syntax Error Detection
    syntax_err_payload = json.dumps({
        "code": "def broken_code(\n    print('missing paren'",
        "language": "python"
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{base}/api/assessment/run",
        data=syntax_err_payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        print("[6] Real-Time Syntax Error Catch:", res.read().decode())

    # 7. Socratic Hint
    hint_payload = json.dumps({
        "code": "class UserService:\n    def __init__(self, repo):\n        self.repo = repo\n",
        "language": "python",
        "question_id": "q_di_1"
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{base}/api/assessment/hint",
        data=hint_payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        print("[7] Socratic Hint Response:", res.read().decode())

if __name__ == "__main__":
    main()
