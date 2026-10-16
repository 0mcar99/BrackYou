import unittest
from backend.app.services.bkt_engine import BKTEngine
from backend.app.services.dag_resolver import DAGResolver
from backend.app.services.sandbox import HardenedSandbox

class TestCoreEngine(unittest.TestCase):
    def setUp(self):
        self.bkt = BKTEngine()
        # Java OOP DAG
        # variables -> methods -> classes_objects -> inheritance -> interfaces -> dependency_injection
        self.adj = {
            "methods": ["variables"],
            "classes_objects": ["methods"],
            "inheritance": ["classes_objects"],
            "interfaces": ["inheritance"],
            "dependency_injection": ["inheritance", "interfaces"],
            "spring_boot": ["dependency_injection"]
        }
        self.dag = DAGResolver(self.adj)
        self.sandbox = HardenedSandbox(timeout_sec=1.5)

    def test_bkt_posterior_update(self):
        prior = 0.50
        # Success should increase mastery
        next_correct = self.bkt.update_posterior(prior, is_correct=True)
        self.assertGreater(next_correct, prior)

        # Failure should decrease mastery
        next_incorrect = self.bkt.update_posterior(prior, is_correct=False)
        self.assertLess(next_incorrect, prior)

    def test_prerequisite_gating_and_weakest_walk(self):
        # Student B with critical gap in inheritance
        mastery_map = {
            "variables": 0.90,
            "methods": 0.85,
            "classes_objects": 0.45, # Weak
            "inheritance": 0.12,     # Critical weakest (0.12 < 0.25)
            "interfaces": 0.25,
            "dependency_injection": 0.10,
        }

        weakest = self.dag.find_weakest_blocking_prerequisite(
            target_concept="dependency_injection",
            mastery_map=mastery_map,
            threshold=0.70
        )
        self.assertIsNotNone(weakest)
        # Should detect 'inheritance' (0.20) as the weakest blocking ancestor
        self.assertEqual(weakest[0], "inheritance")

    def test_adversarial_sandbox_infinite_loop(self):
        infinite_loop_code = """
import time
while True:
    pass
"""
        res = self.sandbox.execute_python_code(infinite_loop_code)
        # Sandbox must contain and terminate with status 'tle'
        self.assertEqual(res["status"], "tle")
        self.assertEqual(res["exit_code"], 124)

    def test_adversarial_sandbox_network_block(self):
        socket_code = """
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
"""
        res = self.sandbox.execute_python_code(socket_code)
        self.assertEqual(res["status"], "security_violation")

if __name__ == "__main__":
    unittest.main()
