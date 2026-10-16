from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

@dataclass
class BKTParams:
    p_init: float = 0.15    # Prior knowledge
    p_transit: float = 0.20 # Learning transition rate
    p_slip: float = 0.10    # Mistake probability despite knowing
    p_guess: float = 0.20   # Lucky pass probability

class BKTEngine:
    def __init__(self, params: Optional[BKTParams] = None):
        self.params = params or BKTParams()

    def update_posterior(self, p_prior: float, is_correct: bool) -> float:
        """
        Bayesian update:
        Step 1: Compute P(L_t | Evidence)
        """
        p_s = self.params.p_slip
        p_g = self.params.p_guess

        if is_correct:
            numerator = p_prior * (1.0 - p_s)
            denominator = numerator + ((1.0 - p_prior) * p_g)
        else:
            numerator = p_prior * p_s
            denominator = numerator + ((1.0 - p_prior) * (1.0 - p_g))

        if denominator <= 0:
            p_posterior = p_prior
        else:
            p_posterior = numerator / denominator

        # Step 2: Incorporate transition probability P(T) for next state P(L_{t+1})
        p_next = p_posterior + ((1.0 - p_posterior) * self.params.p_transit)
        return round(min(max(p_next, 0.02), 0.98), 4)

    def calculate_confidence(self, evidence_count: int) -> str:
        """
        Distinguish between estimated score and confidence level
        """
        if evidence_count < 2:
            return "low"
        elif evidence_count < 5:
            return "medium"
        return "high"

    def apply_gated_penalty(self, p_known: float, parent_p_knowns: List[float], threshold: float = 0.70) -> float:
        """
        Gating rule: If prerequisites are not solid (below 70%), 
        effective knowledge in higher-level concepts cannot be declared solid.
        """
        if not parent_p_knowns:
            return p_known
        
        all_cleared = all(p >= threshold for p in parent_p_knowns)
        if all_cleared:
            return p_known
        
        # Calculate penalty factor based on weakest prerequisite
        weakest_parent = min(parent_p_knowns)
        penalty_ratio = max(0.2, weakest_parent / threshold)
        return round(p_known * penalty_ratio, 4)

    def explain_change(self, p_prior: float, p_next: float, is_correct: bool, concept_title: str) -> str:
        delta = round((p_next - p_prior) * 100, 1)
        sign = "+" if delta >= 0 else ""
        if is_correct:
            return f"Mastery in {concept_title} increased to {int(p_next * 100)}% ({sign}{delta}%). Demonstrated consistent understanding of core logic."
        else:
            return f"Mastery in {concept_title} adjusted to {int(p_next * 100)}% ({sign}{delta}%). Prerequisite review recommended to strengthen foundational concepts."
