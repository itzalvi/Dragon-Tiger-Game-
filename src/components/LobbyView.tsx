import React, { useState } from 'react';
import { 
  Share2, ArrowDownCircle, ArrowUpCircle, Flame,
  Sparkles, Play, Copy, Check, X, Download, LogOut, Settings, MessageCircle
} from 'lucide-react';
import { UserProfile, Transaction, TransactionStatus } from '../types/game';
import { soundManager } from '../utils/audio';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useGameStore } from '../hooks/useGameStore';
import { gameStore } from '../utils/gameStore';
import { TransactionModal } from './TransactionModal';
import { ApkInstallModal } from './ApkInstallModal';
import { LowBalanceToast } from './LowBalanceToast';
import { SettingsModal } from './SettingsModal';
import { SupportChatModal } from './SupportChatModal';

interface LobbyViewProps {
  user: UserProfile;
  onEnterTigerDragon: () => void;
  onOpenAdmin: () => void;
  onSignOut?: () => void;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  transactions: Transaction[];
  onDeposit: (amount: number, method: 'EasyPaisa' | 'JazzCash' | 'AllBankQR', txId: string) => TransactionStatus | void;
  onWithdraw: (amount: number, method: 'EasyPaisa' | 'JazzCash', accountTitle: string, accountNumber: string) => boolean | { ok: boolean; status?: TransactionStatus };
  pendingCount?: number;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  user,
  onEnterTigerDragon,
  onOpenAdmin,
  onSignOut,
  transactions,
  onDeposit,
  onWithdraw,
}) => {
  const { language } = useGameStore();
  const isUr = language === 'ur';
  const winStreak = gameStore.getStrategyState().winStreak;
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [walletInitialTab, setWalletInitialTab] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('install') === '1';
    }
    return false;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.getMuted());

  // Secret 5-click Admin Panel trigger on the top-left logo
  const logoClicksRef = React.useRef<{ count: number; timer: ReturnType<typeof setTimeout> | null }>({
    count: 0,
    timer: null,
  });

  const handleSecretLogoClick = () => {
    if (logoClicksRef.current.timer) {
      clearTimeout(logoClicksRef.current.timer);
    }
    const nextCount = logoClicksRef.current.count + 1;
    if (nextCount >= 5) {
      logoClicksRef.current.count = 0;
      logoClicksRef.current.timer = null;
      onOpenAdmin();
      return;
    }
    logoClicksRef.current.count = nextCount;
    logoClicksRef.current.timer = setTimeout(() => {
      logoClicksRef.current.count = 0;
      logoClicksRef.current.timer = null;
    }, 2500);
  };

  // Low-balance notification toast (< 500 Rs)
  const [showLowBalanceToast, setShowLowBalanceToast] = useState<boolean>(false);
  const prevBalanceRef = React.useRef<number>(user.balance);

  React.useEffect(() => {
    const prev = prevBalanceRef.current;
    if (prev >= 500 && user.balance < 500) {
      setShowLowBalanceToast(true);
    } else if (user.balance >= 500) {
      setShowLowBalanceToast(false);
    }
    prevBalanceRef.current = user.balance;
  }, [user.balance]);

  React.useEffect(() => {
    soundManager.startBGM();
  }, []);

  const handleOpenDeposit = () => {
    soundManager.playCashSound();
    setWalletInitialTab('DEPOSIT');
    setWalletModalOpen(true);
  };

  const handleOpenWithdraw = () => {
    soundManager.playCashSound();
    setWalletInitialTab('WITHDRAW');
    setWalletModalOpen(true);
  };

  const handleLaunchGame = () => {
    soundManager.playCashSound();
    onEnterTigerDragon();
  };

  const handleToggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleApkInstallClick = async () => {
    soundManager.playCashSound();
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setIsApkModalOpen(true);
  };

  const referralUrl = `${window.location.origin}/?ref=${user.id}`;

  const handleShareGame = () => {
    soundManager.playCashSound();
    const shareText = isUr
      ? `🔥 Dragon Tiger Game (Alvi Games)! نیا اکاؤنٹ بنانے پر Rs 20 مفت اور دوستوں کے شیئر پر 7% بونس! میرا ریفرل کوڈ: ${user.id}۔ ابھی جوائن کریں: ${referralUrl}`
      : `🔥 Play Dragon Tiger Game (Alvi Games)! Get Rs 20 free on Sign Up + 7% Referral Bonus on invites! My Referral Code: ${user.id}. Join now: ${referralUrl}`;

    if (navigator.share) {
      navigator.share({
        title: 'Dragon Tiger Game - Alvi Games',
        text: shareText,
        url: referralUrl,
      }).catch(() => {
        setIsShareModalOpen(true);
      });
    } else {
      setIsShareModalOpen(true);
    }
  };

  const handleCopyShareLink = () => {
    const shareText = isUr
      ? `🔥 Dragon Tiger Game (Alvi Games)! نیا اکاؤنٹ بنانے پر Rs 20 مفت اور شیئر کرنے پر 7% بونس! جوائن کریں: ${referralUrl}`
      : `🔥 Play Dragon Tiger Game (Alvi Games)! Get Rs 20 free on Sign Up + 7% Referral Bonus! Join now: ${referralUrl}`;
    navigator.clipboard.writeText(shareText);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  return (
    <div className="relative w-screen h-screen bg-[#060c18] text-white flex items-center justify-center overflow-hidden select-none font-sans">
      
      {/* 
        RESPONSIVE LOBBY CONTAINER:
        Scales cleanly on mobile landscape, tablets, desktops, and portrait screens without clipping.
      */}
      <div 
        className="relative w-full h-full max-w-6xl mx-auto flex flex-col justify-between p-2.5 sm:p-4 overflow-hidden shadow-2xl"
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% 35%, #0d2249 0%, #061226 65%, #020712 100%)`,
        }}
      >
        {/* Ambient subtle glow lights */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* ================= TOP BAR (LANDSCAPE COMPACT) ================= */}
        <header className="relative z-20 w-full flex items-center justify-between px-2 py-1 bg-black/60 border border-amber-500/30 rounded-2xl backdrop-blur-md shrink-0 shadow-lg">
          
          {/* Left: Dragon Tiger Logo + Brand Name + Secret 5-Click Admin Trigger */}
          <div className="flex items-center gap-2.5">
            <div
              onClick={handleSecretLogoClick}
              className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-amber-400 bg-slate-900 overflow-hidden shrink-0 shadow-md active:scale-95 transition-transform"
            >
              <img
                src="/assets/aistudio/IMG-20261113-WA5056_bdc6a48b.jpg"
                alt="Dragon Tiger"
                draggable={false}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col leading-tight">
              <span className="text-xs sm:text-sm font-black tracking-wide text-amber-300">
                Dragon Tiger
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-slate-300/90">
                Created by Alvi Games
              </span>
            </div>
          </div>

          {/* Right: APK Button, Balance Pill & Sound Toggle */}
          <div className="flex items-center gap-2">

            {/* APK / Add to Home Screen Install Button */}
            <button
              onClick={handleApkInstallClick}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-green-500 border border-emerald-300 text-white font-black text-[11px] sm:text-xs shadow hover:brightness-110 active:scale-95 transition cursor-pointer"
              title={isUr ? 'ہوم اسکرین پر ایڈ کریں یا ایپ انسٹال کریں' : 'Add to Home Screen / Install App'}
            >
              <img
                src="/pwa-192x192.png"
                alt="App Icon"
                className="w-4 h-4 rounded-full border border-yellow-300 object-cover shrink-0"
              />
              <Download className="w-3 h-3 text-white stroke-[2.5] hidden sm:block" />
              <span className="hidden sm:inline">
                {isUr
                  ? isInstalled
                    ? 'ایپ انسٹال ہے'
                    : isInstallable
                    ? 'انسٹال کریں'
                    : 'اے پی کے'
                  : isInstalled
                  ? 'Installed'
                  : isInstallable
                  ? 'Install App'
                  : 'Install APK'}
              </span>
              <span className="text-[8px] bg-black/50 px-1 rounded text-yellow-300 font-mono">APK</span>
            </button>

            {/* User Profile Pill with Fire Streak Aura */}
            <div
              onClick={() => setIsSettingsOpen(true)}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full border transition cursor-pointer ${
                winStreak >= 3
                  ? 'bg-gradient-to-r from-orange-950/90 via-red-900/90 to-amber-950/90 border-orange-400 shadow-[0_0_18px_rgba(249,115,22,0.8)] animate-pulse'
                  : 'bg-slate-900/85 border-slate-700 hover:border-amber-400/70'
              }`}
              title={`Player Profile: ${user.name}${winStreak > 0 ? ` • ${winStreak} Win Streak` : ''}`}
            >
              <span className="text-xs leading-none">{user.avatar || '😎'}</span>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-100 max-w-[54px] sm:max-w-[76px] truncate">
                {user.name}
              </span>
              {winStreak > 0 && (
                <span
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                    winStreak >= 3
                      ? 'bg-gradient-to-r from-orange-500 to-yellow-400 text-slate-950 shadow-[0_0_10px_rgba(251,146,60,0.9)]'
                      : 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  }`}
                >
                  <Flame className={`w-2.5 h-2.5 ${winStreak >= 3 ? 'fill-slate-950 text-slate-950' : 'text-orange-400'}`} />
                  <span>{winStreak}</span>
                </span>
              )}
            </div>

            {/* Balance Pill */}
            <div 
              onClick={handleOpenDeposit}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-400/80 shadow cursor-pointer hover:scale-102 hover:border-amber-300 transition"
              title={isUr ? 'بیلنس جمع کریں (Deposit)' : 'Deposit Balance'}
            >
              <span className="text-xs sm:text-sm">🪙</span>
              <span className="text-xs sm:text-sm font-black text-amber-300 font-mono tabular-nums">
                Rs {user.balance.toLocaleString()}
              </span>
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center shadow">
                +
              </span>
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800/80 border border-slate-700 hover:border-amber-400 flex items-center justify-center text-slate-300 hover:text-amber-300 transition cursor-pointer"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Sign Out Button */}
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800/80 border border-slate-700 hover:border-rose-400 flex items-center justify-center text-slate-300 hover:text-rose-400 transition cursor-pointer"
                title={isUr ? 'سائن آؤٹ (Sign Out)' : 'Sign Out'}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </header>

        {/* ================= MAIN STAGE: THE 3 ESSENTIAL OPTIONS (LANDSCAPE ALIGNMENT) ================= */}
        <main className="relative z-10 flex-1 flex flex-nowrap items-center justify-around px-2 sm:px-6 w-full max-w-5xl mx-auto my-auto gap-3 sm:gap-6">
          
          {/* OPTION 2: DEPOSIT BUTTON CARD (LEFT SIDE) */}
          <div className="flex-1 max-w-[210px] flex flex-col items-center">
            <button
              onClick={handleOpenDeposit}
              className="group relative w-full p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-900 border-2 border-emerald-300 text-white font-black shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95 transition flex flex-col items-center justify-center gap-1.5 cursor-pointer overflow-hidden"
            >
              {/* Shimmer light */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/20 border border-white/40 flex items-center justify-center shadow">
                <ArrowDownCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white stroke-[2.5]" />
              </div>

              <div className="text-center">
                <span className="block text-sm sm:text-lg font-black tracking-wide drop-shadow">
                  {isUr ? 'آل بینک ڈپازٹ' : 'ALL BANK DEPOSIT'}
                </span>
                <span className="text-[9px] sm:text-[10px] text-emerald-200 uppercase font-black tracking-wider">
                  {isUr ? 'DEPOSIT (All Bank QR)' : 'Instant QR Top-Up'}
                </span>
              </div>

              <div className="px-2 py-0.5 rounded-full bg-black/40 border border-emerald-400/40 text-[9px] text-emerald-200 font-bold flex items-center gap-1">
                <span>{isUr ? '⚡ ہر بینک سے ڈپازٹ' : '⚡ Instant Bank QR'}</span>
              </div>
            </button>
          </div>

          {/* OPTION 1: THE GLORIOUS TIGER DRAGON EMBLEM LOGO (CENTERPIECE - CLICK TO PLAY) */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <button
              onClick={handleLaunchGame}
              className="group relative cursor-pointer focus:outline-none transition-transform duration-300 hover:scale-105 active:scale-95"
              title={isUr ? 'ٹائیگر ڈریگن گیم کھیلیں' : 'Play Dragon Tiger Game'}
            >
              {/* Outer Radiant Gold Glow Rings */}
              <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-amber-500/40 via-yellow-400/50 to-amber-500/40 blur-xl opacity-80 group-hover:opacity-100 transition-opacity animate-pulse" />
              
              {/* Circular Medallion Frame */}
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-full p-1.5 bg-gradient-to-tr from-yellow-600 via-amber-300 to-yellow-600 shadow-[0_0_40px_rgba(245,158,11,0.65)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-black border-2 border-amber-400/90 relative">
                  {/* Logo Image */}
                  <img
                    src="/assets/game/tiger_dragon_logo.jpg"
                    alt="Tiger Dragon Game Logo"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />

                  {/* Shimmer sweep animation overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>

              {/* Glowing PLAY GAME Badge underneath the emblem */}
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 sm:px-5 py-1 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xl border-2 border-white flex items-center gap-1.5 group-hover:brightness-110">
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>{isUr ? 'کھیلیں • PLAY NOW' : 'PLAY NOW'}</span>
              </div>
            </button>

            {/* Subtitle Label */}
            <div className="mt-4 text-center">
              <h1 className="text-xs sm:text-sm md:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 drop-shadow">
                {isUr ? 'ٹائیگر ڈریگن گیم (Dragon Tiger)' : 'Dragon Tiger Game'}
              </h1>
              <p className="text-[9px] sm:text-[10px] text-amber-300/80 font-bold">
                {isUr ? 'گیم کھولنے کے لیے اوپر لوگو پر کلک کریں' : 'Tap the emblem above to enter the table'}
              </p>
            </div>
          </div>

          {/* OPTION 3: WITHDRAW BUTTON CARD (RIGHT SIDE) */}
          <div className="flex-1 max-w-[210px] flex flex-col items-center">
            <button
              onClick={handleOpenWithdraw}
              className="group relative w-full p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-red-800 border-2 border-amber-300 text-white font-black shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95 transition flex flex-col items-center justify-center gap-1.5 cursor-pointer overflow-hidden"
            >
              {/* Shimmer light */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/20 border border-white/40 flex items-center justify-center shadow">
                <ArrowUpCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white stroke-[2.5]" />
              </div>

              <div className="text-center">
                <span className="block text-sm sm:text-lg font-black tracking-wide drop-shadow">
                  {isUr ? 'وڈرا کریں' : 'WITHDRAW'}
                </span>
                <span className="text-[9px] sm:text-[10px] text-amber-200 uppercase font-black tracking-wider">
                  {isUr ? 'WITHDRAW (فوری کیش آؤٹ)' : 'Fast Cash Out'}
                </span>
              </div>

              <div className="px-2 py-0.5 rounded-full bg-black/40 border border-amber-400/40 text-[9px] text-amber-200 font-bold flex items-center gap-1">
                <span>{isUr ? '⚡ 24/7 فوری ٹرانسفر' : '⚡ 24/7 Fast Transfer'}</span>
              </div>
            </button>
          </div>

        </main>

        {/* ================= BOTTOM CENTER: SHARE BUTTON ================= */}
        <footer className="relative z-20 w-full flex flex-col items-center justify-center pb-1 shrink-0">
          
          <button
            onClick={handleShareGame}
            className="group relative px-6 sm:px-8 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 border border-sky-300 text-white font-black text-xs sm:text-sm tracking-wide shadow-[0_0_20px_rgba(14,165,233,0.5)] hover:shadow-[0_0_28px_rgba(14,165,233,0.7)] hover:scale-105 active:scale-95 transition flex items-center gap-2 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-100 group-hover:rotate-12 transition-transform" />
            <span>{isUr ? 'گیم شیئر کریں • 7% بونس کمائیں (Share & Earn 7%)' : 'Share Game & Earn 7% Bonus'}</span>
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
          </button>

          <span className="text-[9px] sm:text-[10px] text-amber-300/90 mt-0.5 font-bold">
            {isUr
              ? 'شیئر لنک سے دوست کے جوائن اور ہر ڈپازٹ پر آپ کو 7% بونس ملے گا!'
              : 'Earn an automatic 7% bonus whenever a friend joins & deposits via your link!'}
          </span>

        </footer>

        {/* ================= FLOATING DRAGON TIGER LOGO CHATBOT BUTTON ================= */}
        <button
          onClick={() => {
            soundManager.playCashSound();
            setIsSupportOpen(true);
          }}
          className="absolute bottom-2.5 right-3 sm:bottom-4 sm:right-5 z-30 flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-gradient-to-r from-[#28130a] via-slate-900 to-[#28130a] border-2 border-amber-400/90 shadow-[0_0_20px_rgba(245,158,11,0.45)] hover:scale-105 active:scale-95 transition cursor-pointer"
          title={isUr ? 'ڈریگن ٹائیگر سپورٹ چیٹ بوٹ' : 'Dragon Tiger Support Chat Bot'}
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-yellow-300 shrink-0">
            <img
              src="/assets/aistudio/IMG-20261113-WA5056_bdc6a48b.jpg"
              alt="Dragon Tiger Support Bot"
              draggable={false}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950 animate-pulse" />
          </div>
          <div className="text-left leading-tight">
            <div className="text-[10px] sm:text-xs font-black text-amber-300 flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-emerald-400" />
              <span>{isUr ? 'ہیلپ بوٹ' : 'Help Bot'}</span>
            </div>
            <div className="text-[8px] sm:text-[9px] text-slate-300 font-bold">
              {isUr ? 'مسئلہ حل کریں' : '24/7 Support'}
            </div>
          </div>
        </button>

      </div>

      {/* ================= SHARE / INVITE MODAL ================= */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400/80 rounded-2xl p-5 shadow-2xl text-center text-white">
            
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-11 h-11 rounded-full bg-blue-500/20 border border-blue-400 text-blue-300 mx-auto flex items-center justify-center text-xl mb-2.5 shadow">
              <Share2 className="w-5 h-5 text-sky-400" />
            </div>

            <h3 className="text-sm sm:text-base font-black text-amber-300 mb-1">
              {isUr ? 'گیم شیئر کریں اور 7% بونس حاصل کریں' : 'Share Game & Earn 7% Bonus'}
            </h3>
            <p className="text-xs text-slate-300 mb-3">
              {isUr ? (
                <>آپ کے لنک سے دوست کے اکاؤنٹ بنانے اور ہر ڈپازٹ پر خودکار <span className="text-emerald-400 font-black">7% بونس</span> آپ کے اکاؤنٹ میں جمع ہوگا!</>
              ) : (
                <>Receive an automatic <span className="text-emerald-400 font-black">7% bonus</span> whenever your invited friends sign up and make a deposit!</>
              )}
            </p>

            {/* Invite Code & Link Box */}
            <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/40 mb-3 text-left space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-amber-200/80 font-bold uppercase">
                  {isUr ? 'آپ کا انوائٹ کوڈ (Code):' : 'Your Invite Code:'}
                </span>
                <span className="text-xs font-black text-yellow-300 font-mono tracking-widest">{user.id}</span>
              </div>
              <div className="text-[10px] font-mono text-sky-300 truncate bg-slate-950 px-2 py-1 rounded border border-slate-800">
                {referralUrl}
              </div>
            </div>

            {/* Copy Link Button */}
            <button
              onClick={handleCopyShareLink}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 shadow hover:brightness-110 active:scale-98 transition cursor-pointer mb-2"
            >
              {shareCopied ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>{isUr ? 'لنک کاپی ہو گیا ہے! (Copied)' : 'Link Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-950" />
                  <span>{isUr ? '7% بونس لنک کاپی کریں' : 'Copy 7% Bonus Share Link'}</span>
                </>
              )}
            </button>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                isUr
                  ? `🔥 Dragon Tiger Game (Alvi Games) کھیلیں! نیا اکاؤنٹ بنانے پر Rs 20 مفت اور دوستوں کے شیئر پر 7% بونس! میرا ریفرل کوڈ: ${user.id}۔ ابھی جوائن کریں: ${referralUrl}`
                  : `🔥 Play Dragon Tiger Game (Alvi Games)! Get Rs 20 free on Sign Up + 7% Referral Bonus! My Referral Code: ${user.id}. Join now: ${referralUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
            >
              <span>{isUr ? 'واٹس ایپ پر شیئر کریں (WhatsApp Share)' : 'Share on WhatsApp'}</span>
            </a>

          </div>
        </div>
      )}

      {/* ================= FAST EASYPAISA & JAZZCASH MODAL ================= */}
      <TransactionModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        balance={user.balance}
        onDeposit={onDeposit}
        onWithdraw={onWithdraw}
        transactions={transactions}
        initialTab={walletInitialTab}
      />

      {/* ================= SETTINGS & LANGUAGE MODAL ================= */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        isMuted={isMuted}
        onToggleSound={handleToggleSound}
        onSignOut={onSignOut}
      />

      {/* ================= ANDROID APK INSTALL MODAL ================= */}
      <ApkInstallModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* ================= DRAGON TIGER SUPPORT CHATBOT MODAL ================= */}
      <SupportChatModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        user={user}
        transactions={transactions}
        currentView="LOBBY"
        onOpenWallet={(tab) => {
          setWalletInitialTab(tab || 'DEPOSIT');
          setWalletModalOpen(true);
        }}
        onOpenApkInstall={() => handleApkInstallClick()}
      />

      {/* ================= LOW-BALANCE NOTIFICATION TOAST (< 500 Rs) ================= */}
      <LowBalanceToast
        show={showLowBalanceToast}
        balance={user.balance}
        onDepositClick={() => {
          setShowLowBalanceToast(false);
          handleOpenDeposit();
        }}
        onClose={() => setShowLowBalanceToast(false)}
      />

    </div>
  );
};
