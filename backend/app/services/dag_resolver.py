from typing import Dict, List, Set, Optional, Tuple, Any

class DAGResolver:
    def __init__(self, adjacency_list: Optional[Dict[str, List[str]]] = None):
        """
        adjacency_list: {concept_id: [prerequisite_concept_ids]}
        e.g., {'inheritance': ['classes_objects'], 'dependency_injection': ['inheritance', 'interfaces']}
        """
        self.adj = adjacency_list or {}

    def set_graph(self, adjacency_list: Dict[str, List[str]]):
        self.adj = adjacency_list

    def get_prerequisites(self, concept_id: str) -> List[str]:
        return self.adj.get(concept_id, [])

    def get_all_ancestors(self, concept_id: str) -> Set[str]:
        ancestors = set()
        queue = list(self.adj.get(concept_id, []))
        while queue:
            curr = queue.pop(0)
            if curr not in ancestors:
                ancestors.add(curr)
                queue.extend(self.adj.get(curr, []))
        return ancestors

    def is_unlocked(self, concept_id: str, mastery_map: Dict[str, float], threshold: float = 0.70) -> bool:
        """
        A concept is unlocked only if all its direct prerequisites have mastery >= threshold.
        """
        prereqs = self.get_prerequisites(concept_id)
        if not prereqs:
            return True
        return all(mastery_map.get(p, 0.0) >= threshold for p in prereqs)

    def find_weakest_blocking_prerequisite(
        self, 
        target_concept: str, 
        mastery_map: Dict[str, float], 
        threshold: float = 0.70
    ) -> Optional[Tuple[str, float]]:
        """
        Finds the ancestor prerequisite holding the student back.
        Returns (weakest_ancestor_id, mastery_score) or None if all prerequisites are clear.
        """
        ancestors = self.get_all_ancestors(target_concept)
        if not ancestors:
            return None

        failing = []
        for anc in ancestors:
            score = mastery_map.get(anc, 0.10)
            if score < threshold:
                failing.append((anc, score))

        if not failing:
            return None

        # Sort by lowest score first
        failing.sort(key=lambda item: item[1])
        return failing[0]

    def recommend_next_activity(
        self,
        target_concept: str,
        mastery_map: Dict[str, float],
        concept_metadata: Dict[str, Dict[str, Any]],
        threshold: float = 0.70
    ) -> Dict[str, Any]:
        """
        Computes the adaptive recommendation:
        If target concept has failing prerequisites -> divert to weakest prerequisite.
        Otherwise -> proceed with target concept or advance to next unlocked concept.
        """
        weakest = self.find_weakest_blocking_prerequisite(target_concept, mastery_map, threshold)

        if weakest is not None:
            weak_id, weak_score = weakest
            weak_meta = concept_metadata.get(weak_id, {"title": weak_id})
            target_meta = concept_metadata.get(target_concept, {"title": target_concept})
            return {
                "action": "remediate",
                "recommended_concept_id": weak_id,
                "recommended_concept_title": weak_meta.get("title", weak_id),
                "reason": f"Prerequisite gap detected: '{weak_meta.get('title')}' is at {int(weak_score * 100)}% (threshold {int(threshold * 100)}%). Master this before proceeding to '{target_meta.get('title')}'.",
                "is_diverted": True,
                "target_concept_id": target_concept
            }

        target_score = mastery_map.get(target_concept, 0.10)
        target_meta = concept_metadata.get(target_concept, {"title": target_concept})

        if target_score >= threshold:
            # Concept already solid, find next dependent concept
            for c_id, prereqs in self.adj.items():
                if target_concept in prereqs and self.is_unlocked(c_id, mastery_map, threshold):
                    next_meta = concept_metadata.get(c_id, {"title": c_id})
                    return {
                        "action": "advance",
                        "recommended_concept_id": c_id,
                        "recommended_concept_title": next_meta.get("title", c_id),
                        "reason": f"Prerequisite '{target_meta.get('title')}' is solid ({int(target_score * 100)}%). Advanced to next topic: '{next_meta.get('title')}'.",
                        "is_diverted": False,
                        "target_concept_id": c_id
                    }

        return {
            "action": "practice",
            "recommended_concept_id": target_concept,
            "recommended_concept_title": target_meta.get("title", target_concept),
            "reason": f"Continue targeted practice in '{target_meta.get('title')}' to achieve solid mastery.",
            "is_diverted": False,
            "target_concept_id": target_concept
        }
