import React, { useState, useEffect, useMemo } from 'react';
import { SessionPlaybackData, AnomalyMarker } from '../../types/telemetry';
import { TiebreakCard, PillBadge } from '../tiebreak/Primitives';
import { TimelineScrubber } from './TimelineScrubber';

interface Props {
  playbackData: SessionPlaybackData;
  className?: string;
}

export const SessionReplayPlayer: React.FC<Props> = ({ playbackData, className = '' }) => {
  const [currentMs, setCurrentMs] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyMarker | null>(null);

  // Find nearest code snapshot and event at currentMs
  const { currentCode, lastEvent } = useMemo(() => {
    const relevantEvents = playbackData.events.filter(e => e.t <= currentMs);
    if (relevantEvents.length > 0) {
      const latest = relevantEvents[relevantEvents.length - 1];
      return {
        currentCode: latest.contentSnapshot,
        lastEvent: latest,
      };
    }
    return {
      currentCode: '// Session start: initial state\n// Waiting for keystrokes...',
      lastEvent: null,
    };
  }, [currentMs, playbackData.events]);

  // Handle Play/Pause timer loop with dynamic speed
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      const stepMs = 500 * playbackSpeed;
      const intervalDelay = 100;
      interval = setInterval(() => {
        setCurrentMs((prev) => {
          if (prev >= playbackData.totalDurationMs) {
            setIsPlaying(false);
            return playbackData.totalDurationMs;
          }
          return Math.min(playbackData.totalDurationMs, prev + stepMs);
        });
      }, intervalDelay);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackData.totalDurationMs, playbackSpeed]);

  const jumpToAnomaly = (anomaly: AnomalyMarker) => {
    setCurrentMs(anomaly.timestampMs);
    setSelectedAnomaly(anomaly);
    setIsPlaying(false);
  };

  return (
    <TiebreakCard className={`space-y-5 ${className}`} ribbonText="Process Evidentiary" ribbonColor="yellow">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h3 className="text-lg font-black uppercase text-[#2D1B0E] flex items-center gap-2">
            Session Timeline Replay
          </h3>
          <span className="text-xs font-bold text-[#9C8B7A]">Forensic Keystroke & Telemetry Verification</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PillBadge variant="teal">{playbackData.writeRunFixCycles} Run Cycles</PillBadge>
          <PillBadge variant="neutral">{playbackData.backspaceRatio}% Deletions</PillBadge>
          <PillBadge variant={playbackData.integrityScore >= 70 ? 'teal' : 'red'}>
            Integrity: {playbackData.integrityScore}%
          </PillBadge>
        </div>
      </div>

      {/* REPLAY SCRUBBER BAR WITH ANOMALY MARKERS */}
      <TimelineScrubber
        currentMs={currentMs}
        totalDurationMs={playbackData.totalDurationMs}
        anomalies={playbackData.anomalies}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        onSeek={(ms) => {
          setCurrentMs(ms);
          setSelectedAnomaly(null);
        }}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onReset={() => {
          setCurrentMs(0);
          setIsPlaying(false);
          setSelectedAnomaly(null);
        }}
        onSelectAnomaly={jumpToAnomaly}
        onChangeSpeed={setPlaybackSpeed}
      />

      {/* ACTIVE EVENT STATUS BADGE */}
      {lastEvent && (
        <div className="flex items-center justify-between text-[11px] font-mono bg-[#FDF6E8] p-2 rounded-lg border border-[#4A2C1A]/20">
          <div className="flex items-center gap-2">
            <span className="font-black text-[#E8622B]">Last Action:</span>
            <span className="font-bold text-[#4A2C1A]">
              [{lastEvent.type}] {lastEvent.action || ''} {lastEvent.key ? `'${lastEvent.key}'` : ''}
            </span>
          </div>
          {lastEvent.charCount !== undefined && (
            <span className="font-extrabold text-[#2A7A6B]">Length: {lastEvent.charCount} chars</span>
          )}
        </div>
      )}

      {/* CODE SNAPSHOT CONTAINER */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-black uppercase text-[#6B4F3A]">
          <span>Recorded Editor State at Playhead:</span>
          <span className="font-mono text-[10px] text-[#9C8B7A]">Lines: {currentCode.split('\n').length}</span>
        </div>
        <div className="bg-[#2D1B0E] p-4 rounded-xl border-[2px] border-[#4A2C1A] font-mono text-xs text-[#FFFDF7] overflow-x-auto h-52 scrollbar-thin shadow-inner">
          <pre className="whitespace-pre-wrap">{currentCode}</pre>
        </div>
      </div>

      {/* LOGGED EVIDENCE FLAGS */}
      <div className="space-y-2">
        <span className="text-xs font-black uppercase text-[#9C8B7A]">Evidence Log for Reviewer:</span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {playbackData.anomalies.map((anom, idx) => {
            const isSelected = selectedAnomaly?.timestampMs === anom.timestampMs;
            return (
              <div
                key={idx}
                onClick={() => jumpToAnomaly(anom)}
                className={`flex items-center justify-between p-2.5 rounded-lg border-[1.5px] cursor-pointer text-xs transition-all ${
                  isSelected
                    ? 'border-[#E8622B] bg-[#FFF0E6] shadow-sm ring-1 ring-[#E8622B]'
                    : 'border-[#4A2C1A] bg-[#FFFDF7] hover:bg-[#FDF6E8]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#E8622B]">@{anom.timeFormatted}</span>
                  <span className="font-extrabold text-[#4A2C1A]">{anom.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    anom.severity === 'high' ? 'bg-[#D94F3D]/20 text-[#D94F3D]' : 'bg-[#F5C842]/30 text-[#6B4F3A]'
                  }`}>
                    {anom.severity.toUpperCase()}
                  </span>
                  <span className="font-black text-[#2A7A6B]">Seek ⏩</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TiebreakCard>
  );
};
