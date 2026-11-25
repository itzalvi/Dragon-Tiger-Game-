import React, { useEffect } from 'react';
import { AlertTriangle, ArrowDownCircle, X, Sparkles } from 'lucide-react';
import { useGameStore } from '../hooks/useGameStore';

interface LowBalanceToastProps {
  show: boolean;
  balance: number;
  onDepositClick: () => void;
  onClose: () => void;
}

export const LowBalanceToast: React.FC<LowBalanceToastProps> = ({
  show,
  balance,
  onDepositClick,
  onClose,
}) => {
  const { language } = useGameStore();
  const isUr = language === 'ur';

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => {
      onClose();
    }, 8000);
    return () => clearTimeout(timer);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-2 sm:top-3 left-1/2 -translate-x-1/2 z-[70] w-[94%] max-w-lg animate-bounce duration-500 font-sans select-none pointer-events-auto">
      <div className="relative p-2 sm:p-2.5 rounded-2xl bg-gradient-to-r from-red-950 via-slate-950 to-amber-950 border-2 border-red-500/90 shadow-[0_0_35px_rgba(239,68,68,0.55)] backdrop-blur-md text-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-600/30 border border-red-400 flex items-center justify-center text-red-400 shadow-inner shrink-0">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 animate-pulse stroke-[2.5]" />
          </div>

          <div className="flex flex-col leading-tight min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-yellow-300 drop-shadow">
                {isUr ? 'کم بیلنس کا الرٹ!' : 'Low Balance Alert!'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-600 font-mono font-black text-white shrink-0">
                Rs {balance.toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-amber-100 font-medium truncate sm:whitespace-normal">
              {isUr
                ? 'آپ کا بیلنس 500 روپے سے کم ہے۔ گیم کھیلنے کے لیے فنڈز ڈپازٹ کریں۔'
                : 'Your balance is below Rs 500. Deposit funds to keep playing.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onDepositClick}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 text-white font-black text-[10px] sm:text-xs tracking-wide shadow-lg shadow-emerald-600/30 hover:brightness-110 active:scale-95 transition flex items-center gap-1 cursor-pointer"
          >
            <ArrowDownCircle className="w-3.5 h-3.5 text-white" />
            <span>{isUr ? 'ڈپازٹ کریں' : 'Deposit'}</span>
            <Sparkles className="w-3 h-3 text-yellow-200" />
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            aria-label="Close Alert"
            title={isUr ? 'بند کریں' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
