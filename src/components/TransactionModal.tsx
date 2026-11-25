import React, { useState, useEffect, useMemo } from 'react';
import {
  X, ArrowDownCircle, ArrowUpCircle, History, CheckCircle2,
  Zap, Wallet, RefreshCw, AlertCircle, QrCode, Clock, XCircle
} from 'lucide-react';
import { Transaction, TransactionStatus } from '../types/game';
import { soundManager } from '../utils/audio';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onDeposit: (amount: number, method: 'EasyPaisa' | 'JazzCash' | 'AllBankQR', txId: string) => TransactionStatus | void;
  onWithdraw: (amount: number, method: 'EasyPaisa' | 'JazzCash', accountTitle: string, accountNumber: string) => boolean | { ok: boolean; status?: TransactionStatus };
  transactions: Transaction[];
  initialTab?: 'DEPOSIT' | 'WITHDRAW';
}

type StatusFilter = 'ALL' | 'Pending' | 'Completed' | 'Rejected';

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  balance,
  onDeposit,
  onWithdraw,
  transactions,
  initialTab = 'DEPOSIT'
}) => {
  const [activeTab, setActiveTab] = useState<'DEPOSIT' | 'WITHDRAW' | 'HISTORY'>(initialTab);
  const [depositHistoryFilter, setDepositHistoryFilter] = useState<StatusFilter>('ALL');
  const [withdrawHistoryFilter, setWithdrawHistoryFilter] = useState<StatusFilter>('ALL');
  const [allHistoryFilter, setAllHistoryFilter] = useState<StatusFilter>('ALL');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const [depositAmount, setDepositAmount] = useState<number>(300);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);

  const [userTid, setUserTid] = useState<string>('');
  const [tidError, setTidError] = useState<string | null>(null);

  const [withdrawMethod, setWithdrawMethod] = useState<'EasyPaisa' | 'JazzCash'>('EasyPaisa');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(500);
  const [withdrawTitle, setWithdrawTitle] = useState<string>('Shoaib Trader');
  const [withdrawAccount, setWithdrawAccount] = useState<string>('03048921102');
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  const depositTxs = useMemo(
    () => transactions.filter((t) => t.type === 'DEPOSIT'),
    [transactions]
  );

  const withdrawTxs = useMemo(
    () => transactions.filter((t) => t.type === 'WITHDRAW'),
    [transactions]
  );

  const filteredDepositTxs = useMemo(() => {
    if (depositHistoryFilter === 'ALL') return depositTxs;
    return depositTxs.filter((t) => t.status === depositHistoryFilter);
  }, [depositTxs, depositHistoryFilter]);

  const filteredWithdrawTxs = useMemo(() => {
    if (withdrawHistoryFilter === 'ALL') return withdrawTxs;
    return withdrawTxs.filter((t) => t.status === withdrawHistoryFilter);
  }, [withdrawTxs, withdrawHistoryFilter]);

  const filteredAllTxs = useMemo(() => {
    if (allHistoryFilter === 'ALL') return transactions;
    return transactions.filter((t) => t.status === allHistoryFilter);
  }, [transactions, allHistoryFilter]);

  if (!isOpen) return null;

  const quickDepositOptions = [
    { amount: 300, bonus: 15 },
    { amount: 500, bonus: 35 },
    { amount: 1000, bonus: 100 },
    { amount: 2000, bonus: 250 },
    { amount: 5000, bonus: 700 },
    { amount: 10000, bonus: 1800 },
    { amount: 25000, bonus: 5000 },
    { amount: 50000, bonus: 12000 },
  ];

  const handleTidSubmit = () => {
    setTidError(null);
    if (!depositAmount || depositAmount < 300) {
      setTidError('Minimum deposit is Rs 300.');
      return;
    }
    const trimmed = userTid.trim();
    if (!trimmed || trimmed.length < 5) {
      setTidError('Please enter a valid TID / Transaction ID from your payment SMS.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      onDeposit(depositAmount, 'AllBankQR', trimmed);
      soundManager.playCashSound();
      setIsProcessing(false);
      setDepositSuccess(
        `⏳ Deposit request (TID: ${trimmed}) submitted! Rs ${depositAmount.toLocaleString()} is Pending and will be added once approved by Admin.`
      );
      setUserTid('');
      setDepositHistoryFilter('ALL');
      setTimeout(() => setDepositSuccess(null), 7000);
    }, 650);
  };

  const handleInstantWithdraw = () => {
    setWithdrawError(null);
    setWithdrawSuccess(null);

    if (withdrawAmount <= 0) {
      setWithdrawError('Please enter a valid amount.');
      return;
    }
    if (withdrawAmount > balance) {
      setWithdrawError(`Insufficient balance! Your current balance is Rs ${balance.toLocaleString()}.`);
      return;
    }
    if (withdrawAmount < 500) {
      setWithdrawError('Minimum withdraw is Rs 500.');
      return;
    }
    if (!withdrawAccount.trim() || !withdrawTitle.trim()) {
      setWithdrawError('Please enter both Account Holder Name and Mobile Number.');
      return;
    }

    setIsWithdrawing(true);

    setTimeout(() => {
      const res = onWithdraw(withdrawAmount, withdrawMethod, withdrawTitle, withdrawAccount);
      const ok = typeof res === 'boolean' ? res : res.ok;
      setIsWithdrawing(false);
      if (ok) {
        soundManager.playCashSound();
        setWithdrawSuccess(
          `⏳ Withdraw request of Rs ${withdrawAmount.toLocaleString()} (${withdrawMethod} - ${withdrawAccount}) submitted! It is Pending and will be paid once approved by Admin.`
        );
        setWithdrawHistoryFilter('ALL');
        setTimeout(() => setWithdrawSuccess(null), 7000);
      } else {
        setWithdrawError('Transaction could not be processed. Please try again.');
      }
    }, 650);
  };

  const renderStatusBadge = (status: TransactionStatus) => {
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 text-[10px] font-black">
          <CheckCircle2 className="w-3 h-3" />
          <span>Approved</span>
        </span>
      );
    }
    if (status === 'Rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/60 text-rose-300 text-[10px] font-black">
          <XCircle className="w-3 h-3" />
          <span>Rejected</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[10px] font-black">
        <Clock className="w-3 h-3" />
        <span>Pending</span>
      </span>
    );
  };

  const renderFilterBar = (
    list: Transaction[],
    activeFilter: StatusFilter,
    setFilter: (f: StatusFilter) => void
  ) => {
    const pendingCount = list.filter((t) => t.status === 'Pending').length;
    const approvedCount = list.filter((t) => t.status === 'Completed').length;
    const rejectedCount = list.filter((t) => t.status === 'Rejected').length;

    const options: { id: StatusFilter; label: string }[] = [
      { id: 'ALL', label: `All (${list.length})` },
      { id: 'Pending', label: `Pending (${pendingCount})` },
      { id: 'Completed', label: `Approved (${approvedCount})` },
      { id: 'Rejected', label: `Rejected (${rejectedCount})` },
    ];

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setFilter(opt.id)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition cursor-pointer ${
              activeFilter === opt.id
                ? opt.id === 'Completed'
                  ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200'
                  : opt.id === 'Pending'
                  ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                  : opt.id === 'Rejected'
                  ? 'bg-rose-600/30 border-rose-400 text-rose-200'
                  : 'bg-slate-800 border-amber-400/70 text-white'
                : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto font-sans select-none">
      <div className="relative w-full max-w-3xl max-h-[96%] my-auto bg-gradient-to-b from-[#1b100d] via-[#120a08] to-[#0a0504] border-2 border-amber-500/70 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-950 via-slate-950 to-amber-950 border-b border-amber-500/30 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 p-0.5 flex items-center justify-center shadow-lg shrink-0">
              <Wallet className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-amber-300 leading-tight">
                All Bank Deposit & Fast Wallet
              </h2>
              <p className="text-[9px] text-amber-200/80 font-medium">
                Admin-Approved QR Deposit • EasyPaisa & JazzCash Withdraw
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/15 border border-amber-500/40 rounded-full">
              <span className="text-[9px] text-amber-200/80 uppercase font-semibold">
                Balance:
              </span>
              <span className="text-xs sm:text-sm font-black text-amber-300 tabular-nums">
                Rs {balance.toLocaleString()}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-amber-900/40 bg-black/50 px-3 pt-1.5 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('DEPOSIT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-t-lg transition-all cursor-pointer ${
              activeTab === 'DEPOSIT'
                ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span>Deposit</span>
            {depositTxs.filter((t) => t.status === 'Pending').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-amber-200 text-[9px] font-black">
                {depositTxs.filter((t) => t.status === 'Pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('WITHDRAW')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-t-lg transition-all cursor-pointer ${
              activeTab === 'WITHDRAW'
                ? 'bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>Withdraw (Min Rs 500)</span>
            {withdrawTxs.filter((t) => t.status === 'Pending').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-amber-200 text-[9px] font-black">
                {withdrawTxs.filter((t) => t.status === 'Pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-t-lg transition-all ml-auto cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-slate-800 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>All History ({transactions.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-2 sm:p-3 overflow-y-auto space-y-3">
          {/* DEPOSIT TAB */}
          {activeTab === 'DEPOSIT' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-stretch">
                {/* LEFT COLUMN: QR */}
                <div className="p-2.5 rounded-xl bg-gradient-to-b from-[#1d1208] via-slate-950 to-[#160d06] border border-yellow-400/80 shadow-lg flex flex-col items-center justify-between text-center space-y-2">
                  <div className="space-y-1 w-full">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-400/60 text-yellow-300 text-[11px] font-black">
                      <QrCode className="w-3.5 h-3.5 text-yellow-400" />
                      <span>All Bank QR Deposit</span>
                    </div>

                    <h3 className="text-xs sm:text-[13px] font-black text-amber-200 leading-tight">
                      Deposit from any bank app. Scan QR to send payment.
                    </h3>

                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/80 text-emerald-300">
                        Min: Rs 300
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/80 text-amber-300">
                        Max: Unlimited
                      </span>
                    </div>
                  </div>

                  <div className="relative p-1.5 rounded-xl bg-white shadow-md border-2 border-yellow-400/90 max-w-[135px] sm:max-w-[150px] transition-transform hover:scale-102">
                    <img
                      src="/assets/game/all_bank_qr.jpg"
                      alt="Scan QR to pay Muhammad Shoaib"
                      className="w-full h-auto rounded-lg object-contain"
                    />
                    <div className="mt-1 py-0.5 px-1.5 rounded bg-slate-950 text-amber-300 text-[9px] font-black flex items-center justify-between">
                      <span>Muhammad Shoaib</span>
                      <span className="text-[8px] text-emerald-400 font-bold">Raast QR</span>
                    </div>
                  </div>

                  <div className="w-full pt-1 border-t border-amber-500/20 text-center">
                    <span className="text-[9px] text-amber-300/90 font-bold">
                      Supported: EasyPaisa • JazzCash • NayaPay • SadaPay • All Banks
                    </span>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="flex flex-col justify-between space-y-2">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1.5 shadow">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-amber-200">
                        1. Enter or Select Amount:
                      </span>
                      <span className="text-yellow-300 text-[10px]">Min: Rs 300</span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs font-bold text-amber-400">Rs</span>
                      <input
                        type="number"
                        min={300}
                        value={depositAmount || ''}
                        onChange={(e) => setDepositAmount(Number(e.target.value))}
                        placeholder="Enter 300 or more"
                        className="w-full pl-8 pr-2 py-1 bg-slate-900 border border-amber-500/60 rounded-lg text-white font-mono font-black text-xs sm:text-sm focus:outline-none focus:border-yellow-400 placeholder:text-slate-500 placeholder:text-[10px]"
                      />
                      {depositAmount > 0 && depositAmount < 300 && (
                        <div className="text-[9px] text-red-400 font-bold mt-0.5">
                          Minimum deposit is Rs 300.
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                      {quickDepositOptions.map((opt) => (
                        <button
                          key={opt.amount}
                          onClick={() => setDepositAmount(opt.amount)}
                          className={`relative p-1 rounded-lg border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                            depositAmount === opt.amount
                              ? 'border-amber-400 bg-gradient-to-b from-amber-500/30 to-yellow-500/20 shadow scale-102 ring-1 ring-amber-400'
                              : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-[10px] sm:text-[11px] font-black text-amber-300 tabular-nums">
                            {opt.amount.toLocaleString()}
                          </span>
                          <span className="text-[8px] text-emerald-400 font-bold leading-none">
                            +{opt.bonus}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/90 border border-amber-500/50 space-y-1.5 shadow">
                    <div className="flex items-center justify-between text-[11px] font-black text-amber-300">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>2. Enter Payment TID:</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-400/40">
                        Admin Approval
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={userTid}
                        onChange={(e) => setUserTid(e.target.value)}
                        placeholder="Enter SMS TID (e.g. 84910245102)"
                        className="flex-1 bg-slate-900 border border-amber-500/60 rounded-lg px-2.5 py-1 text-xs font-black text-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono tracking-wider placeholder:text-slate-500 placeholder:text-[10px]"
                      />
                      <button
                        disabled={isProcessing || !userTid.trim()}
                        onClick={handleTidSubmit}
                        className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs uppercase shadow hover:brightness-110 active:scale-95 disabled:opacity-40 transition cursor-pointer shrink-0 flex items-center gap-1"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Submit</span>
                          </>
                        )}
                      </button>
                    </div>

                    {tidError && (
                      <div className="p-1.5 bg-red-950/90 border border-red-500/60 rounded text-[10px] text-red-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                        <span>{tidError}</span>
                      </div>
                    )}

                    <p className="text-[9px] text-slate-400 leading-tight">
                      Scan QR, send payment, enter your SMS <strong>TID</strong> above and click <strong>Submit</strong>. Balance updates once Admin approves your deposit.
                    </p>
                  </div>
                </div>
              </div>

              {depositSuccess && (
                <div className="p-2.5 bg-amber-950/90 border border-amber-400 rounded-xl flex items-center gap-2 text-xs text-amber-100 shadow-xl">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-bold">{depositSuccess}</span>
                </div>
              )}

              {/* DEPOSIT HISTORY (PENDING & APPROVED) */}
              <div className="p-2.5 rounded-xl bg-slate-950/85 border border-amber-500/30 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                    <History className="w-3.5 h-3.5" />
                    <span>Deposit History (Pending & Approved)</span>
                  </div>
                  {renderFilterBar(depositTxs, depositHistoryFilter, setDepositHistoryFilter)}
                </div>

                {filteredDepositTxs.length === 0 ? (
                  <div className="text-center py-4 text-[11px] text-slate-400">
                    No deposit records in this category yet.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {filteredDepositTxs.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                            <span>Deposit · {tx.method}</span>
                            <span className="text-[10px] font-mono text-slate-400">TID: {tx.txId}</span>
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono">
                            {new Date(tx.timestamp).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-xs font-black font-mono text-emerald-400 tabular-nums">
                            +Rs {tx.amount.toLocaleString()}
                          </span>
                          {renderStatusBadge(tx.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WITHDRAW TAB */}
          {activeTab === 'WITHDRAW' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-amber-200 mb-1.5 uppercase tracking-wider">
                  Select Cashout Channel:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['EasyPaisa', 'JazzCash'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setWithdrawMethod(m)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                        withdrawMethod === m
                          ? 'border-emerald-400 bg-emerald-950/40 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${m === 'EasyPaisa' ? 'bg-emerald-400' : 'bg-red-500'}`} />
                        <span className="text-xs font-black text-white">{m}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold">
                        Fast Transfer
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Account Title Name:
                    </label>
                    <input
                      type="text"
                      value={withdrawTitle}
                      onChange={(e) => setWithdrawTitle(e.target.value)}
                      placeholder="e.g. Muhammad Shoaib"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {withdrawMethod} Mobile Account Number:
                    </label>
                    <input
                      type="text"
                      value={withdrawAccount}
                      onChange={(e) => setWithdrawAccount(e.target.value)}
                      placeholder="e.g. 03048921102"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-400 tabular-nums font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-300">
                      Withdraw Amount (Min: Rs 500):
                    </label>
                    <button
                      onClick={() => setWithdrawAmount(balance)}
                      className="text-[11px] text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Withdraw All (Rs {balance.toLocaleString()})
                    </button>
                  </div>
                  <input
                    type="number"
                    min={500}
                    max={balance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-black text-amber-300 focus:outline-none focus:border-emerald-400 tabular-nums font-mono"
                  />
                  {withdrawAmount > 0 && withdrawAmount < 500 && (
                    <div className="text-[10px] text-red-400 font-bold mt-1">
                      Minimum withdraw is Rs 500.
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {[500, 1000, 2000, 5000, 10000, 25000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setWithdrawAmount(amt)}
                      className="px-2.5 py-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition cursor-pointer"
                    >
                      Rs {amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {withdrawError && (
                <div className="p-2.5 bg-red-950/80 border border-red-500/50 rounded-xl flex items-center gap-2 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{withdrawError}</span>
                </div>
              )}

              {withdrawSuccess && (
                <div className="p-2.5 bg-amber-950/80 border border-amber-500/50 rounded-xl flex items-center gap-2 text-xs text-amber-100 shadow-xl">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-bold">{withdrawSuccess}</span>
                </div>
              )}

              <button
                disabled={isWithdrawing}
                onClick={handleInstantWithdraw}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 text-white font-black text-xs sm:text-sm tracking-wide uppercase hover:brightness-110 active:scale-98 transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isWithdrawing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Submitting Withdraw...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white text-white" />
                    <span>Submit Withdraw (Rs {withdrawAmount.toLocaleString()})</span>
                  </>
                )}
              </button>

              {/* WITHDRAW HISTORY (PENDING & APPROVED) */}
              <div className="p-2.5 rounded-xl bg-slate-950/85 border border-emerald-500/30 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300">
                    <History className="w-3.5 h-3.5" />
                    <span>Withdraw History (Pending & Approved)</span>
                  </div>
                  {renderFilterBar(withdrawTxs, withdrawHistoryFilter, setWithdrawHistoryFilter)}
                </div>

                {filteredWithdrawTxs.length === 0 ? (
                  <div className="text-center py-4 text-[11px] text-slate-400">
                    No withdraw records in this category yet.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {filteredWithdrawTxs.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-white flex items-center gap-1.5 truncate">
                            <span>{tx.method} · {tx.accountTitle}</span>
                            <span className="text-[10px] font-mono text-slate-400">({tx.accountNumber})</span>
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono">
                            ID: {tx.txId} •{' '}
                            {new Date(tx.timestamp).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-xs font-black font-mono text-amber-300 tabular-nums">
                            -Rs {tx.amount.toLocaleString()}
                          </span>
                          {renderStatusBadge(tx.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-amber-200">
                  All Transactions & Wallet Passbook:
                </div>
                {renderFilterBar(transactions, allHistoryFilter, setAllHistoryFilter)}
              </div>

              {filteredAllTxs.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No transactions recorded yet.
                </div>
              ) : (
                filteredAllTxs.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                          tx.type === 'DEPOSIT'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : tx.type === 'BET_WIN'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        {tx.type === 'DEPOSIT' ? '↓' : tx.type === 'BET_WIN' ? '★' : '↑'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>
                            {tx.type === 'DEPOSIT'
                              ? 'Deposit'
                              : tx.type === 'BET_WIN'
                              ? 'Win / Bonus'
                              : 'Withdraw'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {tx.method}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {tx.txId} •{' '}
                          {new Date(tx.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div
                        className={`text-xs sm:text-sm font-black tabular-nums font-mono ${
                          tx.type === 'DEPOSIT' || tx.type === 'BET_WIN'
                            ? 'text-emerald-400'
                            : 'text-amber-300'
                        }`}
                      >
                        {tx.type === 'DEPOSIT' || tx.type === 'BET_WIN' ? '+' : '-'}Rs{' '}
                        {tx.amount.toLocaleString()}
                      </div>
                      {renderStatusBadge(tx.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-black/70 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            All Bank QR Deposit & EasyPaisa / JazzCash Withdraw (Admin Approval)
          </span>
          <span className="text-amber-400 font-bold">
            🔒 100% Secure Payments
          </span>
        </div>
      </div>
    </div>
  );
};
