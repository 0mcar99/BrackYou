import React from "react";

interface SegmentedBarProps {
  value: number; // 0 to 100
  totalBlocks?: number;
  color?: "orange" | "teal" | "red";
  className?: string;
  showLabels?: boolean;
}

export const SegmentedBar: React.FC<SegmentedBarProps> = ({
  value,
  totalBlocks = 10,
  color = "orange",
  className = "",
  showLabels = false,
}) => {
  const filledBlocks = Math.round((Math.max(0, Math.min(100, value)) / 100) * totalBlocks);

  const fillColors = {
    orange: "bg-accentOrange border-accentBrown",
    teal: "bg-accentTeal border-accentBrown",
    red: "bg-accentRed border-accentBrown",
  }[color];

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center gap-1.5 w-full">
        {Array.from({ length: totalBlocks }).map((_, idx) => {
          const isFilled = idx < filledBlocks;
          return (
            <div
              key={idx}
              className={`h-4 flex-1 rounded-[4px] border-[2px] transition-all duration-300 ${
                isFilled
                  ? `${fillColors} shadow-[0_2px_0_#4A2C1A]`
                  : "bg-cream/70 border-borderLight"
              }`}
            />
          );
        })}
      </div>
      {showLabels && (
        <div className="flex justify-between items-center mt-1.5 text-xs font-semibold text-textSecondary">
          <span>0%</span>
          <span>{value}%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
};
