import React from "react";

interface RibbonCardProps {
  ribbonText?: string;
  ribbonColor?: "orange" | "teal" | "yellow" | "red";
  children: React.ReactNode;
  className?: string;
}

export const RibbonCard: React.FC<RibbonCardProps> = ({
  ribbonText,
  ribbonColor = "orange",
  children,
  className = "",
}) => {
  const ribbonBg = {
    orange: "bg-accentOrange text-white",
    teal: "bg-accentTeal text-white",
    yellow: "bg-accentYellow text-textPrimary",
    red: "bg-accentRed text-white",
  }[ribbonColor];

  return (
    <div className={`tiebreak-card relative overflow-hidden p-6 ${className}`}>
      {ribbonText && (
        <div className="absolute top-4 -right-12 rotate-45 z-10">
          <div
            className={`text-[10px] font-heading tracking-widest uppercase font-extrabold py-1 px-12 border-y-[2px] border-accentBrown shadow-sm text-center ${ribbonBg}`}
          >
            {ribbonText}
          </div>
        </div>
      )}
      {children}
    </div>
  );
};
