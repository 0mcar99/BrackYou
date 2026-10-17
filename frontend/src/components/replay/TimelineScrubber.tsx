import React from 'react';
import { AnomalyMarker } from '../../types/telemetry';

interface TimelineScrubberProps {
  currentMs: number;
  totalDurationMs: number;
  anomalies: AnomalyMarker[];
  isPlaying: boolean;
  playbackSpeed?: number;
  onSeek: (ms: number) => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onSelectAnomaly?: (anomaly: AnomalyMarker) => void;
  onChangeSpeed?: (speed: number) => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  currentMs,
  totalDurationMs,
  anomalies,
  isPlaying,
  playbackSpeed = 1,
  onSeek,
  onTogglePlay,
  onReset,
  onSelectAnomaly,
  onChangeSpeed,
}) => {
  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(Math.max(0, ms) / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const safeDuration = totalDurationMs > 0 ? totalDurationMs : 1;
  const progressPercent = Math.min(100, Math.max(0, (currentMs / safeDuration) * 100));

  return (
    <div className="w-full space-y-3">
      {/* Visual Timeline Bar with Pins */}
      <div className="relative w-full pt-5 pb-2">
        {/* Track Container */}
        <div className="relative h-3 w-full bg-[#E8DCC8] rounded-full border-[1.5px] border-[#4A2C1A] overflow-visible">
          {/* Filled Progress Bar */}
          <div
            className="h-full bg-[#E8622B] rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Anomaly Marker Pins */}
          {anomalies.map((anom, idx) => {
            const leftPercent = Math.min(98, Math.max(2, (anom.timestampMs / safeDuration) * 100));
            const isHigh = anom.severity === 'high';
            const badgeBg = isHigh ? 'bg-[#D94F3D]' : anom.severity === 'medium' ? 'bg-[#F5C842]' : 'bg-[#2A7A6B]';
            const textColor = anom.severity === 'medium' ? 'text-[#4A2C1A]' : 'text-white';

            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(anom.timestampMs);
                  if (onSelectAnomaly) onSelectAnomaly(anom);
                }}
                title={`${anom.type} at ${anom.timeFormatted}: ${anom.description}`}
                style={{ left: `${leftPercent}%` }}
                className={`absolute -top-2.5 -translate-x-1/2 w-5 h-5 rounded-full ${badgeBg} ${textColor} border-[1.5px] border-[#4A2C1A] text-[10px] font-black flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#4A2C1A] hover:scale-125 transition-transform z-10`}
              >
                !
              </button>
            );
          })}
        </div>

        {/* Range Slider Overlay */}
        <input
          type="range"
          min={0}
          max={safeDuration}
          value={currentMs}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="w-full accent-[#E8622B] h-2.5 bg-transparent rounded-lg cursor-pointer mt-1"
        />
      </div>

      {/* Control Buttons and Timestamps */}
      <div className="flex flex-wrap justify-between items-center text-xs font-mono font-bold text-[#6B4F3A] gap-2">
        <span className="bg-[#FFFDF7] px-2.5 py-1 rounded-md border border-[#4A2C1A]/20">
          ⏱ {formatTime(currentMs)}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            className="px-4 py-1 rounded-full border-[1.5px] border-[#4A2C1A] bg-[#FFFDF7] font-black text-[#4A2C1A] hover:bg-[#FDF6E8] shadow-[1px_1px_0px_#4A2C1A] cursor-pointer transition-all active:translate-y-0.5"
          >
            {isPlaying ? '⏸ Pause' : `▶ Play ${playbackSpeed}x`}
          </button>

          {onChangeSpeed && (
            <button
              type="button"
              onClick={() => {
                const nextSpeed = playbackSpeed === 1 ? 2 : playbackSpeed === 2 ? 4 : 1;
                onChangeSpeed(nextSpeed);
              }}
              className="px-2.5 py-1 rounded-full border-[1.5px] border-[#4A2C1A] bg-[#FFFDF7] font-black text-xs text-[#4A2C1A] hover:bg-[#FDF6E8] shadow-[1px_1px_0px_#4A2C1A] cursor-pointer"
            >
              {playbackSpeed}x
            </button>
          )}

          <button
            type="button"
            onClick={onReset}
            className="px-3 py-1 rounded-full border-[1.5px] border-[#4A2C1A] bg-[#FFFDF7] font-black text-[#4A2C1A] hover:bg-[#FDF6E8] shadow-[1px_1px_0px_#4A2C1A] cursor-pointer transition-all active:translate-y-0.5"
          >
            ↺ Reset
          </button>
        </div>

        <span className="bg-[#FFFDF7] px-2.5 py-1 rounded-md border border-[#4A2C1A]/20">
          Total: {formatTime(safeDuration)}
        </span>
      </div>
    </div>
  );
};
