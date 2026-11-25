import React, { useRef, useState } from 'react';
import {
  Gift,
  Lock,
  LogIn,
  Phone,
  Sparkles,
  User,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { gameStore } from '../utils/gameStore';
import { useGameStore } from '../hooks/useGameStore';
import { soundManager } from '../utils/audio';

interface AuthViewProps {
  initialRefCode?: string;
  onAuthenticated: () => void;
  onSecretAdminOpen?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialRefCode = '',
  onAuthenticated,
  onSecretAdminOpen,
}) => {
  const { language } = useGameStore();
  const isUr = language === 'ur';

  const [mode, setMode] = useState<'SIGNUP' | 'SIGNIN'>('SIGNUP');

  // Sign In fields
  const [loginId, setLoginId] = useState<string>('');
  const [loginPass, setLoginPass] = useState<string>('');

  // Create Account fields
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [referralCode, setReferralCode] = useState<string>(initialRefCode);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [welcomeBanner, setWelcomeBanner] = useState<string | null>(null);

  // Secret 5-click trigger on the Dragon Tiger emblem
  const logoClicksRef = useRef<{ count: number; timer: ReturnType<typeof setTimeout> | null }>({
    count: 0,
    timer: null,
  });

  const handleSecretLogoClick = () => {
    if (!onSecretAdminOpen) return;
    if (logoClicksRef.current.timer) {
      clearTimeout(logoClicksRef.current.timer);
    }
    const nextCount = logoClicksRef.current.count + 1;
    if (nextCount >= 5) {
      logoClicksRef.current.count = 0;
      logoClicksRef.current.timer = null;
      onSecretAdminOpen();
      return;
    }
    logoClicksRef.current.count = nextCount;
    logoClicksRef.current.timer = setTimeout(() => {
      logoClicksRef.current.count = 0;
      logoClicksRef.current.timer = null;
    }, 2500);
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = gameStore.signIn(loginId, loginPass);
    if (!res.ok) {
      setErrorMsg(res.error || (isUr ? 'لاگ ان ناکام رہا۔' : 'Sign in failed.'));
      return;
    }
    soundManager.playCashSound();
    onAuthenticated();
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = gameStore.registerUser({
      name: fullName,
      phone,
      password,
      referredBy: referralCode,
    });
    if (!res.ok) {
      setErrorMsg(res.error || (isUr ? 'اکاؤنٹ نہیں بن سکا۔' : 'Could not create account.'));
      return;
    }
    soundManager.playCashSound();
    setWelcomeBanner(
      isUr
        ? '🎉 مبارک ہو! نیا اکاؤنٹ بن گیا اور آپ کو Rs 20 ویلکم بونس مل گیا!'
        : '🎉 Account created! You received Rs 20 Welcome Bonus!'
    );
    setTimeout(() => {
      onAuthenticated();
    }, 900);
  };

  return (
    <div
      className="relative w-screen h-screen bg-[#060c18] text-white overflow-y-auto select-none font-sans"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% 25%, #112a57 0%, #061226 65%, #020712 100%)',
      }}
    >
      <div className="min-h-full w-full flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-md bg-slate-950/90 border-2 border-amber-400/70 rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.3)] backdrop-blur-md">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            onClick={handleSecretLogoClick}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-amber-400 overflow-hidden bg-slate-900 shrink-0 shadow-lg active:scale-95 transition-transform"
          >
            <img
              src="/assets/aistudio/IMG-20261113-WA5056_bdc6a48b.jpg"
              alt="Dragon Tiger"
              draggable={false}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-amber-300 tracking-wide leading-tight">
              Dragon Tiger
            </h1>
            <p className="text-[11px] text-slate-400 font-semibold">
              Created by Alvi Games
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 text-[10px] font-black">
              <Gift className="w-3.5 h-3.5" />
              <span>+Rs 20</span>
            </div>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => {
              setMode('SIGNUP');
              setErrorMsg(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'SIGNUP'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{isUr ? 'نیا اکاؤنٹ بنائیں' : 'Create Account'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('SIGNIN');
              setErrorMsg(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'SIGNIN'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>{isUr ? 'سائن ان (Sign In)' : 'Sign In'}</span>
          </button>
        </div>

        {/* Welcome Bonus Callout for Create Account */}
        {mode === 'SIGNUP' && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-950/90 to-slate-900 border border-emerald-500/50 flex items-center gap-2 text-xs text-emerald-200">
            <Sparkles className="w-4 h-4 text-yellow-400 shrink-0 animate-pulse" />
            <span className="font-bold">
              {isUr ? (
                <>
                  نیا اکاؤنٹ بنانے پر فوری <strong className="text-yellow-300">Rs 20</strong> مفت ملیں گے!
                </>
              ) : (
                <>
                  Create a new account and get <strong className="text-yellow-300">Rs 20</strong> welcome bonus instantly!
                </>
              )}
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-950/90 border border-rose-500/60 text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {welcomeBanner && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-400 text-xs text-emerald-200 font-bold text-center">
            {welcomeBanner}
          </div>
        )}

        {mode === 'SIGNUP' ? (
          <form onSubmit={handleCreateAccount} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                {isUr ? 'پورا نام' : 'Full Name'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isUr ? 'مثلاً Bilal Khan' : 'e.g. Bilal Khan'}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                {isUr ? 'موبائل نمبر' : 'Mobile Number'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                {isUr ? 'پاس ورڈ' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isUr ? 'کم از کم 4 حروف' : 'Minimum 4 characters'}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                {isUr
                  ? 'ریفرل کوڈ (اختیاری • 7% شیئر بونس)'
                  : 'Referral Code (Optional · 7% Share Bonus)'}
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder={isUr ? 'دوست کا ریفرل کوڈ' : 'Enter friend referral code if any'}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 text-white font-black text-xs sm:text-sm uppercase tracking-wide shadow-lg hover:brightness-110 active:scale-98 transition cursor-pointer"
            >
              {isUr
                ? 'اکاؤنٹ بنائیں اور Rs 20 حاصل کریں →'
                : 'Create Account & Claim Rs 20 →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                {isUr ? 'موبائل نمبر یا نام' : 'Mobile Number or Username'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder={isUr ? '03048921102 یا Guest4' : '03048921102 or Guest4'}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                {isUr ? 'پاس ورڈ' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder={isUr ? 'اپنا پاس ورڈ درج کریں' : 'Enter your password'}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <p className="text-[10px] text-slate-400">
              {isUr ? 'ڈیمو اکاؤنٹ: ' : 'Demo Account: '}
              <span className="font-mono text-amber-300">Guest4</span> ·{' '}
              {isUr ? 'پاس ورڈ: ' : 'Password: '}
              <span className="font-mono text-amber-300">123456</span>
            </p>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wide shadow-lg hover:brightness-110 active:scale-98 transition cursor-pointer"
            >
              {isUr ? 'سائن ان کریں (گیم کھولیں) →' : 'Sign In & Play Now →'}
            </button>
          </form>
        )}
      </div>
      </div>
    </div>
  );
};
