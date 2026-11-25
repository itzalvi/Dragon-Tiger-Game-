import React from 'react';
import { X, Users, Crown } from 'lucide-react';
import { LiveBotPlayer, PLAYER_ROSTER } from '../utils/playerBots';
import { useGameStore } from '../hooks/useGameStore';

interface PlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  seatedPlayers: LiveBotPlayer[];
  userBalance: number;
}

export const PlayersModal: React.FC<PlayersModalProps> = ({
  isOpen,
  onClose,
  seatedPlayers,
  userBalance,
}) => {
  const { language, activeUser } = useGameStore();
  const isUr = language === 'ur';

  if (!isOpen) return null;

  const seatedNames = new Set(seatedPlayers.map((p) => p.name.trim().toLowerCase()));
  const activeUserName = activeUser.name.trim().toLowerCase();
  const waitingRoomPlayers = PLAYER_ROSTER.filter((p) => {
    const key = p.name.trim().toLowerCase();
    return !seatedNames.has(key) && key !== activeUserName;
  }).slice(0, 12);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md max-h-[92%] my-auto bg-gradient-to-b from-slate-900 via-[#181126] to-slate-950 border-2 border-amber-500/50 rounded-2xl shadow-2xl overflow-y-auto text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-extrabold uppercase text-amber-300 tracking-wide">
                {isUr
                  ? `آن لائن پلیئرز روم (${waitingRoomPlayers.length + seatedPlayers.length + 1} آن لائن)`
                  : `Online Players Room (${waitingRoomPlayers.length + seatedPlayers.length + 1} Online)`}
              </h3>
              <p className="text-[10px] text-amber-400/80">
                {isUr
                  ? 'ہر راؤنڈ پر لائیو یوزرز تبدیل ہوتے ہیں اور بیٹس لگاتے ہیں'
                  : 'Live players rotate every round and place bets in real time'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 max-h-[65vh] overflow-y-auto space-y-3">
          {/* Current User */}
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-400 mb-1 px-1">
              {isUr ? 'آپ کا پروفائل' : 'Your Profile'}
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-amber-400 bg-slate-800 flex items-center justify-center text-lg shadow">
                  {activeUser.avatar || '😎'}
                </div>
                <div>
                  <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    {activeUser.name} ({isUr ? 'آپ' : 'You'})
                    <span className="text-[9px] px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded font-black">
                      VIP {activeUser.vip}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ID: {activeUser.id} • Main Player
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-amber-300 tabular-nums">
                  Rs {userBalance.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {isUr ? 'کھیل رہے ہیں' : 'Active Playing'}
                </div>
              </div>
            </div>
          </div>

          {/* Current 4 Seated Table Players */}
          <div>
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-amber-300 mb-1 px-1">
              <span>
                {isUr
                  ? 'میز پر موجود 4 لائیو یوزرز (ہر راؤنڈ تبدیل ہوتے ہیں)'
                  : '4 Seated Table Players (Rotating Every Round)'}
              </span>
              <span className="text-emerald-400">{isUr ? 'بیٹنگ جاری' : 'Live Betting'}</span>
            </div>
            <div className="space-y-1.5">
              {seatedPlayers.map((p, idx) => {
                const totalRoundBet = p.roundBets.DRAGON + p.roundBets.TIGER + p.roundBets.TIE;
                return (
                  <div
                    key={p.id}
                    className="p-2 rounded-xl bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-9 h-9 rounded-full bg-slate-800 border-2 border-amber-400/70 flex items-center justify-center text-base shadow">
                        {p.avatarIcon}
                        {p.isVip && (
                          <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1.5 -right-1 drop-shadow" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1">
                          <span>{p.name}</span>
                          <span className="text-[8px] bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-1 py-0.2 rounded font-black">
                            VIP {p.vipLevel || idx + 4}
                          </span>
                        </div>
                        <div className="text-[10px] text-amber-400/80 flex items-center gap-1">
                          <span>{isUr ? `سیٹ #${idx + 1}` : `Seat #${idx + 1}`}</span>
                          {totalRoundBet > 0 && (
                            <span className="text-emerald-400 font-bold">
                              • {isUr ? 'لائیو بیٹ:' : 'Live Bet:'} Rs {totalRoundBet.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-yellow-300 font-mono tabular-nums">
                        Rs {(p.balance / 1000).toFixed(2)}K
                      </div>
                      <div className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        {isUr ? 'لائیو بیٹ' : 'Seated Bettor'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Other Online Players in Room */}
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 px-1">
              {isUr ? 'دیگر لائیو ممبران (ویٹنگ / دیکھ رہے ہیں)' : 'Other Online Members (Spectating)'}
            </div>
            <div className="space-y-1.5">
              {waitingRoomPlayers.map((p) => (
                <div
                  key={p.id}
                  className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm shadow">
                      {p.avatarIcon}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                        {p.name}
                        {p.isVip && (
                          <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 rounded font-bold">
                            VIP {p.vipLevel}
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        ID: {p.id.replace('p_', '')}786
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] font-bold text-slate-300 font-mono tabular-nums">
                      Rs {(p.baseBalance / 1000).toFixed(1)}K
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {isUr ? 'اگلے راؤنڈ کا انتظار' : 'Waiting for next round'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-4 py-2.5 bg-black/60 border-t border-amber-500/20 text-center text-[10px] text-amber-300/80 font-medium">
          {isUr
            ? '💡 آپ کے ساتھ ٹیبل پر لائیو یوزرز کھیلتے ہیں اور ہر راؤنڈ پر روٹیشن ہوتی ہے!'
            : 'Live table players rotate seats automatically at the start of every round.'}
        </div>
      </div>
    </div>
  );
};
