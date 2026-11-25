import React from 'react';
import { X, TrendingUp, BarChart2 } from 'lucide-react';
import { HistoryRecord } from '../types/game';
import { useGameStore } from '../hooks/useGameStore';

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryRecord[];
}

export const RoadmapModal: React.FC<RoadmapModalProps> = ({
  isOpen,
  onClose,
  history,
}) => {
  const { language } = useGameStore();
  const isUr = language === 'ur';

  if (!isOpen) return null;

  const total = history.length || 1;
  const tigerWins = history.filter((h) => h.winner === 'TIGER').length;
  const dragonWins = history.filter((h) => h.winner === 'DRAGON').length;
  const tieWins = history.filter((h) => h.winner === 'TIE').length;

  const tigerPct = Math.round((tigerWins / total) * 100);
  const dragonPct = Math.round((dragonWins / total) * 100);
  const tiePct = Math.round((tieWins / total) * 100);

  const beadSlots = Array.from({ length: 72 }, (_, idx) => history[idx] || null);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[95%] my-auto bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-2xl shadow-2xl overflow-y-auto text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-extrabold uppercase text-gold-gradient tracking-wide">
              {isUr
                ? 'ٹائیگر بمقابلہ ڈریگن اسکور بورڈ اور ٹرینڈ چارٹ'
                : 'Dragon vs Tiger Scoreboard & Roadmap'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/40 text-center">
              <div className="text-xs font-bold text-blue-300">{isUr ? 'ڈریگن' : 'Dragon'}</div>
              <div className="text-xl font-black text-blue-100 tabular-nums">{dragonWins}</div>
              <div className="text-[11px] font-semibold text-blue-400">
                {dragonPct}% {isUr ? 'تناسب' : 'Ratio'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-center">
              <div className="text-xs font-bold text-emerald-300">{isUr ? 'برابر (Tie)' : 'Tie'}</div>
              <div className="text-xl font-black text-emerald-100 tabular-nums">{tieWins}</div>
              <div className="text-[11px] font-semibold text-emerald-400">
                {tiePct}% {isUr ? 'تناسب' : 'Ratio'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-center">
              <div className="text-xs font-bold text-amber-300">{isUr ? 'ٹائیگر' : 'Tiger'}</div>
              <div className="text-xl font-black text-amber-100 tabular-nums">{tigerWins}</div>
              <div className="text-[11px] font-semibold text-amber-400">
                {tigerPct}% {isUr ? 'تناسب' : 'Ratio'}
              </div>
            </div>
          </div>

          {/* Bead Plate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
                {isUr ? 'بِیڈ پلیٹ میٹرکس' : 'Bead Plate Matrix'}
              </span>
              <span className="text-[10px] text-slate-400">
                {isUr ? `کل ریکارڈز: ${history.length}` : `Total Recorded: ${history.length}`}
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 overflow-x-auto">
              <div className="grid grid-rows-6 grid-flow-col gap-1.5 w-max">
                {beadSlots.map((slot, index) => {
                  if (!slot) {
                    return (
                      <div
                        key={index}
                        className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800/80"
                      />
                    );
                  }

                  const isTiger = slot.winner === 'TIGER';
                  const isDragon = slot.winner === 'DRAGON';

                  return (
                    <div
                      key={index}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-md border ${
                        isTiger
                          ? 'bg-gradient-to-tr from-amber-600 to-yellow-500 text-slate-950 border-amber-300'
                          : isDragon
                          ? 'bg-gradient-to-tr from-blue-600 to-sky-400 text-white border-sky-300'
                          : 'bg-gradient-to-tr from-emerald-600 to-green-400 text-slate-950 border-emerald-300'
                      }`}
                      title={`Round #${slot.roundNumber}: ${slot.winner} (D: ${slot.dragonCard.rank}${slot.dragonCard.suit} vs T: ${slot.tigerCard.rank}${slot.tigerCard.suit})`}
                    >
                      {isTiger ? 'T' : isDragon ? 'D' : 'Tie'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Showdown Card Record */}
          <div>
            <div className="text-xs font-bold text-slate-300 mb-2">
              {isUr ? 'آخری 5 راؤنڈز کی تفصیلات:' : 'Recent 5 Rounds Details:'}
            </div>
            <div className="space-y-1.5">
              {history.slice(0, 5).map((rec) => (
                <div
                  key={rec.id}
                  className="px-3 py-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px]">#{rec.roundNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded font-black text-[11px] ${
                        rec.winner === 'TIGER'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : rec.winner === 'DRAGON'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {rec.winner} WIN
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono font-bold">
                    <span className={rec.dragonCard.color === 'red' ? 'text-red-400' : 'text-slate-200'}>
                      Dragon: {rec.dragonCard.rank}{rec.dragonCard.suit} ({rec.dragonCard.value})
                    </span>
                    <span className="text-slate-500">vs</span>
                    <span className={rec.tigerCard.color === 'red' ? 'text-red-400' : 'text-slate-200'}>
                      Tiger: {rec.tigerCard.rank}{rec.tigerCard.suit} ({rec.tigerCard.value})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
