import sys
import subprocess
import tempfile
import time
import os
import re
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

@dataclass
class TestResult:
    name: str
    passed: bool
    input_data: str
    expected_output: str
    actual_output: str
    execution_time_ms: int
    is_hidden: bool
    error: Optional[str] = None

class HardenedSandbox:
    def __init__(self, timeout_sec: float = 3.0, memory_limit_mb: int = 128):
        self.timeout_sec = timeout_sec
        self.memory_limit_mb = memory_limit_mb

    def check_adversarial_patterns(self, code: str, language: str) -> Optional[str]:
        """
        Pre-flight static security check for hostile submissions
        """
        # Forbidden system calls and host tampering
        forbidden_patterns = [
            (r'socket\s*\.\s*socket', "Network egress forbidden (socket creation blocked)."),
            (r'urllib|requests|http\.client', "Network egress forbidden (HTTP client blocked)."),
            (r'Runtime\.getRuntime\(\)\.exec', "System process execution forbidden."),
            (r'ProcessBuilder', "Subprocess spawning forbidden."),
            (r'os\.system|subprocess\.', "Subprocess spawning forbidden."),
            (r'/etc/passwd|/etc/shadow', "Access to restricted system files blocked."),
            (r'rm\s+-rf', "Destructive filesystem operations blocked.")
        ]

        for pattern, reason in forbidden_patterns:
            if re.search(pattern, code, re.IGNORECASE):
                return reason
        return None

    def execute_python_code(self, code: str, stdin_data: str = "") -> Dict[str, Any]:
        """
        Executes Python code in an isolated subprocess with strict watchdog timeout.
        """
        # Run pre-flight check
        security_alert = self.check_adversarial_patterns(code, "python")
        if security_alert:
            return {
                "stdout": "",
                "stderr": f"SECURITY POLICY VIOLATION: {security_alert}",
                "exit_code": 126,
                "duration_ms": 1,
                "status": "security_violation"
            }

        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
            f.write(code)
            temp_path = f.name

        try:
            start_time = time.perf_counter()
            # Windows/Linux compatible subprocess invocation with timeout
            proc = subprocess.run(
                [sys.executable, temp_path],
                input=stdin_data,
                text=True,
                capture_output=True,
                timeout=self.timeout_sec
            )
            elapsed_ms = int((time.perf_counter() - start_time) * 1000)
            return {
                "stdout": proc.stdout,
                "stderr": proc.stderr,
                "exit_code": proc.returncode,
                "duration_ms": elapsed_ms,
                "status": "passed" if proc.returncode == 0 else "error"
            }
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": f"TIME LIMIT EXCEEDED: Execution halted after exceeding safety watchdog limit ({int(self.timeout_sec * 1000)}ms). Potential infinite loop contained.",
                "exit_code": 124,
                "duration_ms": int(self.timeout_sec * 1000),
                "status": "tle"
            }
        except Exception as e:
            return {
                "stdout": "",
                "stderr": str(e),
                "exit_code": 1,
                "duration_ms": 0,
                "status": "error"
            }
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

    def run_test_suite(
        self, 
        code: str, 
        language: str, 
        test_cases: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Runs the student's submission against sample and hidden test cases.
        Hidden inputs/expected outputs are never exposed in the client response.
        """
        results: List[TestResult] = []
        passed_count = 0
        total_time_ms = 0
        overall_status = "passed"
        first_stdout = ""
        first_stderr = ""

        # Pre-flight check
        security_alert = self.check_adversarial_patterns(code, language)
        if security_alert:
            return {
                "passed_count": 0,
                "total_count": len(test_cases),
                "execution_time_ms": 1,
                "status": "security_violation",
                "stdout": "",
                "stderr": f"SECURITY VIOLATION: {security_alert}",
                "test_details": [
                    {
                        "name": tc.get("name", f"Test {idx+1}"),
                        "passed": False,
                        "is_hidden": tc.get("is_hidden", False),
                        "error": security_alert
                    }
                    for idx, tc in enumerate(test_cases)
                ]
            }

        # If language is Java, we can simulate Java execution or execute via javac/java if installed,
        # or execute test cases with a Python runner translation for the hackathon prototype.
        # For full multi-language, execute Python directly:
        for idx, tc in enumerate(test_cases):
            tc_name = tc.get("name", f"Test {idx + 1}")
            inp = tc.get("input_data", "")
            expected = tc.get("expected_output", "").strip()
            is_hidden = tc.get("is_hidden", False)

            res = self.execute_python_code(code, inp)
            total_time_ms += res["duration_ms"]

            if not first_stdout and res["stdout"]:
                first_stdout = res["stdout"]
            if not first_stderr and res["stderr"]:
                first_stderr = res["stderr"]

            if res["status"] == "tle":
                overall_status = "tle"
                results.append(TestResult(
                    name=tc_name,
                    passed=False,
                    input_data="[HIDDEN]" if is_hidden else inp,
                    expected_output="[HIDDEN]" if is_hidden else expected,
                    actual_output="",
                    execution_time_ms=res["duration_ms"],
                    is_hidden=is_hidden,
                    error="Time Limit Exceeded (>3000ms)"
                ))
                break

            actual = res["stdout"].strip()
            # Loose match (ignoring carriage returns)
            passed = (actual == expected) and (res["exit_code"] == 0)
            if passed:
                passed_count += 1
            else:
                if overall_status == "passed":
                    overall_status = "failed"

            results.append(TestResult(
                name=tc_name,
                passed=passed,
                input_data="[HIDDEN]" if is_hidden else inp,
                expected_output="[HIDDEN]" if is_hidden else expected,
                actual_output="[HIDDEN]" if is_hidden else actual,
                execution_time_ms=res["duration_ms"],
                is_hidden=is_hidden,
                error=res["stderr"] if not passed and res["stderr"] else None
            ))

        return {
            "passed_count": passed_count,
            "total_count": len(test_cases),
            "execution_time_ms": total_time_ms,
            "status": overall_status if passed_count < len(test_cases) else "passed",
            "stdout": first_stdout,
            "stderr": first_stderr,
            "test_details": [
                {
                    "name": r.name,
                    "passed": r.passed,
                    "is_hidden": r.is_hidden,
                    "execution_time_ms": r.execution_time_ms,
                    "input_data": r.input_data,
                    "expected_output": r.expected_output,
                    "actual_output": r.actual_output,
                    "error": r.error
                }
                for r in results
            ]
        }
