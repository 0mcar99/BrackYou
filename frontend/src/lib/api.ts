import { API_BASE_URL } from "./constants";

export async function fetchJson(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const errorText = await res.text();
    let message = errorText;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.detail) {
        message = typeof parsed.detail === "string" ? parsed.detail : JSON.stringify(parsed.detail);
      } else if (parsed.message) {
        message = parsed.message;
      }
    } catch {
      // Keep plain text message
    }
    throw new Error(message || `Request failed with status ${res.status}`);
  }
  return res.json();
}

// Auth & User Portal
export const registerUser = (payload: { name: string; phone_number: string; email: string; password: string; role?: string }) =>
  fetchJson("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const loginUser = (payload: { identifier: string; password?: string }) =>
  fetchJson("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getMe = (userId: string) => fetchJson(`/auth/me?user_id=${encodeURIComponent(userId)}`);
export const listUsers = () => fetchJson("/auth/users");

// Curriculum
export const getCurriculumGraph = () => fetchJson("/curriculum/graph");
export const getConcepts = () => fetchJson("/curriculum/concepts");

// Adaptive
export const getStudentMastery = (studentId: string) => fetchJson(`/adaptive/mastery/${studentId}`);
export const getNextActivity = (studentId: string, targetConceptId = "dependency_injection") => 
  fetchJson(`/adaptive/next-activity/${studentId}?target_concept_id=${targetConceptId}`);

// Assessment
export const getQuestions = () => fetchJson("/assessment/questions");
export const getQuestionDetail = (id: string) => fetchJson(`/assessment/questions/${id}`);
export const runCode = (code: string, language: string, questionId?: string, customInput?: string) => 
  fetchJson("/assessment/run", {
    method: "POST",
    body: JSON.stringify({ code, language, question_id: questionId, custom_input: customInput })
  });
export const getSocraticHint = (payload: { code: string; language: string; question_id: string; last_error?: string; test_results?: any[] }) =>
  fetchJson("/assessment/hint", {
    method: "POST",
    body: JSON.stringify(payload)
  });
export const submitCode = (payload: { student_id: string; question_id: string; code: string; language: string; session_id?: string }) =>
  fetchJson("/assessment/submit", {
    method: "POST",
    body: JSON.stringify(payload)
  });

// Telemetry & Replay
export const uploadTelemetryEvents = (sessionId: string, events: any[]) =>
  fetchJson("/telemetry/events", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, events })
  });
export const getSessionReplay = (sessionId: string) => fetchJson(`/telemetry/session/${sessionId}/replay`);
export const updateSignalDisposition = (signalId: string, disposition: string) =>
  fetchJson(`/telemetry/signals/${signalId}/disposition`, {
    method: "POST",
    body: JSON.stringify({ disposition })
  });
export const addStudentRebuttal = (signalId: string, rebuttal: string) =>
  fetchJson(`/telemetry/signals/${signalId}/rebuttal`, {
    method: "POST",
    body: JSON.stringify({ rebuttal })
  });

// Viva
export const generateViva = (submissionId: string, conceptTitle?: string) =>
  fetchJson("/viva/generate", {
    method: "POST",
    body: JSON.stringify({ submission_id: submissionId, concept_title: conceptTitle })
  });
export const evaluateViva = (submissionId: string, questionText: string, studentAnswer: string, keyConcepts?: string[]) =>
  fetchJson("/viva/evaluate", {
    method: "POST",
    body: JSON.stringify({
      submission_id: submissionId,
      question_text: questionText,
      student_answer: studentAnswer,
      key_concepts: keyConcepts
    })
  });

// Trainer
export const getCohortHeatmap = () => fetchJson("/trainer/cohort-heatmap");
export const getIntegrityReviews = () => fetchJson("/trainer/reviews");
export const getAtRiskStudents = () => fetchJson("/trainer/at-risk");

// SheetDB
export const getSheetDBStatus = () => fetchJson("/sheetdb/status");
export const saveSheetDBConfig = (apiUrl: string) =>
  fetchJson("/sheetdb/config", {
    method: "POST",
    body: JSON.stringify({ api_url: apiUrl }),
  });
export const syncSheetDB = () =>
  fetchJson("/sheetdb/sync", {
    method: "POST",
  });

// RAG AI Tutor
export const explainFailedTest = (payload: {
  student_id: string;
  question_id: string;
  code: string;
  execution_status: string;
  stderr?: string;
  test_details?: any[];
  language?: string;
}) =>
  fetchJson("/tutor/explain-test", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const searchTutorKnowledge = (payload: {
  query: string;
  concept_id?: string;
  top_k?: number;
}) =>
  fetchJson("/tutor/search-knowledge", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getTutorDocuments = () => fetchJson("/tutor/documents");

// 5-Mode RAG Tutor Chat
export const tutorChat = (payload: {
  student_id: string;
  mode: "learn" | "debug" | "hint" | "explain" | "exam";
  query: string;
  code?: string;
  context?: any;
}) =>
  fetchJson("/tutor/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// Innovation 1: AI Learning Gap Radar
export const getLearningGapRadar = (studentId: string) =>
  fetchJson(`/tutor/learning-gap-radar/${studentId}`);

// Innovation 3: Personal Error DNA
export const getErrorDNA = (studentId: string) =>
  fetchJson(`/tutor/error-dna/${studentId}`);

// Innovation 4: Code Change Prediction Lab
export const getPredictionScenarios = () =>
  fetchJson("/tutor/prediction-lab/scenarios");

export const evaluatePrediction = (payload: {
  student_id: string;
  scenario_id: string;
  selected_option: string;
  reasoning?: string;
}) =>
  fetchJson("/tutor/prediction-lab/evaluate", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// Innovation 5: Job-Role Skill Gap Analyzer
export const getJobRoleGap = (studentId: string, targetRole: string = "backend_developer") =>
  fetchJson(`/tutor/job-role-gap/${studentId}?target_role=${targetRole}`);


