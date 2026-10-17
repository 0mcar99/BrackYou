import React, { useState } from 'react';
import { ConceptNodeData, PrerequisiteEdge } from '../../types/adaptive';
import { TiebreakCard, PillBadge } from '../tiebreak/Primitives';
import { ConceptNode } from './ConceptNode';

interface Props {
  concepts: ConceptNodeData[];
  edges: PrerequisiteEdge[];
  onSelectConcept?: (concept: ConceptNodeData) => void;
  onSimulateBKT?: (conceptId: string, isCorrect: boolean) => void;
}

export const SkillTreeGraph: React.FC<Props> = ({
  concepts,
  edges,
  onSelectConcept,
  onSimulateBKT,
}) => {
  const [selectedConcept, setSelectedConcept] = useState<ConceptNodeData | null>(
    concepts.find((c) => c.status === 'weak_prerequisite') || concepts[0] || null
  );

  const handleNodeClick = (concept: ConceptNodeData) => {
    setSelectedConcept(concept);
    if (onSelectConcept) onSelectConcept(concept);
  };

  const level1 = concepts.filter((c) => c.difficulty === 1);
  const level2 = concepts.filter((c) => c.difficulty === 2);
  const level3 = concepts.filter((c) => c.difficulty === 3);

  return (
    <TiebreakCard className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 border-b-[2px] border-[#E8DCC8] pb-4">
        <div>
          <h3 className="text-xl font-extrabold text-[#2D1B0E]">Interactive Knowledge DAG</h3>
          <p className="text-xs font-bold text-[#6B4F3A]">
            Prerequisite Dependencies & Bayesian Knowledge Tracing (BKT) Status
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <PillBadge variant="teal">🟢 Mastered (≥85%)</PillBadge>
          <PillBadge variant="yellow">🟡 In Progress</PillBadge>
          <PillBadge variant="red">🔴 Prerequisite Gap (&lt;40%)</PillBadge>
          <PillBadge variant="neutral">🔒 Locked</PillBadge>
        </div>
      </div>

      {/* SVG GRAPH CANVAS */}
      <div className="relative overflow-x-auto p-6 bg-[#FDF6E8] rounded-xl border-[2px] border-[#E8DCC8]">
        <div className="min-w-[650px] flex flex-col gap-6 items-center">
          
          {/* Level 1: Foundations */}
          <div className="w-full">
            <div className="text-[11px] font-black uppercase tracking-wider text-[#9C8B7A] mb-3 text-center">
              Level 1: Foundational Anchors
            </div>
            <div className="flex justify-center gap-8 flex-wrap">
              {level1.map((concept) => (
                <ConceptNode
                  key={concept.id}
                  concept={concept}
                  isSelected={selectedConcept?.id === concept.id}
                  onSelect={handleNodeClick}
                />
              ))}
            </div>
          </div>

          <div className="text-xs font-black text-[#4A2C1A] flex items-center gap-2 bg-[#FFFDF7] px-4 py-1 rounded-full border border-[#4A2C1A]/20">
            <span>↓↓</span> Prerequisite Verification Edges <span>↓↓</span>
          </div>

          {/* Level 2: Core Concepts */}
          <div className="w-full">
            <div className="text-[11px] font-black uppercase tracking-wider text-[#9C8B7A] mb-3 text-center">
              Level 2: Core Intermediate Principles
            </div>
            <div className="flex justify-center gap-8 flex-wrap">
              {level2.map((concept) => (
                <ConceptNode
                  key={concept.id}
                  concept={concept}
                  isSelected={selectedConcept?.id === concept.id}
                  onSelect={handleNodeClick}
                />
              ))}
            </div>
          </div>

          <div className="text-xs font-black text-[#4A2C1A] flex items-center gap-2 bg-[#FFFDF7] px-4 py-1 rounded-full border border-[#4A2C1A]/20">
            <span>↓↓</span> Downstream Framework Gates <span>↓↓</span>
          </div>

          {/* Level 3: Advanced Frameworks */}
          <div className="w-full">
            <div className="text-[11px] font-black uppercase tracking-wider text-[#9C8B7A] mb-3 text-center">
              Level 3: Framework Implementations
            </div>
            <div className="flex justify-center gap-8 flex-wrap">
              {level3.map((concept) => (
                <ConceptNode
                  key={concept.id}
                  concept={concept}
                  isSelected={selectedConcept?.id === concept.id}
                  onSelect={handleNodeClick}
                />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* SELECTED CONCEPT INSPECTOR & BKT SIMULATION PANEL */}
      {selectedConcept && (
        <div className="p-4 rounded-xl border-[2px] border-[#4A2C1A] bg-[#FFFDF7] space-y-3">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#9C8B7A]">
                Inspecting Concept Node:
              </span>
              <h4 className="text-base font-extrabold text-[#2D1B0E]">{selectedConcept.label}</h4>
            </div>

            <div className="flex items-center gap-2">
              <PillBadge
                variant={
                  selectedConcept.status === 'mastered'
                    ? 'teal'
                    : selectedConcept.status === 'weak_prerequisite'
                    ? 'red'
                    : selectedConcept.status === 'learning'
                    ? 'yellow'
                    : 'neutral'
                }
              >
                Status: {selectedConcept.status.replace('_', ' ').toUpperCase()}
              </PillBadge>
              <PillBadge variant="neutral">
                BKT Latent: {(selectedConcept.masteryProbability * 100).toFixed(1)}%
              </PillBadge>
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-3 pt-2 border-t border-[#E8DCC8]">
            <div className="text-xs font-bold text-[#6B4F3A]">
              Prerequisites:{' '}
              {selectedConcept.prerequisites.length > 0 ? (
                <span className="font-mono text-[#E8622B]">
                  {selectedConcept.prerequisites.join(', ')}
                </span>
              ) : (
                <span className="text-[#2A7A6B]">None (Foundational Root)</span>
              )}
            </div>

            {onSimulateBKT && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#4A2C1A]">Test BKT Routing:</span>
                <button
                  type="button"
                  onClick={() => onSimulateBKT(selectedConcept.id, true)}
                  className="px-3 py-1 rounded-full border-[1.5px] border-[#4A2C1A] bg-[#2A7A6B] text-white text-xs font-black hover:bg-[#206155] cursor-pointer"
                >
                  + Pass (Mastery ↑)
                </button>
                <button
                  type="button"
                  onClick={() => onSimulateBKT(selectedConcept.id, false)}
                  className="px-3 py-1 rounded-full border-[1.5px] border-[#4A2C1A] bg-[#D94F3D] text-white text-xs font-black hover:bg-[#b83e2e] cursor-pointer"
                >
                  - Fail (Remediation ⚡)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </TiebreakCard>
  );
};
