import React from 'react';
import { X, Sparkles, Cpu, Activity, CheckCircle, ShieldAlert } from 'lucide-react';
import { BettingOption, HistoryRecord } from '../types/game';
import { useGameStore } from '../hooks/useGameStore';

interface HackModalProps {
  isOpen: boolean;
  onClose: () => void;
  prediction: {
    nextWinner: BettingOption;
    confidence: number;
    dragonWeight: number;
    tigerWeight: number;
    tieWeight: number;
    signal: string;
  };
  history: HistoryRecord[];
  onAutoBetToggle: () => void;
  autoBetEnabled: boolean;
}

export const HackModal: React.FC<HackModalProps> = ({
  isOpen,
  onClose,
  prediction,
  history,
  onAutoBetToggle,
  autoBetEnabled,
}) => {
  const { language } = useGameStore();
  const isUr = language === 'ur';
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md max-h-[95%] my-auto bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-2 border-amber-400 rounded-2xl shadow-2xl overflow-y-auto text-white gold-border-glow">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-600 via-purple-700 to-indigo-900 border-b border-amber-400/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-200 p-0.5 shadow-md flex items-center justify-center">
              <span className="text-xs font-black text-slate-950">MOD</span>
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wider text-amber-200 uppercase flex items-center gap-1.5">
                3 Patti Pearl Hack v4.8 <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              </h3>
              <p className="text-[10px] text-amber-100/80 font-medium">Tiger Dragon Live Pattern Predictor</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-950/60 hover:bg-slate-900 text-slate-300 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          
          {/* Main Prediction Box */}
          <div className="relative p-4 rounded-xl bg-gradient-to-br from-slate-900/90 to-indigo-950/90 border border-amber-400/50 shadow-inner text-center overflow-hidden">
            <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-600">
              <Activity className="w-3 h-3 animate-pulse" />
              <span>LIVE SYNC</span>
            </div>

            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1">
              Next Round Forecast
            </div>

            <div className="py-2">
              <span
                className={`text-3xl font-black tracking-wider uppercase drop-shadow-md ${
                  prediction.nextWinner === 'TIGER'
                    ? 'text-orange-400'
                    : prediction.nextWinner === 'DRAGON'
                    ? 'text-sky-400'
                    : 'text-emerald-400'
                }`}
              >
                {isUr
                  ? `${prediction.nextWinner} (${prediction.nextWinner === 'TIGER' ? 'ٹائیگر' : prediction.nextWinner === 'DRAGON' ? 'ڈریگن' : 'برابر'})`
                  : prediction.nextWinner}
              </span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black text-xs">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Accuracy: {prediction.confidence.toFixed(1)}% High Probability</span>
            </div>

            {/* Probability Bars */}
            <div className="mt-4 grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
              <div className="bg-sky-950/60 p-2 rounded-lg border border-sky-600/40">
                <div className="text-[10px] font-bold text-sky-300">{isUr ? 'ڈریگن' : 'Dragon'}</div>
                <div className="text-sm font-black text-sky-200 tabular-nums">
                  {prediction.dragonWeight}%
                </div>
              </div>

              <div className="bg-emerald-950/60 p-2 rounded-lg border border-emerald-600/40">
                <div className="text-[10px] font-bold text-emerald-300">{isUr ? 'برابر' : 'Tie'}</div>
                <div className="text-sm font-black text-emerald-200 tabular-nums">
                  {prediction.tieWeight}%
                </div>
              </div>

              <div className="bg-amber-950/60 p-2 rounded-lg border border-amber-600/40">
                <div className="text-[10px] font-bold text-amber-300">{isUr ? 'ٹائیگر' : 'Tiger'}</div>
                <div className="text-sm font-black text-amber-200 tabular-nums">
                  {prediction.tigerWeight}%
                </div>
              </div>
            </div>
          </div>

          {/* AI Signal Analysis */}
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-semibold text-amber-300">Shoe Matrix Strategy:</span>
              <span className="font-mono text-emerald-400">{prediction.signal}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Card Shoe Rounds Analyzed:</span>
              <span className="font-bold text-white tabular-nums">{history.length} Rounds</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Ping / Gateway Latency:</span>
              <span className="font-mono text-sky-400">9ms (Ultra Fast)</span>
            </div>
          </div>

          {/* Auto Bet Option */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-amber-500/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Auto-Follow Hack Signal</div>
                <div className="text-[10px] text-slate-400">Automatically places chip on predicted winner</div>
              </div>
            </div>

            <button
              onClick={onAutoBetToggle}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                autoBetEnabled
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {autoBetEnabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 justify-center">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Anti-Ban Engine: Safe & Anonymous Session Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
