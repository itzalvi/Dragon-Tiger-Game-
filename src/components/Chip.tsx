import React from 'react';
import { ChipValue } from '../types/game';

interface ChipProps {
  value: ChipValue;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  labelOverride?: string;
}

const CHIP_STYLES: Record<ChipValue, { bg: string; border: string; text: string; edge: string; inner: string }> = {
  10: {
    bg: 'from-amber-800 to-amber-950',
    border: 'border-amber-600',
    text: 'text-amber-100',
    edge: 'border-amber-700/60',
    inner: 'bg-amber-900/80',
  },
  20: {
    bg: 'from-red-900 to-amber-950',
    border: 'border-red-600',
    text: 'text-red-100',
    edge: 'border-red-700/60',
    inner: 'bg-red-950/80',
  },
  100: {
    bg: 'from-blue-600 to-sky-900',
    border: 'border-sky-400',
    text: 'text-white',
    edge: 'border-sky-300/80',
    inner: 'bg-blue-950/80',
  },
  200: {
    bg: 'from-purple-700 to-purple-950',
    border: 'border-purple-400',
    text: 'text-purple-100',
    edge: 'border-purple-300/80',
    inner: 'bg-purple-900/80',
  },
  1000: {
    bg: 'from-amber-500 to-yellow-600',
    border: 'border-yellow-200',
    text: 'text-slate-950',
    edge: 'border-yellow-100/90',
    inner: 'bg-amber-400/90',
  },
  2000: {
    bg: 'from-teal-600 to-cyan-900',
    border: 'border-cyan-300',
    text: 'text-white',
    edge: 'border-cyan-200/80',
    inner: 'bg-teal-950/80',
  },
  10000: {
    bg: 'from-indigo-900 to-slate-950',
    border: 'border-amber-400',
    text: 'text-amber-300',
    edge: 'border-amber-300/80',
    inner: 'bg-indigo-950/90',
  },
};

export const Chip: React.FC<ChipProps> = ({
  value,
  isSelected = false,
  onClick,
  size = 'md',
  labelOverride
}) => {
  const style = CHIP_STYLES[value];

  const sizeClasses = {
    sm: 'w-7 h-7 text-[9px] border-[2px]',
    md: 'w-10 h-10 text-[11px] border-[3px]',
    lg: 'w-13 h-13 text-xs border-[3px]',
  }[size];

  const displayLabel = labelOverride || (
    value >= 1000 ? `${value / 1000}K` : `${value}`
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-full font-black flex items-center justify-center transition-all duration-200 select-none shadow-md ${sizeClasses} bg-gradient-to-br ${style.bg} ${style.border} ${
        isSelected
          ? 'scale-115 -translate-y-1.5 ring-4 ring-yellow-400 shadow-xl shadow-yellow-400/50 z-20'
          : 'hover:scale-105 hover:-translate-y-0.5 active:scale-95'
      }`}
    >
      {/* Dashed outer chip ring pattern */}
      <div className={`absolute inset-0.5 rounded-full border border-dashed ${style.edge} pointer-events-none opacity-80`} />

      {/* Inner chip core */}
      <div className={`w-3/4 h-3/4 rounded-full flex flex-col items-center justify-center border border-white/20 shadow-inner ${style.inner}`}>
        <span className={`leading-none drop-shadow-sm ${style.text}`}>
          {displayLabel}
        </span>
        <span className={`text-[7px] leading-tight font-bold tracking-tighter opacity-80 ${style.text}`}>
          CHIP
        </span>
      </div>
    </button>
  );
};
