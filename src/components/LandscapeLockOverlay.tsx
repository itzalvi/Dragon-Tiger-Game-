import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw, Maximize2 } from 'lucide-react';

export const LandscapeLockOverlay: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false
  );

  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);

      if (!portrait && window.screen?.orientation && 'lock' in window.screen.orientation) {
        try {
          (window.screen.orientation as { lock?: (o: string) => Promise<void> })
            .lock?.('landscape')
            .catch(() => {});
        } catch {
          // ignore
        }
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleRequestLandscape = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
      if (window.screen?.orientation && 'lock' in window.screen.orientation) {
        await (window.screen.orientation as { lock?: (o: string) => Promise<void> })
          .lock?.('landscape')
          .catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#070d1a] flex flex-col items-center justify-center p-6 text-center select-none font-sans overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/15 via-transparent to-emerald-600/15 pointer-events-none" />

      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-amber-400/80 flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.5)]">
          <Smartphone className="w-12 h-12 text-amber-300 animate-[spin_3s_ease-in-out_infinite]" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg border border-white">
          <RotateCw className="w-5 h-5 animate-spin" />
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-amber-300 mb-2 drop-shadow">
        Rotate Phone to Landscape
      </h2>

      <p className="text-sm font-bold text-slate-200 max-w-sm mb-6 leading-relaxed">
        Dragon Tiger is a landscape-only game. Please rotate your device horizontally to play.
      </p>

      <button
        type="button"
        onClick={handleRequestLandscape}
        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.6)] hover:brightness-110 active:scale-95 transition cursor-pointer"
      >
        <Maximize2 className="w-4 h-4" />
        <span>Enter Fullscreen Landscape</span>
      </button>

      <div className="mt-8 text-[11px] text-slate-400">
        Tip: Turn on <strong>Auto-Rotate</strong> in your phone settings for automatic landscape mode.
      </div>
    </div>
  );
};
