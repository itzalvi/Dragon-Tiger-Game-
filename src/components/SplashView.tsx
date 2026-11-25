import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { useGameStore } from '../hooks/useGameStore';

interface SplashViewProps {
  onLoaded: () => void;
}

const LOADING_CHIME_MILESTONES = [12, 28, 45, 62, 78, 92];

export const SplashView: React.FC<SplashViewProps> = ({ onLoaded }) => {
  const { language } = useGameStore();
  const isUr = language === 'ur';

  const [progress, setProgress] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.getMuted());

  const hasPlayedStartSoundRef = useRef<boolean>(false);
  const lastMilestoneIdxRef = useRef<number>(-1);
  const hasCompletedSoundRef = useRef<boolean>(false);

  // Attempt short pleasant loading sound immediately on open, or on first tap if browser suspends autoplay
  useEffect(() => {
    let active = true;

    const tryPlayIntro = async () => {
      if (!active || hasPlayedStartSoundRef.current || soundManager.getMuted()) return;
      const played = await soundManager.playLoadingIntroSafe();
      if (played && active) {
        hasPlayedStartSoundRef.current = true;
      }
    };

    tryPlayIntro();

    const handleUnlock = () => {
      tryPlayIntro();
    };

    window.addEventListener('pointerdown', handleUnlock, { once: true });
    window.addEventListener('touchstart', handleUnlock, { once: true });
    window.addEventListener('keydown', handleUnlock, { once: true });

    return () => {
      active = false;
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('touchstart', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
    };
  }, []);

  // Loading progress ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }

        const step =
          prev < 30
            ? Math.floor(Math.random() * 4) + 2
            : prev < 75
            ? Math.floor(Math.random() * 5) + 3
            : prev < 95
            ? Math.floor(Math.random() * 3) + 2
            : 1;

        return Math.min(100, prev + step);
      });
    }, 45);

    return () => clearInterval(interval);
  }, []);

  // Play soft crystal progress sparkles and completion chime at 100%
  useEffect(() => {
    LOADING_CHIME_MILESTONES.forEach((milestone, idx) => {
      if (progress >= milestone && idx > lastMilestoneIdxRef.current) {
        lastMilestoneIdxRef.current = idx;
        soundManager.playLoadingShimmerStep(idx);
      }
    });

    if (progress >= 100 && !hasCompletedSoundRef.current) {
      hasCompletedSoundRef.current = true;
      soundManager.playLoadingComplete();
      const doneTimer = setTimeout(onLoaded, 420);
      return () => clearTimeout(doneTimer);
    }
  }, [progress, onLoaded]);

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundManager.playLoadingIntroSafe().then((played) => {
        if (played) hasPlayedStartSoundRef.current = true;
      });
    }
  };

  const statusText = isUr
    ? progress < 25
      ? `گیم کے اثاثے لوڈ ہو رہے ہیں... ${progress}%`
      : progress < 55
      ? `ٹائیگر اور ڈریگن ٹیبل کنیکٹ ہو رہی ہے... ${progress}%`
      : progress < 85
      ? `ہائی رولر سرور کنیکٹ ہو رہا ہے... ${progress}%`
      : progress < 100
      ? `ٹیبل فائنل ہو رہی ہے... ${progress}%`
      : '100% مکمل! گیم شروع ہو رہی ہے...'
    : progress < 25
    ? `Loading game assets... ${progress}%`
    : progress < 55
    ? `Connecting Dragon & Tiger arena... ${progress}%`
    : progress < 85
    ? `Syncing live game server... ${progress}%`
    : progress < 100
    ? `Finalizing table... ${progress}%`
    : '100% Ready! Launching Game...';

  return (
    <div
      className="relative w-screen h-screen bg-[#070d1a] overflow-hidden flex items-center justify-center select-none font-sans"
      onClick={() => {
        if (!hasPlayedStartSoundRef.current && !isMuted) {
          soundManager.playLoadingIntroSafe().then((played) => {
            if (played) hasPlayedStartSoundRef.current = true;
          });
        }
        if (progress > 30) {
          soundManager.startBGM();
          onLoaded();
        }
      }}
    >
      <div
        className="relative w-full h-full bg-cover bg-center bg-no-repeat overflow-hidden shadow-2xl flex flex-col justify-end items-center"
        style={{
          backgroundImage: `url('/assets/aistudio/1794167641199_f98905b1.jpg')`,
          backgroundColor: '#0a0d18',
        }}
      >
        {/* Top-Right Loading Sound Button */}
        <button
          type="button"
          onClick={handleToggleSound}
          className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/90 border border-amber-400/70 text-amber-200 text-xs font-bold shadow-lg backdrop-blur-md transition cursor-pointer"
          title={isUr ? (isMuted ? 'ساؤنڈ آن کریں' : 'ساؤنڈ بند کریں') : isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-amber-300 animate-pulse" />
          )}
          <span>{isUr ? (isMuted ? 'ساؤنڈ بند' : 'لوڈنگ ساؤنڈ') : isMuted ? 'Muted' : 'Loading Sound'}</span>
        </button>

        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

        <div className="relative z-20 w-[90%] max-w-[520px] mb-6 sm:mb-8 md:mb-10 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs sm:text-sm font-black text-amber-200 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] mb-1.5 px-2">
            <span className="flex items-center gap-1.5 tracking-wide">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{statusText}</span>
            </span>
            <span className="text-yellow-400 font-mono text-sm sm:text-base font-black tracking-wider bg-black/60 px-2 py-0.5 rounded-md border border-amber-500/40 shadow">
              {progress}%
            </span>
          </div>

          <div className="w-full h-5 sm:h-6 rounded-full bg-black/85 border-2 border-amber-400/90 shadow-[0_0_25px_rgba(245,158,11,0.65)] p-0.5 relative overflow-hidden backdrop-blur-md">
            <div
              style={{ width: `${progress}%` }}
              className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.95)] transition-all duration-75 ease-out relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
            </div>

            <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none opacity-20">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-white" />
              ))}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playLoadingComplete();
              soundManager.startBGM();
              onLoaded();
            }}
            className="mt-2 text-[10px] sm:text-xs text-amber-300/80 hover:text-yellow-200 hover:underline tracking-wider transition cursor-pointer"
          >
            {isUr ? 'براہ راست آگے بڑھنے کے لیے کلک کریں →' : 'Click here to skip →'}
          </button>
        </div>
      </div>
    </div>
  );
};
