export interface VivaQuestionTarget {
  id: string;
  lineRange: [number, number];
  targetedConstruct: string;
  question: string;
}

export interface VivaTurnEvaluation {
  questionId: string;
  studentExplanation: string;
  semanticMatchPercent: number;
  isConsistent: boolean;
  evaluatorFeedback: string;
}
