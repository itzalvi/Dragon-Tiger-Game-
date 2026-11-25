import React from 'react';
import {
  Flame,
  Globe,
  LogOut,
  Settings,
  User,
  Volume2,
  VolumeX,
  X,
  Check,
} from 'lucide-react';
import { UserProfile } from '../types/game';
import { gameStore } from '../utils/gameStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile;
  isMuted?: boolean;
  onToggleSound?: () => void;
  onSignOut?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  isMuted,
  onToggleSound,
  onSignOut,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none font-sans overflow-y-auto">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto my-auto bg-gradient-to-b from-slate-900 via-[#10182b] to-slate-950 border-2 border-amber-400/80 rounded-2xl shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center">
              <Settings className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-amber-300 tracking-wide">
                Game Settings
              </h3>
              <p className="text-[10px] text-slate-400">
                Language, sound & account preferences
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Language (English Only) */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs sm:text-sm font-black text-white">
                  Game Language
                </div>
                <div className="text-[10px] text-slate-400">
                  Official game language
                </div>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>English</span>
            </div>
          </div>

          {/* Sound Toggle */}
          {onToggleSound && (
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
                <div>
                  <div className="text-xs font-bold text-white">
                    Music & Sound Effects
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isMuted ? 'Audio is muted' : 'Audio is enabled'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleSound}
                className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition ${
                  isMuted
                    ? 'bg-rose-600/25 border border-rose-500/60 text-rose-300'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {isMuted ? 'OFF' : 'ON'}
              </button>
            </div>
          )}

          {/* Account Summary & Sign Out */}
          {user && (() => {
            const winStreak = gameStore.getStrategyState().winStreak;
            return (
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  winStreak >= 3
                    ? 'bg-gradient-to-r from-orange-950/60 via-slate-900 to-red-950/60 border-orange-400/80 shadow-[0_0_16px_rgba(249,115,22,0.45)]'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      winStreak >= 3
                        ? 'bg-orange-500/20 border border-orange-400'
                        : 'bg-slate-800 border border-amber-400/50'
                    }`}
                  >
                    {winStreak >= 3 ? (
                      <Flame className="w-4 h-4 text-orange-400 fill-orange-500 animate-pulse" />
                    ) : (
                      <User className="w-4 h-4 text-amber-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="truncate">{user.name}</span>
                      {winStreak > 0 && (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                            winStreak >= 3
                              ? 'bg-gradient-to-r from-orange-500 to-yellow-400 text-slate-950'
                              : 'bg-orange-500/20 text-orange-300 border border-orange-400/40'
                          }`}
                        >
                          🔥 {winStreak}x
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      ID: {user.id} · Rs {user.balance.toLocaleString()}
                    </div>
                  </div>
                </div>

              {onSignOut && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSignOut();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 border border-rose-500/50 text-rose-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
