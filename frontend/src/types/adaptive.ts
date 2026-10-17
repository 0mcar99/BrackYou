export interface ConceptNodeData {
  id: string;
  slug: string;
  label: string;
  masteryProbability: number; // 0.00 to 1.00 (from BKT)
  status: 'mastered' | 'learning' | 'weak_prerequisite' | 'locked';
  difficulty: number;
  prerequisites: string[];     // IDs of blocking upstream nodes
  questionCount: number;
}

export interface PrerequisiteEdge {
  id: string;
  source: string;
  target: string;
  isStrict: boolean;
  animated?: boolean;
}

export interface BKTUpdatePayload {
  pPrior: number;
  isCorrect: boolean;
  pTransit?: number;
  pSlip?: number;
  pGuess?: number;
}

export interface BKTUpdateResult {
  prior: number;
  posterior: number;
  isMastered: boolean;
}
