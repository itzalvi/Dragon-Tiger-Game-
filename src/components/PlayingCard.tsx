import React from 'react';
import { Card } from '../types/game';

interface PlayingCardProps {
  card: Card | null;
  isFlipped: boolean;
  label?: string;
  isWinning?: boolean;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  isFlipped,
  label,
  isWinning
}) => {
  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className="text-[11px] font-black uppercase tracking-wider text-amber-200 mb-1 drop-shadow">
          {label}
        </span>
      )}

      <div
        className={`relative w-20 h-28 sm:w-24 sm:h-34 transition-all duration-700 perspective-1000 ${
          isWinning ? 'scale-105 ring-4 ring-amber-400 rounded-xl shadow-2xl shadow-amber-400/50' : ''
        }`}
      >
        <div
          className={`relative w-full h-full rounded-xl shadow-xl transition-transform duration-700 transform-style-preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Card Back (Face Down): Gold Filigree Pattern + Flaming Glow matching Screenshot 3 */}
          <div className="absolute inset-0 w-full h-full rounded-xl bg-gradient-to-br from-amber-700 via-yellow-600 to-amber-900 border-2 border-yellow-300 p-1 backface-hidden shadow-2xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#FDE047_1px,transparent_1px)] [background-size:8px_8px] opacity-35" />
            
            {/* Inner filigree border */}
            <div className="relative w-full h-full rounded-lg border border-yellow-200/80 flex items-center justify-center p-1 bg-amber-900/60">
              <div className="w-10 h-10 rounded-full border-2 border-yellow-400/80 flex items-center justify-center bg-gradient-to-br from-amber-500 to-yellow-600 shadow-inner">
                <span className="text-sm font-black text-slate-950">3P</span>
              </div>
            </div>

            {/* Fire flame aura around card */}
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-t from-orange-500/30 via-yellow-400/20 to-transparent pointer-events-none animate-flame" />
          </div>

          {/* Card Front (Face Up): Clean Casino Playing Card */}
          <div className="absolute inset-0 w-full h-full rounded-xl bg-gradient-to-b from-white via-slate-50 to-amber-50 border-2 border-amber-300 p-2 backface-hidden rotate-y-180 shadow-2xl flex flex-col justify-between overflow-hidden">
            {card ? (
              <>
                {/* Top Left Index */}
                <div className={`text-left leading-none font-black ${card.color === 'red' ? 'text-red-600' : 'text-slate-900'}`}>
                  <div className="text-sm sm:text-base">{card.rank}</div>
                  <div className="text-xs sm:text-sm">{card.suit}</div>
                </div>

                {/* Center Court Symbol */}
                <div className="flex flex-col items-center justify-center my-auto">
                  <span className={`text-2xl sm:text-3xl ${card.color === 'red' ? 'text-red-600' : 'text-slate-900'}`}>
                    {card.suit}
                  </span>
                  <span className="text-[10px] font-black font-mono text-slate-500">
                    PTS: {card.value}
                  </span>
                </div>

                {/* Bottom Right Index */}
                <div className={`text-right leading-none font-black rotate-180 ${card.color === 'red' ? 'text-red-600' : 'text-slate-900'}`}>
                  <div className="text-sm sm:text-base">{card.rank}</div>
                  <div className="text-xs sm:text-sm">{card.suit}</div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
