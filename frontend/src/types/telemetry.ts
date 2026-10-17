export type AnomalyType = 'PASTE_BURST' | 'METRONOME_CADENCE' | 'TAB_BLUR' | 'NO_CORRECTIONS';

export interface TelemetryEvent {
  t: number;                  // Milliseconds from session start
  type: 'key' | 'paste' | 'window' | 'run';
  action?: 'insert' | 'delete' | 'focus' | 'blur';
  key?: string;
  charCount?: number;
  contentSnapshot: string;    // Document snapshot at this millisecond
}

export interface AnomalyMarker {
  timestampMs: number;
  timeFormatted: string;
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high';
  charDelta: number;
  description: string;
}

export interface SessionPlaybackData {
  sessionId: string;
  totalDurationMs: number;
  events: TelemetryEvent[];
  anomalies: AnomalyMarker[];
  integrityScore: number;
  backspaceRatio: number;
  writeRunFixCycles: number;
}
