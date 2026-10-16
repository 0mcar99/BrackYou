import React from "react";

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "neutral";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const PillButton: React.FC<PillButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}) => {
  const variantStyles = {
    primary: "bg-accentOrange text-white hover:bg-[#d65520]",
    secondary: "bg-accentTeal text-white hover:bg-[#23685b]",
    danger: "bg-accentRed text-white hover:bg-[#be4332]",
    neutral: "bg-card text-textPrimary hover:bg-cream",
  }[variant];

  const sizeStyles = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  }[size];

  return (
    <button
      className={`tiebreak-btn inline-flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
