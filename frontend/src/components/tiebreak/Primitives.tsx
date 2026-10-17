import React from 'react';

export const TiebreakCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  ribbonText?: string;
  ribbonColor?: 'orange' | 'teal' | 'yellow' | 'red';
  onClick?: () => void;
}> = ({ children, className = '', ribbonText, ribbonColor = 'orange', onClick }) => {
  const ribbonBg = {
    orange: 'bg-[#E8622B] text-white',
    teal: 'bg-[#2A7A6B] text-white',
    yellow: 'bg-[#F5C842] text-[#4A2C1A]',
    red: 'bg-[#D94F3D] text-white',
  }[ribbonColor];

  return (
    <div
      onClick={onClick}
      className={`relative bg-[#FFFDF7] border-[2.5px] border-[#4A2C1A] rounded-[20px] shadow-[4px_4px_0px_#4A2C1A] p-6 overflow-hidden ${className}`}
    >
      {ribbonText && (
        <div
          className={`absolute top-4 -right-12 rotate-45 px-12 py-1 text-[11px] font-black tracking-wider uppercase border-y border-[#4A2C1A] shadow-sm ${ribbonBg}`}
        >
          {ribbonText}
        </div>
      )}
      {children}
    </div>
  );
};

export const SegmentedBar: React.FC<{
  totalBlocks?: number;
  filledBlocks: number;
  variant?: 'orange' | 'teal' | 'red';
  className?: string;
}> = ({ totalBlocks = 10, filledBlocks, variant = 'orange', className = '' }) => {
  const getBlockColor = (idx: number) => {
    if (idx >= filledBlocks) return 'bg-[#E8DCC8]';
    if (variant === 'teal') return 'bg-[#2A7A6B]';
    if (variant === 'red') return 'bg-[#D94F3D]';
    return 'bg-[#E8622B]';
  };

  return (
    <div className={`flex gap-1.5 w-full ${className}`}>
      {Array.from({ length: totalBlocks }).map((_, i) => (
        <div
          key={i}
          className={`h-3.5 flex-1 rounded-[4px] border-[1.5px] border-[#4A2C1A] transition-all duration-300 ${getBlockColor(i)}`}
        />
      ))}
    </div>
  );
};

export const PillBadge: React.FC<{
  children: React.ReactNode;
  variant?: 'teal' | 'orange' | 'yellow' | 'red' | 'neutral';
  className?: string;
}> = ({ children, variant = 'neutral', className = '' }) => {
  const styles = {
    teal: 'bg-[#2A7A6B]/15 text-[#2A7A6B] border-[#2A7A6B]',
    orange: 'bg-[#E8622B]/15 text-[#E8622B] border-[#E8622B]',
    yellow: 'bg-[#F5C842]/30 text-[#6B4F3A] border-[#4A2C1A]',
    red: 'bg-[#D94F3D]/15 text-[#D94F3D] border-[#D94F3D]',
    neutral: 'bg-[#E8DCC8]/50 text-[#6B4F3A] border-[#4A2C1A]',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black border-[1.5px] ${styles} ${className}`}
    >
      {children}
    </span>
  );
};

export const TiebreakButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'neutral' | 'danger';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
  type = 'button'
}) => {
  const variants = {
    primary: 'bg-[#E8622B] text-white hover:bg-[#d45520] shadow-[3px_3px_0px_#4A2C1A]',
    secondary: 'bg-[#2A7A6B] text-white hover:bg-[#206155] shadow-[3px_3px_0px_#4A2C1A]',
    neutral: 'bg-[#FFFDF7] text-[#4A2C1A] hover:bg-[#FDF6E8] shadow-[2px_2px_0px_#4A2C1A]',
    danger: 'bg-[#D94F3D] text-white hover:bg-[#b83e2e] shadow-[3px_3px_0px_#4A2C1A]'
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-5 py-2 rounded-full border-[2.5px] border-[#4A2C1A] font-black text-xs transition-all duration-150 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variants} ${className}`}
    >
      {children}
    </button>
  );
};
