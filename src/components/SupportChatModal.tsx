import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Wallet, HelpCircle, Download, Loader2 } from 'lucide-react';
import { Transaction, UserProfile } from '../types/game';
import { useGameStore } from '../hooks/useGameStore';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

interface SupportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  transactions: Transaction[];
  currentView: 'LOBBY' | 'TABLE';
  onOpenWallet?: (tab?: 'DEPOSIT' | 'WITHDRAW') => void;
  onOpenApkInstall?: () => void;
}

const DRAGON_TIGER_LOGO = '/assets/aistudio/IMG-20261113-WA5056_bdc6a48b.jpg';

export const SupportChatModal: React.FC<SupportChatModalProps> = ({
  isOpen,
  onClose,
  user,
  transactions,
  currentView,
  onOpenWallet,
  onOpenApkInstall,
}) => {
  const { language } = useGameStore();
  const isUr = language === 'ur';

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome_1',
      role: 'model',
      text: isUr
        ? `السلام علیکم ${user.name}! میں Dragon Tiger Help Bot ہوں۔\nڈپازٹ، وڈرا، گیم رولز، APK انسٹال یا 7% بونس کے بارے میں کوئی بھی سوال پوچھیں!`
        : `Welcome ${user.name}! I'm the Dragon Tiger Help Bot.\nAsk me anything about deposits, withdrawals, game rules, payouts, 7% referral bonus, or app installation!`,
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome_1') {
        return [
          {
            id: 'welcome_1',
            role: 'model',
            text: isUr
              ? `السلام علیکم ${user.name}! میں Dragon Tiger Help Bot ہوں۔\nڈپازٹ، وڈرا، گیم رولز، APK انسٹال یا 7% بونس کے بارے میں کوئی بھی سوال پوچھیں!`
              : `Welcome ${user.name}! I'm the Dragon Tiger Help Bot.\nAsk me anything about deposits, withdrawals, game rules, payouts, 7% referral bonus, or app installation!`,
          },
        ];
      }
      return prev;
    });
  }, [isUr, user.name]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isLoading]);

  if (!isOpen) return null;

  const pendingDeposits = transactions.filter(
    (t) => t.type === 'DEPOSIT' && t.status === 'Pending'
  );
  const pendingWithdraws = transactions.filter(
    (t) => t.type === 'WITHDRAW' && t.status === 'Pending'
  );
  const latestTx = transactions[0];
  const lastTransactionSummary = latestTx
    ? `${latestTx.type} Rs ${latestTx.amount} via ${latestTx.method} (${latestTx.status === 'Completed' ? 'Approved' : latestTx.status})`
    : 'None';

  const quickPrompts = isUr
    ? [
        { label: '💰 ڈپازٹ مسئلہ', text: 'میرا ڈپازٹ کیسے ہوگا اور ایڈمن کب اپروو کرے گا؟' },
        { label: '🏦 وڈرا پینڈنگ ہے', text: 'میرا وڈرا کب تک اپروو ہوگا؟' },
        { label: '🃏 گیم رولز & 1.9x', text: 'ڈریگن ٹائیگر کھیلنے کا طریقہ اور پے آؤٹ کیا ہے؟' },
        { label: '📱 ایپ انسٹال', text: 'گیم کا آئیکن موبائل میں انسٹال کیسے کروں؟' },
        { label: '🎁 7% بونس', text: '7% ریفرل بونس اور Rs 20 سائن اپ بونس کیسے ملتا ہے؟' },
      ]
    : [
        { label: '💰 Deposit Help', text: 'How do deposits work and when will my pending deposit be approved?' },
        { label: '🏦 Withdraw Status', text: 'Why is my withdrawal pending and when will it be approved?' },
        { label: '🃏 Rules & Payouts', text: 'How to play Dragon Tiger and how much does it pay?' },
        { label: '📱 Install App', text: 'How do I install the Dragon Tiger app icon on my phone?' },
        { label: '🎁 7% Bonus', text: 'How do the 7% referral bonus and Rs 20 sign-up bonus work?' },
      ];

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, text: m.text })),
          context: {
            userName: user.name,
            userId: user.id,
            balance: user.balance,
            language,
            currentView,
            pendingDepositCount: pendingDeposits.length,
            pendingWithdrawCount: pendingWithdraws.length,
            lastTransactionSummary,
          },
        }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `m_${Date.now()}`,
          role: 'model',
          text: data.reply!,
        },
      ]);
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error && err.message
          ? err.message
          : isUr
          ? 'رابطہ کرنے میں مسئلہ آیا۔ براہ کرم دوبارہ کوشش کریں۔'
          : 'Could not reach support assistant. Please try again.';

      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'model',
          text: `⚠️ ${errMsg}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-md h-[92vh] max-h-[540px] bg-gradient-to-b from-slate-900 via-[#150c24] to-slate-950 border-2 border-amber-400/70 rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.35)] overflow-hidden text-white flex flex-col">
        {/* ================= HEADER WITH DRAGON TIGER LOGO ================= */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-[#28130a] via-slate-900 to-[#28130a] border-b border-amber-500/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 shadow-lg shrink-0">
              <img
                src={DRAGON_TIGER_LOGO}
                alt="Dragon Tiger Bot"
                draggable={false}
                className="w-full h-full rounded-full object-cover"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-black text-amber-300 tracking-wide">
                  Dragon Tiger Support Bot
                </h3>
                <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              </div>
              <p className="text-[10px] text-emerald-400 font-bold">
                {isUr ? 'Alvi Games • 24/7 فوری حل' : 'Alvi Games • 24/7 Instant Problem Solver'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            aria-label="Close Support Chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= LIVE ACCOUNT STRIP & QUICK ACTIONS ================= */}
        <div className="px-3 py-1.5 bg-black/40 border-b border-slate-800 flex items-center justify-between gap-2 text-[10px] shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-slate-400 font-semibold truncate">
              {user.name} ({user.id})
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-bold">
              Rs {user.balance.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenWallet && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWallet('DEPOSIT');
                }}
                className="px-2 py-0.5 rounded-md bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/50 text-emerald-200 font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Wallet className="w-3 h-3" />
                <span>{isUr ? 'والٹ' : 'Wallet'}</span>
              </button>
            )}
            {onOpenApkInstall && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenApkInstall();
                }}
                className="px-2 py-0.5 rounded-md bg-sky-600/30 hover:bg-sky-600/50 border border-sky-400/50 text-sky-200 font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>APK</span>
              </button>
            )}
          </div>
        </div>

        {/* ================= CHAT MESSAGES ================= */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-950/40">
          {messages.map((msg) => {
            const isBot = msg.role === 'model';
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="w-7 h-7 rounded-full border border-amber-400 overflow-hidden bg-slate-900 shrink-0 shadow">
                    <img
                      src={DRAGON_TIGER_LOGO}
                      alt="Bot"
                      draggable={false}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div
                  className={`max-w-[82%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow ${
                    isBot
                      ? 'bg-slate-900/95 border border-amber-500/30 text-slate-100 rounded-bl-sm'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold rounded-br-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
              <div className="w-7 h-7 rounded-full border border-amber-400 overflow-hidden bg-slate-900 shrink-0">
                <img
                  src={DRAGON_TIGER_LOGO}
                  alt="Bot"
                  draggable={false}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-slate-900/95 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isUr ? 'جواب تیار ہو رہا ہے...' : 'Solving your issue...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ================= QUICK PROBLEM BUTTONS ================= */}
        <div className="px-2.5 py-1.5 bg-slate-900/80 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          {quickPrompts.map((qp) => (
            <button
              key={qp.label}
              type="button"
              disabled={isLoading}
              onClick={() => sendMessage(qp.text)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-200 transition cursor-pointer disabled:opacity-50"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* ================= INPUT BAR ================= */}
        <form
          onSubmit={handleSubmit}
          className="p-2.5 bg-slate-950 border-t border-amber-500/30 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isUr
                ? 'اپنا مسئلہ لکھیں (اردو یا انگلش میں)...'
                : 'Describe your problem (English or Urdu)...'
            }
            disabled={isLoading}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none text-xs text-white placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow hover:brightness-110 active:scale-95 transition cursor-pointer disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isUr ? 'بھیجیں' : 'Send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
