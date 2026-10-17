import React from 'react';
import { ConceptNodeData } from '../../types/adaptive';

interface ConceptNodeProps {
  concept: ConceptNodeData;
  isSelected?: boolean;
  onSelect: (concept: ConceptNodeData) => void;
}

export const ConceptNode: React.FC<ConceptNodeProps> = ({
  concept,
  isSelected = false,
  onSelect,
}) => {
  const getNodeColor = (status: ConceptNodeData['status']) => {
    switch (status) {
      case 'mastered':
        return 'bg-[#2A7A6B] text-white border-[#4A2C1A] shadow-[4px_4px_0px_#4A2C1A]';
      case 'learning':
        return 'bg-[#F5C842] text-[#4A2C1A] border-[#4A2C1A] shadow-[4px_4px_0px_#4A2C1A]';
      case 'weak_prerequisite':
        return 'bg-[#D94F3D] text-white border-[#4A2C1A] shadow-[4px_4px_0px_#4A2C1A] animate-bounce';
      case 'locked':
        return 'bg-[#E8DCC8] text-[#9C8B7A] border-[#9C8B7A] border-dashed shadow-[2px_2px_0px_#9C8B7A]';
    }
  };

  const getLevelLabel = (diff: number) => {
    switch (diff) {
      case 1:
        return 'Lvl 1 · Anchor';
      case 2:
        return 'Lvl 2 · Intermediate';
      case 3:
        return 'Lvl 3 · Frameworks';
      default:
        return `Lvl ${diff}`;
    }
  };

  const masteryPct = Math.round(concept.masteryProbability * 100);

  return (
    <div
      onClick={() => onSelect(concept)}
      className={`p-4 rounded-2xl border-[2.5px] cursor-pointer text-center min-w-[170px] max-w-[210px] transition-all transform hover:scale-105 select-none relative ${getNodeColor(
        concept.status
      )} ${isSelected ? 'ring-4 ring-[#E8622B] scale-105' : ''}`}
    >
      {/* Level Tag */}
      <div className="text-[10px] uppercase font-black tracking-wider opacity-90">
        {getLevelLabel(concept.difficulty)}
      </div>

      {/* Concept Label */}
      <div className="font-extrabold text-sm mt-1 leading-snug line-clamp-2">
        {concept.label}
      </div>

      {/* Mastery Bar / Percentage */}
      <div className="text-xs font-mono font-bold mt-2.5 pt-2 border-t border-current/20">
        {concept.status === 'locked' ? (
          <span className="flex items-center justify-center gap-1">
            🔒 <span>Prereq Missing</span>
          </span>
        ) : (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span>Mastery:</span>
              <span>{masteryPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-current transition-all"
                style={{ width: `${masteryPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Weak Prerequisite Alert Callout */}
      {concept.status === 'weak_prerequisite' && (
        <div className="absolute -top-3 -right-2 px-2 py-0.5 bg-[#4A2C1A] text-[#F5C842] text-[9px] font-black rounded-full border border-white uppercase tracking-wider">
          Remediate!
        </div>
      )}
    </div>
  );
};
