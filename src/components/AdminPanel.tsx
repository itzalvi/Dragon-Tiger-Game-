import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CreditCard,
  DollarSign,
  Edit3,
  ExternalLink,
  LayoutDashboard,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  X,
  ArrowLeft,
  Layers,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import {
  BettingOption,
  Card,
  CardRank,
  CardSuit,
  ManagedUser,
  Transaction,
  TransactionMethod,
  TransactionStatus,
} from '../types/game';
import { createSpecificCard, determineWinner, RANKS, SUITS } from '../utils/cardDeck';
import { gameStore } from '../utils/gameStore';
import { useGameStore } from '../hooks/useGameStore';

type AdminTab = 'OVERVIEW' | 'CARDS' | 'USERS' | 'DEPOSITS' | 'WITHDRAWS' | 'SETTINGS';

interface AdminPanelProps {
  onClose: () => void;
  isOverlay?: boolean;
  initialTab?: AdminTab;
}

const AVATAR_CHOICES = ['👓', '🧔', '👸', '👑', '🦁', '😎', '🔥', '💎'];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onClose,
  isOverlay = false,
  initialTab = 'CARDS',
}) => {
  const { users, activeUser, transactions, cardControl, settings } = useGameStore();
  const [telemetry, setTelemetry] = useState(() => gameStore.getLiveTelemetry());
  const [liveClock, setLiveClock] = useState(() => gameStore.getLiveRoundClock());

  useEffect(() => {
    const unsubTelemetry = gameStore.subscribeTelemetry(() => {
      setTelemetry(gameStore.getLiveTelemetry());
    });
    const id = setInterval(() => {
      setLiveClock(gameStore.getLiveRoundClock());
    }, 500);
    return () => {
      unsubTelemetry();
      clearInterval(id);
    };
  }, []);

  const displayRoundNumber = liveClock.roundNumber;
  const displayPhase = liveClock.phase;
  const displayTimer = liveClock.timer;

  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => !settings.adminPinEnabled);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Card control picker state
  const [dragonRank, setDragonRank] = useState<CardRank>('K');
  const [dragonSuit, setDragonSuit] = useState<CardSuit>('♠');
  const [tigerRank, setTigerRank] = useState<CardRank>('7');
  const [tigerSuit, setTigerSuit] = useState<CardSuit>('♥');

  // User CRUD & Balance Control state
  const [userSearch, setUserSearch] = useState<string>('');
  const [userFormOpen, setUserFormOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [uName, setUName] = useState<string>('');
  const [uPhone, setUPhone] = useState<string>('');
  const [uBalance, setUBalance] = useState<string>('1000');
  const [uVip, setUVip] = useState<string>('0');
  const [uAvatar, setUAvatar] = useState<string>('😎');
  const [uStatus, setUStatus] = useState<'Active' | 'Suspended'>('Active');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [balanceEditor, setBalanceEditor] = useState<{
    userId: string;
    mode: 'ADD' | 'EDIT';
  } | null>(null);
  const [balanceEditorAmount, setBalanceEditorAmount] = useState<string>('500');
  const [confirmDeleteBalanceUserId, setConfirmDeleteBalanceUserId] = useState<string | null>(null);

  // Deposit CRUD state
  const [depFilter, setDepFilter] = useState<'ALL' | 'Pending' | 'Completed' | 'Rejected'>('ALL');
  const [depSearch, setDepSearch] = useState<string>('');
  const [depFormOpen, setDepFormOpen] = useState<boolean>(false);
  const [editingDep, setEditingDep] = useState<Transaction | null>(null);
  const [depUserId, setDepUserId] = useState<string>(users[0]?.id || '');
  const [depAmount, setDepAmount] = useState<string>('500');
  const [depMethod, setDepMethod] = useState<TransactionMethod>('AllBankQR');
  const [depTxId, setDepTxId] = useState<string>('');
  const [depStatus, setDepStatus] = useState<TransactionStatus>('Completed');
  const [depNote, setDepNote] = useState<string>('');
  const [confirmDeleteDepId, setConfirmDeleteDepId] = useState<string | null>(null);

  // Withdraw CRUD state
  const [wthFilter, setWthFilter] = useState<'ALL' | 'Pending' | 'Completed' | 'Rejected'>('ALL');
  const [wthSearch, setWthSearch] = useState<string>('');
  const [wthFormOpen, setWthFormOpen] = useState<boolean>(false);
  const [editingWth, setEditingWth] = useState<Transaction | null>(null);
  const [wthUserId, setWthUserId] = useState<string>(users[0]?.id || '');
  const [wthAmount, setWthAmount] = useState<string>('500');
  const [wthMethod, setWthMethod] = useState<'EasyPaisa' | 'JazzCash'>('EasyPaisa');
  const [wthTitle, setWthTitle] = useState<string>('');
  const [wthNumber, setWthNumber] = useState<string>('');
  const [wthStatus, setWthStatus] = useState<TransactionStatus>('Pending');
  const [wthNote, setWthNote] = useState<string>('');
  const [confirmDeleteWthId, setConfirmDeleteWthId] = useState<string | null>(null);

  // Settings local input
  const [newPinInput, setNewPinInput] = useState<string>(settings.adminPin);

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Derived data
  const deposits = useMemo(
    () => transactions.filter((t) => t.type === 'DEPOSIT'),
    [transactions]
  );
  const withdraws = useMemo(
    () => transactions.filter((t) => t.type === 'WITHDRAW'),
    [transactions]
  );

  const pendingDepositsCount = deposits.filter((d) => d.status === 'Pending').length;
  const pendingWithdrawsCount = withdraws.filter((w) => w.status === 'Pending').length;

  const stats = useMemo(() => {
    const totalUserBalances = users.reduce((sum, u) => sum + u.balance, 0);
    const totalDepositsCompleted = deposits
      .filter((d) => d.status === 'Completed')
      .reduce((sum, d) => sum + d.amount, 0);
    const totalWithdrawsCompleted = withdraws
      .filter((w) => w.status === 'Completed')
      .reduce((sum, w) => sum + w.amount, 0);
    const pendingDepositsSum = deposits
      .filter((d) => d.status === 'Pending')
      .reduce((sum, d) => sum + d.amount, 0);
    const pendingWithdrawsSum = withdraws
      .filter((w) => w.status === 'Pending')
      .reduce((sum, w) => sum + w.amount, 0);

    return {
      totalUserBalances,
      totalDepositsCompleted,
      totalWithdrawsCompleted,
      pendingDepositsSum,
      pendingWithdrawsSum,
      netFlow: totalDepositsCompleted - totalWithdrawsCompleted,
    };
  }, [users, deposits, withdraws]);

  // Filtered lists
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const filteredDeposits = useMemo(() => {
    const q = depSearch.trim().toLowerCase();
    return deposits.filter((d) => {
      if (depFilter !== 'ALL' && d.status !== depFilter) return false;
      if (!q) return true;
      return (
        (d.userName || '').toLowerCase().includes(q) ||
        (d.userId || '').toLowerCase().includes(q) ||
        d.txId.toLowerCase().includes(q) ||
        d.accountTitle.toLowerCase().includes(q)
      );
    });
  }, [deposits, depFilter, depSearch]);

  const filteredWithdraws = useMemo(() => {
    const q = wthSearch.trim().toLowerCase();
    return withdraws.filter((w) => {
      if (wthFilter !== 'ALL' && w.status !== wthFilter) return false;
      if (!q) return true;
      return (
        (w.userName || '').toLowerCase().includes(q) ||
        (w.userId || '').toLowerCase().includes(q) ||
        w.accountTitle.toLowerCase().includes(q) ||
        w.accountNumber.toLowerCase().includes(q) ||
        w.txId.toLowerCase().includes(q)
      );
    });
  }, [withdraws, wthFilter, wthSearch]);

  // Live preview of selected manual cards
  const previewDragonCard: Card = useMemo(
    () => createSpecificCard(dragonRank, dragonSuit),
    [dragonRank, dragonSuit]
  );
  const previewTigerCard: Card = useMemo(
    () => createSpecificCard(tigerRank, tigerSuit),
    [tigerRank, tigerSuit]
  );
  const previewWinner: BettingOption = useMemo(
    () => determineWinner(previewDragonCard, previewTigerCard),
    [previewDragonCard, previewTigerCard]
  );

  // User CRUD handlers
  const openAddUser = () => {
    setEditingUser(null);
    setUName('');
    setUPhone('0300');
    setUBalance('1000');
    setUVip('0');
    setUAvatar('😎');
    setUStatus('Active');
    setUserFormOpen(true);
  };

  const openEditUser = (u: ManagedUser) => {
    setEditingUser(u);
    setUName(u.name);
    setUPhone(u.phone);
    setUBalance(String(u.balance));
    setUVip(String(u.vip));
    setUAvatar(u.avatar || '😎');
    setUStatus(u.status);
    setUserFormOpen(true);
  };

  const saveUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uName.trim()) return;
    if (editingUser) {
      gameStore.updateUser(editingUser.id, {
        name: uName.trim(),
        phone: uPhone.trim(),
        balance: Number(uBalance) || 0,
        vip: Number(uVip) || 0,
        avatar: uAvatar,
        status: uStatus,
      });
      notify(`User "${uName.trim()}" updated`);
    } else {
      const created = gameStore.addUser({
        name: uName.trim(),
        phone: uPhone.trim(),
        balance: Number(uBalance) || 0,
        vip: Number(uVip) || 0,
        avatar: uAvatar,
        status: uStatus,
      });
      notify(`User "${created.name}" added (ID: ${created.id})`);
    }
    setUserFormOpen(false);
  };

  // Deposit CRUD handlers
  const openAddDeposit = () => {
    setEditingDep(null);
    setDepUserId(users[0]?.id || '');
    setDepAmount('1000');
    setDepMethod('AllBankQR');
    setDepTxId('QR' + Math.floor(10000000 + Math.random() * 90000000));
    setDepStatus('Completed');
    setDepNote('Manual Admin Deposit');
    setDepFormOpen(true);
  };

  const openEditDeposit = (tx: Transaction) => {
    setEditingDep(tx);
    setDepUserId(tx.userId || users[0]?.id || '');
    setDepAmount(String(tx.amount));
    setDepMethod(tx.method);
    setDepTxId(tx.txId);
    setDepStatus(tx.status);
    setDepNote(tx.note || '');
    setDepFormOpen(true);
  };

  const saveDepositForm = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(depAmount) || 0;
    if (amount <= 0) return;
    if (editingDep) {
      gameStore.editDeposit(editingDep.id, {
        userId: depUserId,
        amount,
        method: depMethod,
        txId: depTxId,
        status: depStatus,
        note: depNote,
      });
      notify(`Deposit ${depTxId} updated`);
    } else {
      gameStore.addAdminDeposit({
        userId: depUserId,
        amount,
        method: depMethod,
        txId: depTxId,
        status: depStatus === 'Pending' || depStatus === 'Rejected' ? depStatus : 'Completed',
        note: depNote,
      });
      notify(`Deposit of Rs ${amount.toLocaleString()} added`);
    }
    setDepFormOpen(false);
  };

  // Withdraw CRUD handlers
  const openAddWithdraw = () => {
    setEditingWth(null);
    const defaultUser = users[0];
    setWthUserId(defaultUser?.id || '');
    setWthAmount('500');
    setWthMethod('EasyPaisa');
    setWthTitle(defaultUser?.name || '');
    setWthNumber(defaultUser?.phone || '03048921102');
    setWthStatus('Pending');
    setWthNote('Admin Withdraw Entry');
    setWthFormOpen(true);
  };

  const openEditWithdraw = (tx: Transaction) => {
    setEditingWth(tx);
    setWthUserId(tx.userId || users[0]?.id || '');
    setWthAmount(String(tx.amount));
    setWthMethod(tx.method === 'JazzCash' ? 'JazzCash' : 'EasyPaisa');
    setWthTitle(tx.accountTitle);
    setWthNumber(tx.accountNumber);
    setWthStatus(tx.status);
    setWthNote(tx.note || '');
    setWthFormOpen(true);
  };

  const saveWithdrawForm = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(wthAmount) || 0;
    if (amount <= 0) return;
    if (editingWth) {
      gameStore.editWithdraw(editingWth.id, {
        userId: wthUserId,
        amount,
        method: wthMethod,
        accountTitle: wthTitle,
        accountNumber: wthNumber,
        status: wthStatus,
        note: wthNote,
      });
      notify(`Withdraw ${editingWth.txId} updated`);
    } else {
      gameStore.addAdminWithdraw({
        userId: wthUserId,
        amount,
        method: wthMethod,
        accountTitle: wthTitle,
        accountNumber: wthNumber,
        status: wthStatus === 'Completed' || wthStatus === 'Rejected' ? wthStatus : 'Pending',
        note: wthNote,
      });
      notify(`Withdraw of Rs ${amount.toLocaleString()} added`);
    }
    setWthFormOpen(false);
  };

  // PIN Unlock Screen (only if adminPinEnabled is toggled ON in settings)
  if (!isUnlocked && settings.adminPinEnabled) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Admin Access</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Enter your Admin PIN to open the control console.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pinInput === settings.adminPin) {
                setIsUnlocked(true);
                setPinError('');
              } else {
                setPinError('Incorrect PIN. Please try again.');
              }
            }}
            className="space-y-3"
          >
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN"
              autoFocus
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono tracking-widest text-white focus:outline-none focus:border-amber-400"
            />
            {pinError && <p className="text-xs text-rose-400 font-medium">{pinError}</p>}
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition cursor-pointer"
            >
              Unlock Console
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'OVERVIEW', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'CARDS', label: 'Card Control', icon: <Layers className="w-4 h-4" /> },
    { id: 'USERS', label: 'Users', icon: <Users className="w-4 h-4" />, badge: users.length },
    {
      id: 'DEPOSITS',
      label: 'Deposits',
      icon: <ArrowDownIcon />,
      badge: pendingDepositsCount > 0 ? pendingDepositsCount : undefined,
    },
    {
      id: 'WITHDRAWS',
      label: 'Withdraws',
      icon: <ArrowUpIcon />,
      badge: pendingWithdrawsCount > 0 ? pendingWithdrawsCount : undefined,
    },
    { id: 'SETTINGS', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const containerClasses = isOverlay
    ? 'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 font-sans'
    : 'w-screen h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden';

  const panelClasses = isOverlay
    ? 'w-full max-w-6xl h-[92vh] bg-slate-950 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100'
    : 'w-full h-full flex flex-col overflow-hidden';

  return (
    <div className={containerClasses}>
      <div className={panelClasses}>
        {/* ================= TOP HEADER BAR ================= */}
        <header className="h-14 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Shield className="w-5 h-5 text-amber-400 shrink-0" />
            <h1 className="text-sm sm:text-base font-bold text-white whitespace-nowrap truncate">
              Tiger Dragon Admin Console
            </h1>
            <span className="hidden md:inline text-slate-600">/</span>
            <span className="hidden md:inline text-xs text-slate-400 whitespace-nowrap">
              {navItems.find((n) => n.id === activeTab)?.label}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
              <span>Round #{displayRoundNumber}</span>
              <span>·</span>
              <span className="text-amber-300 font-semibold">{displayPhase}</span>
              <span>·</span>
              <span className="text-white font-bold">{displayTimer}s</span>
            </div>

            {!isOverlay && (
              <a
                href="?admin=1"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 text-xs font-medium text-slate-300 hover:text-white transition whitespace-nowrap shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>New Tab</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isOverlay ? 'Return to Table' : 'Back to Game'}</span>
            </button>
          </div>
        </header>

        {/* ================= BODY: SIDEBAR + MAIN VIEWPORT ================= */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-56 lg:w-60 bg-slate-900/70 border-b md:border-b-0 md:border-r border-slate-800 shrink-0 flex md:flex-col overflow-x-auto md:overflow-y-auto p-2 gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span className="font-mono text-[11px] text-amber-300 tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Main Workspace Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950">
            {toastMsg && (
              <div className="px-4 py-2.5 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{toastMsg}</span>
                </span>
                <button onClick={() => setToastMsg(null)} className="text-emerald-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* ================= 1. OVERVIEW TAB ================= */}
            {activeTab === 'OVERVIEW' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Dashboard Overview</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage players, deposits, withdrawals, and real-time card outcomes.
                  </p>
                </div>

                {/* Tabular KPI Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatBox label="Total Players" value={String(users.length)} sub={`${users.filter((u) => u.status === 'Active').length} Active`} />
                  <StatBox label="Player Balances" value={`Rs ${stats.totalUserBalances.toLocaleString()}`} sub={`Active: ${activeUser.name}`} />
                  <StatBox
                    label="Approved Deposits"
                    value={`Rs ${stats.totalDepositsCompleted.toLocaleString()}`}
                    sub={`${pendingDepositsCount} Pending (Rs ${stats.pendingDepositsSum.toLocaleString()})`}
                    highlight={pendingDepositsCount > 0 ? 'amber' : 'emerald'}
                  />
                  <StatBox
                    label="Approved Withdraws"
                    value={`Rs ${stats.totalWithdrawsCompleted.toLocaleString()}`}
                    sub={`${pendingWithdrawsCount} Pending (Rs ${stats.pendingWithdrawsSum.toLocaleString()})`}
                    highlight={pendingWithdrawsCount > 0 ? 'amber' : 'default'}
                  />
                </div>

                {/* Pending Actions & Quick Jump */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">Pending Approvals</h3>
                      <span className="text-xs font-mono text-slate-400">
                        {pendingDepositsCount + pendingWithdrawsCount} waiting
                      </span>
                    </div>
                    {pendingDepositsCount === 0 && pendingWithdrawsCount === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">
                        No pending deposit or withdraw requests right now.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-800">
                        {transactions
                          .filter((t) => (t.type === 'DEPOSIT' || t.type === 'WITHDRAW') && t.status === 'Pending')
                          .slice(0, 6)
                          .map((tx) => (
                            <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-white truncate">
                                  {tx.type === 'DEPOSIT' ? 'Deposit' : 'Withdraw'} · {tx.userName || tx.accountTitle}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono truncate">
                                  {tx.method} · {tx.txId}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-bold font-mono text-amber-300 tabular-nums">
                                  Rs {tx.amount.toLocaleString()}
                                </span>
                                <button
                                  onClick={() => {
                                    if (tx.type === 'DEPOSIT') {
                                      gameStore.approveDeposit(tx.id);
                                      notify(`Approved Deposit Rs ${tx.amount.toLocaleString()}`);
                                    } else {
                                      gameStore.approveWithdraw(tx.id);
                                      notify(`Approved Withdraw Rs ${tx.amount.toLocaleString()}`);
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    if (tx.type === 'DEPOSIT') {
                                      gameStore.rejectDeposit(tx.id);
                                      notify('Deposit rejected');
                                    } else {
                                      gameStore.rejectWithdraw(tx.id);
                                      notify('Withdraw rejected & refunded');
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white text-[11px] font-bold cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">Live Table & Card Status</h3>
                      <button
                        onClick={() => setActiveTab('CARDS')}
                        className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                      >
                        Open Card Control →
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-[11px] text-slate-400">Dragon Bets</div>
                        <div className="text-sm font-bold font-mono text-sky-300 tabular-nums mt-0.5">
                          Rs {telemetry.tableTotals.DRAGON.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          You: Rs {telemetry.userBets.DRAGON.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-[11px] text-slate-400">Tie Bets</div>
                        <div className="text-sm font-bold font-mono text-emerald-300 tabular-nums mt-0.5">
                          Rs {telemetry.tableTotals.TIE.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          You: Rs {telemetry.userBets.TIE.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-[11px] text-slate-400">Tiger Bets</div>
                        <div className="text-sm font-bold font-mono text-amber-300 tabular-nums mt-0.5">
                          Rs {telemetry.tableTotals.TIGER.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          You: Rs {telemetry.userBets.TIGER.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Next Card Override:</span>
                      <span className="font-mono font-bold text-amber-300">
                        {cardControl.activeOverride
                          ? cardControl.activeOverride.label
                          : cardControl.queue.length > 0
                          ? `Queued (${cardControl.queue.length} rounds)`
                          : cardControl.autoHouseProfit
                          ? 'Auto House Profit Mode'
                          : cardControl.smartStrategyEnabled !== false
                          ? 'Streak-Friendly Strategy (ON)'
                          : 'Fair Random Shuffle'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= 2. CARD & RESULT CONTROL TAB ================= */}
            {activeTab === 'CARDS' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Card & Result Control
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Set the exact Dragon & Tiger cards for the next deal, force a winner, or control table outcome strategy.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        const currentlyEnabled = cardControl.smartStrategyEnabled !== false;
                        gameStore.setSmartStrategyEnabled(!currentlyEnabled);
                        notify(
                          !currentlyEnabled
                            ? 'Streak-Friendly Strategy enabled (Natural ~60% win flow)'
                            : 'Streak-Friendly Strategy disabled'
                        );
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition cursor-pointer whitespace-nowrap ${
                        cardControl.smartStrategyEnabled !== false
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      Smart Win Strategy: {cardControl.smartStrategyEnabled !== false ? 'ON' : 'OFF'}
                    </button>

                    <button
                      onClick={() => {
                        gameStore.setAutoHouseProfit(!cardControl.autoHouseProfit);
                        notify(
                          !cardControl.autoHouseProfit
                            ? 'Strict 100% House Profit Mode enabled (Players always get lowest payout)'
                            : 'Strict 100% House Profit Mode disabled'
                        );
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition cursor-pointer whitespace-nowrap ${
                        cardControl.autoHouseProfit
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      Strict House Profit: {cardControl.autoHouseProfit ? 'ON' : 'OFF'}
                    </button>

                    {(cardControl.activeOverride || cardControl.queue.length > 0) && (
                      <button
                        onClick={() => {
                          gameStore.clearActiveOverride();
                          notify('Cleared active override (Auto Mode restored)');
                        }}
                        className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer whitespace-nowrap"
                      >
                        Reset to Auto Mode
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Round Telemetry & Active Override Status */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                  <div>
                    <div className="text-[11px] text-slate-400">Live Game State</div>
                    <div className="mt-1 flex items-center gap-3 font-mono text-sm font-bold tabular-nums">
                      <span className="text-white">Round #{displayRoundNumber}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-amber-400">{displayPhase}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-emerald-400">{displayTimer}s</span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs font-mono tabular-nums text-slate-300">
                      <span>D: Rs {telemetry.tableTotals.DRAGON.toLocaleString()}</span>
                      <span>T: Rs {telemetry.tableTotals.TIGER.toLocaleString()}</span>
                      <span>Tie: Rs {telemetry.tableTotals.TIE.toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400">Active Outcome Strategy</div>
                    {cardControl.activeOverride ? (
                      <div className="mt-1 text-xs font-bold text-amber-300 font-mono">
                        LOCKED (Next 1 Round Only): {cardControl.activeOverride.label}
                      </div>
                    ) : cardControl.queue.length > 0 ? (
                      <div className="mt-1 text-xs font-bold text-sky-300 font-mono">
                        NEXT IN QUEUE: {cardControl.queue[0].label}
                      </div>
                    ) : (
                      <div className="mt-1 text-xs text-slate-300 space-y-1">
                        <div>
                          {cardControl.autoHouseProfit
                            ? 'Strict House Profit (Lowest payout side always wins)'
                            : cardControl.smartStrategyEnabled !== false
                            ? 'Balanced Win-Streak Mode (Supports 3x Fire Streaks)'
                            : 'Fair Random Shuffle (Next result is random)'}
                        </div>
                        {(() => {
                          const s = gameStore.getStrategyState();
                          const houseProfit = s.totalStaked - s.totalPaidOut;
                          return (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono">
                              <span className="text-amber-300">
                                Streak: 🔥 {s.winStreak} (Best: {s.bestStreak})
                              </span>
                              <span className={houseProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                Net: Rs {houseProfit.toLocaleString()} ({s.totalWinsCount}W/{s.totalBetsCount}B)
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap lg:justify-end gap-2">
                    <button
                      onClick={() => {
                        gameStore.setForcedNextWinner('DRAGON');
                        notify('Next 1 Round Only: DRAGON WINS (then random)');
                      }}
                      className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                    >
                      Force Dragon Win (1 Round)
                    </button>
                    <button
                      onClick={() => {
                        gameStore.setForcedNextWinner('TIE');
                        notify('Next 1 Round Only: TIE (then random)');
                      }}
                      className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                    >
                      Force Tie (1 Round)
                    </button>
                    <button
                      onClick={() => {
                        gameStore.setForcedNextWinner('TIGER');
                        notify('Next 1 Round Only: TIGER WINS (then random)');
                      }}
                      className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                    >
                      Force Tiger Win (1 Round)
                    </button>
                  </div>
                </div>

                {/* Manual Exact Card Picker */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Manual Exact Card Selector (Next 1 Round Only)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Applies strictly to the next 1 round only. Subsequent rounds return automatically to random shuffle.
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-300 font-mono">
                      1-Round Single Override Mode
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Dragon Card Picker */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                          1. Dragon Card
                        </span>
                        <span className="text-xs font-mono text-slate-300">
                          Selected: {dragonRank}{dragonSuit} (Value {previewDragonCard.value})
                        </span>
                      </div>

                      {/* Suits */}
                      <div className="grid grid-cols-4 gap-2">
                        {SUITS.map((s) => {
                          const isRed = s === '♥' || s === '♦';
                          return (
                            <button
                              key={s}
                              onClick={() => setDragonSuit(s)}
                              className={`py-2 rounded-lg border text-base font-bold transition cursor-pointer ${
                                dragonSuit === s
                                  ? 'bg-sky-600/25 border-sky-400 text-white'
                                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                              } ${isRed ? 'text-rose-400' : 'text-slate-100'}`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>

                      {/* Ranks */}
                      <div className="grid grid-cols-7 gap-1.5">
                        {RANKS.map((r) => (
                          <button
                            key={r}
                            onClick={() => setDragonRank(r)}
                            className={`py-2 rounded-lg border text-xs font-bold font-mono transition cursor-pointer ${
                              dragonRank === r
                                ? 'bg-sky-500 text-slate-950 border-sky-300'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tiger Card Picker */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                          2. Tiger Card
                        </span>
                        <span className="text-xs font-mono text-slate-300">
                          Selected: {tigerRank}{tigerSuit} (Value {previewTigerCard.value})
                        </span>
                      </div>

                      {/* Suits */}
                      <div className="grid grid-cols-4 gap-2">
                        {SUITS.map((s) => {
                          const isRed = s === '♥' || s === '♦';
                          return (
                            <button
                              key={s}
                              onClick={() => setTigerSuit(s)}
                              className={`py-2 rounded-lg border text-base font-bold transition cursor-pointer ${
                                tigerSuit === s
                                  ? 'bg-amber-600/25 border-amber-400 text-white'
                                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                              } ${isRed ? 'text-rose-400' : 'text-slate-100'}`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>

                      {/* Ranks */}
                      <div className="grid grid-cols-7 gap-1.5">
                        {RANKS.map((r) => (
                          <button
                            key={r}
                            onClick={() => setTigerRank(r)}
                            className={`py-2 rounded-lg border text-xs font-bold font-mono transition cursor-pointer ${
                              tigerRank === r
                                ? 'bg-amber-500 text-slate-950 border-amber-300'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Preview & Action Bar */}
                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <MiniCardPreview label="Dragon" card={previewDragonCard} />
                      <div className="text-center">
                        <div className="text-[11px] text-slate-400">Outcome Preview</div>
                        <div
                          className={`text-sm font-black uppercase mt-0.5 ${
                            previewWinner === 'DRAGON'
                              ? 'text-sky-400'
                              : previewWinner === 'TIGER'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {previewWinner} WINS
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {previewDragonCard.value} vs {previewTigerCard.value}
                        </div>
                      </div>
                      <MiniCardPreview label="Tiger" card={previewTigerCard} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        onClick={() => {
                          gameStore.addToCardQueue(previewDragonCard, previewTigerCard);
                          notify(
                            `Added to Queue: Dragon ${previewDragonCard.rank}${previewDragonCard.suit} vs Tiger ${previewTigerCard.rank}${previewTigerCard.suit}`
                          );
                        }}
                        className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                      >
                        + Add to Round Queue
                      </button>

                      <button
                        onClick={() => {
                          gameStore.setExactNextCards(
                            previewDragonCard,
                            previewTigerCard
                          );
                          notify(
                            `Next 1 Round Locked: Dragon ${previewDragonCard.rank}${previewDragonCard.suit} vs Tiger ${previewTigerCard.rank}${previewTigerCard.suit} (${previewWinner})`
                          );
                        }}
                        className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wide cursor-pointer whitespace-nowrap"
                      >
                        Set Exact Cards (Next 1 Round)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Queued Rounds + Last Dealt Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">
                        Upcoming Rounds Queue ({cardControl.queue.length})
                      </h3>
                      {cardControl.queue.length > 0 && (
                        <button
                          onClick={() => {
                            gameStore.clearCardQueue();
                            notify('Cleared card queue');
                          }}
                          className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                        >
                          Clear Queue
                        </button>
                      )}
                    </div>
                    {cardControl.queue.length === 0 ? (
                      <p className="text-xs text-slate-500 py-5 text-center">
                        No rounds queued. Use "+ Add to Round Queue" to pre-schedule multiple rounds.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-800">
                        {cardControl.queue.map((item, idx) => (
                          <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3 font-mono">
                              <span className="text-slate-500">+{idx + 1}</span>
                              <span className="text-white font-semibold">{item.label}</span>
                              <span className="text-amber-400">{item.forcedWinner}</span>
                            </div>
                            <button
                              onClick={() => gameStore.removeFromCardQueue(item.id)}
                              className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                              aria-label="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-bold text-white">Last Dealt Verification</h3>
                    {cardControl.lastDealt ? (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Round</span>
                          <span className="font-mono text-white">#{cardControl.lastDealt.roundNumber}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Dealt Cards</span>
                          <span className="font-mono font-bold text-white">
                            Dragon {cardControl.lastDealt.dragonCard.rank}
                            {cardControl.lastDealt.dragonCard.suit} vs Tiger{' '}
                            {cardControl.lastDealt.tigerCard.rank}
                            {cardControl.lastDealt.tigerCard.suit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Winner</span>
                          <span className="font-mono font-bold text-amber-300">
                            {cardControl.lastDealt.winner}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Deal Mode</span>
                          <span className="font-mono text-emerald-400">{cardControl.lastDealt.source}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-5 text-center">
                        Waiting for first round deal.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ================= 3. USERS MANAGEMENT TAB ================= */}
            {activeTab === 'USERS' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white">Users Management</h2>
                    <p className="text-xs text-slate-400">
                      Add, edit, adjust balance, ban/activate, switch active player, or remove users.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search name, ID, phone..."
                        className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <button
                      onClick={openAddUser}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add User</span>
                    </button>
                  </div>
                </div>

                {/* User Add/Edit Form */}
                {userFormOpen && (
                  <form
                    onSubmit={saveUserForm}
                    className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-amber-300">
                        {editingUser ? `Edit User: ${editingUser.name}` : 'Create New User'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setUserFormOpen(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Player Name</label>
                        <input
                          type="text"
                          required
                          value={uName}
                          onChange={(e) => setUName(e.target.value)}
                          placeholder="e.g. Bilal_Khan"
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Mobile / Phone</label>
                        <input
                          type="text"
                          value={uPhone}
                          onChange={(e) => setUPhone(e.target.value)}
                          placeholder="03001234567"
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Balance (Rs)</label>
                        <input
                          type="number"
                          min={0}
                          value={uBalance}
                          onChange={(e) => setUBalance(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">VIP Level (0–10)</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={uVip}
                          onChange={(e) => setUVip(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Status</label>
                        <select
                          value={uStatus}
                          onChange={(e) => setUStatus(e.target.value as 'Active' | 'Suspended')}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="Active">Active</option>
                          <option value="Suspended">Suspended (Blocked)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Avatar</label>
                        <div className="flex items-center gap-1">
                          {AVATAR_CHOICES.map((av) => (
                            <button
                              type="button"
                              key={av}
                              onClick={() => setUAvatar(av)}
                              className={`w-7 h-7 rounded border text-sm flex items-center justify-center cursor-pointer ${
                                uAvatar === av
                                  ? 'border-amber-400 bg-amber-500/20'
                                  : 'border-slate-700 bg-slate-950'
                              }`}
                            >
                              {av}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setUserFormOpen(false)}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                      >
                        {editingUser ? 'Save Changes' : 'Create User'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Inline Balance Editor (Add / Edit Balance for Selected Player) */}
                {balanceEditor && (() => {
                  const targetUser = users.find((u) => u.id === balanceEditor.userId);
                  if (!targetUser) return null;
                  return (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const val = Math.max(0, Math.round(Number(balanceEditorAmount) || 0));
                        if (balanceEditor.mode === 'ADD') {
                          if (val <= 0) return;
                          gameStore.adjustUserBalance(targetUser.id, val);
                          notify(`Added Rs ${val.toLocaleString()} to ${targetUser.name}`);
                        } else {
                          gameStore.setUserBalance(targetUser.id, val);
                          notify(`Updated ${targetUser.name}'s balance to Rs ${val.toLocaleString()}`);
                        }
                        setBalanceEditor(null);
                      }}
                      className="bg-slate-900 border border-emerald-500/50 rounded-xl p-4 flex flex-wrap items-end justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-emerald-300">
                          {balanceEditor.mode === 'ADD'
                            ? `Add Balance — ${targetUser.name} (Current: Rs ${targetUser.balance.toLocaleString()})`
                            : `Edit Balance — ${targetUser.name} (Current: Rs ${targetUser.balance.toLocaleString()})`}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            required
                            autoFocus
                            value={balanceEditorAmount}
                            onChange={(e) => setBalanceEditorAmount(e.target.value)}
                            className="w-44 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                            placeholder="Enter amount (Rs)"
                          />
                          {[500, 1000, 5000, 10000].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setBalanceEditorAmount(String(preset))}
                              className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-amber-300 cursor-pointer"
                            >
                              {preset.toLocaleString()}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setBalanceEditor(null)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                        >
                          {balanceEditor.mode === 'ADD' ? 'Add Balance' : 'Save Balance'}
                        </button>
                      </div>
                    </form>
                  );
                })()}

                {/* Users Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                        <th className="py-2.5 px-4">Player</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3">VIP</th>
                        <th className="py-2.5 px-3 text-right">Balance</th>
                        <th className="py-2.5 px-3">Balance Controls (Add / Edit / Del)</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-4 text-right">User Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-xs">
                      {filteredUsers.map((u) => {
                        const isCurrentPlayer = u.id === activeUser.id;
                        return (
                          <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <span className="text-base">{u.avatar}</span>
                                <div>
                                  <div className="font-semibold text-white">
                                    {u.name}
                                    {isCurrentPlayer && (
                                      <span className="ml-2 text-[10px] text-amber-400 font-bold">
                                        (Current Session)
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono">ID: {u.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-300">{u.phone}</td>
                            <td className="py-2.5 px-3 font-mono text-amber-300">VIP {u.vip}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-white tabular-nums">
                              Rs {u.balance.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setBalanceEditor({ userId: u.id, mode: 'ADD' });
                                    setBalanceEditorAmount('500');
                                  }}
                                  className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/50 text-emerald-300 hover:text-white text-[11px] font-bold cursor-pointer whitespace-nowrap"
                                  title="Add Balance"
                                >
                                  + Add
                                </button>
                                <button
                                  onClick={() => {
                                    setBalanceEditor({ userId: u.id, mode: 'EDIT' });
                                    setBalanceEditorAmount(String(u.balance));
                                  }}
                                  className="px-2 py-1 rounded bg-sky-600/20 hover:bg-sky-600 border border-sky-500/50 text-sky-300 hover:text-white text-[11px] font-bold cursor-pointer whitespace-nowrap"
                                  title="Edit Exact Balance"
                                >
                                  Edit Bal
                                </button>
                                {confirmDeleteBalanceUserId === u.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        gameStore.deleteUserBalance(u.id);
                                        setConfirmDeleteBalanceUserId(null);
                                        notify(`Deleted balance for ${u.name} (Rs 0)`);
                                      }}
                                      className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                                    >
                                      Zero
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteBalanceUserId(null)}
                                      className="px-1.5 py-1 rounded bg-slate-700 text-slate-200 text-[11px] cursor-pointer"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDeleteBalanceUserId(u.id)}
                                    className="px-2 py-1 rounded bg-rose-600/20 hover:bg-rose-600 border border-rose-500/50 text-rose-300 hover:text-white text-[11px] font-bold cursor-pointer whitespace-nowrap"
                                    title="Delete / Clear Balance to Rs 0"
                                  >
                                    Del Bal
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`font-semibold ${
                                  u.status === 'Active' ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {u.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isCurrentPlayer && (
                                  <button
                                    onClick={() => {
                                      gameStore.setActiveUser(u.id);
                                      notify(`Switched active session to ${u.name}`);
                                    }}
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-sky-600 text-sky-300 hover:text-white text-[11px] font-semibold cursor-pointer"
                                    title="Play as this user"
                                  >
                                    Switch
                                  </button>
                                )}
                                <button
                                  onClick={() => openEditUser(u)}
                                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                                  title="Edit User"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                {confirmDeleteUserId === u.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        const ok = gameStore.deleteUser(u.id);
                                        setConfirmDeleteUserId(null);
                                        if (ok) notify(`Removed user ${u.name}`);
                                        else notify('Cannot delete the last remaining user');
                                      }}
                                      className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteUserId(null)}
                                      className="px-1.5 py-1 rounded bg-slate-700 text-slate-200 text-[11px] cursor-pointer"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDeleteUserId(u.id)}
                                    className="p-1.5 rounded bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white cursor-pointer"
                                    title="Remove User"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================= 4. DEPOSITS CRUD & APPROVAL TAB ================= */}
            {activeTab === 'DEPOSITS' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Deposits Control
                    </h2>
                    <p className="text-xs text-slate-400">
                      Approve pending user deposits to credit balances, or add, edit, and delete deposit records.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={depSearch}
                        onChange={(e) => setDepSearch(e.target.value)}
                        placeholder="Search TID or User..."
                        className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <button
                      onClick={openAddDeposit}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Deposit</span>
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit">
                  {(['ALL', 'Pending', 'Completed', 'Rejected'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setDepFilter(f)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                        depFilter === f
                          ? 'bg-slate-800 text-amber-300'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f === 'ALL'
                        ? `All (${deposits.length})`
                        : `${f === 'Completed' ? 'Approved' : f} (${deposits.filter((d) => d.status === f).length})`}
                    </button>
                  ))}
                </div>

                {/* Deposit Add/Edit Form */}
                {depFormOpen && (
                  <form
                    onSubmit={saveDepositForm}
                    className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-emerald-300">
                        {editingDep ? `Edit Deposit (${editingDep.txId})` : 'Add New Deposit'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setDepFormOpen(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">User</label>
                        <select
                          value={depUserId}
                          onChange={(e) => setDepUserId(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-400"
                        >
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} (ID: {u.id} · Rs {u.balance.toLocaleString()})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Amount (Rs)</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={depAmount}
                          onChange={(e) => setDepAmount(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Method</label>
                        <select
                          value={depMethod}
                          onChange={(e) => setDepMethod(e.target.value as TransactionMethod)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-400"
                        >
                          <option value="AllBankQR">AllBankQR</option>
                          <option value="ManualAdmin">ManualAdmin</option>
                          <option value="EasyPaisa">EasyPaisa</option>
                          <option value="JazzCash">JazzCash</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">TID / Reference</label>
                        <input
                          type="text"
                          required
                          value={depTxId}
                          onChange={(e) => setDepTxId(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Status</label>
                        <select
                          value={depStatus}
                          onChange={(e) => setDepStatus(e.target.value as TransactionStatus)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-400"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed (Credited)</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Note</label>
                        <input
                          type="text"
                          value={depNote}
                          onChange={(e) => setDepNote(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setDepFormOpen(false)}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                      >
                        {editingDep ? 'Save Deposit' : 'Add Deposit'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Deposits Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
                  {filteredDeposits.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-500">
                      No deposit records match the current filter.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                          <th className="py-2.5 px-4">Player</th>
                          <th className="py-2.5 px-3">TID / Method</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-xs">
                        {filteredDeposits.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-4">
                              <div className="font-semibold text-white">{tx.userName || tx.accountTitle}</div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                ID: {tx.userId || '-'} · {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-mono text-slate-200">{tx.txId}</div>
                              <div className="text-[11px] text-slate-400">{tx.method}</div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-300 tabular-nums">
                              Rs {tx.amount.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`font-semibold ${
                                  tx.status === 'Completed'
                                    ? 'text-emerald-400'
                                    : tx.status === 'Pending'
                                    ? 'text-amber-400'
                                    : 'text-rose-400'
                                }`}
                              >
                                {tx.status === 'Completed' ? 'Approved' : tx.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center justify-end gap-1.5">
                                {tx.status !== 'Completed' && (
                                  <button
                                    onClick={() => {
                                      gameStore.approveDeposit(tx.id);
                                      notify(`Approved Deposit Rs ${tx.amount.toLocaleString()}`);
                                    }}
                                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                )}
                                {tx.status !== 'Rejected' && (
                                  <button
                                    onClick={() => {
                                      gameStore.rejectDeposit(tx.id);
                                      notify(`Rejected Deposit ${tx.txId}`);
                                    }}
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white text-[11px] font-semibold cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                )}
                                <button
                                  onClick={() => openEditDeposit(tx)}
                                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                                  title="Edit Deposit"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                {confirmDeleteDepId === tx.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        gameStore.deleteDeposit(tx.id);
                                        setConfirmDeleteDepId(null);
                                        notify('Deposit record deleted');
                                      }}
                                      className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteDepId(null)}
                                      className="px-1.5 py-1 rounded bg-slate-700 text-slate-200 text-[11px] cursor-pointer"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDeleteDepId(tx.id)}
                                    className="p-1.5 rounded bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white cursor-pointer"
                                    title="Delete Deposit"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ================= 5. WITHDRAWS CRUD & APPROVAL TAB ================= */}
            {activeTab === 'WITHDRAWS' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Withdraws Control
                    </h2>
                    <p className="text-xs text-slate-400">
                      Approve EasyPaisa & JazzCash payouts, reject & refund to player balance, or add/edit/delete records.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={wthSearch}
                        onChange={(e) => setWthSearch(e.target.value)}
                        placeholder="Search user or phone..."
                        className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <button
                      onClick={openAddWithdraw}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Withdraw</span>
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit">
                  {(['ALL', 'Pending', 'Completed', 'Rejected'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setWthFilter(f)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                        wthFilter === f
                          ? 'bg-slate-800 text-amber-300'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f === 'ALL'
                        ? `All (${withdraws.length})`
                        : `${f === 'Completed' ? 'Approved' : f} (${withdraws.filter((w) => w.status === f).length})`}
                    </button>
                  ))}
                </div>

                {/* Withdraw Add/Edit Form */}
                {wthFormOpen && (
                  <form
                    onSubmit={saveWithdrawForm}
                    className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-amber-300">
                        {editingWth ? `Edit Withdraw (${editingWth.txId})` : 'Add New Withdraw'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setWthFormOpen(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">User</label>
                        <select
                          value={wthUserId}
                          onChange={(e) => setWthUserId(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                        >
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} (ID: {u.id} · Rs {u.balance.toLocaleString()})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Amount (Rs)</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={wthAmount}
                          onChange={(e) => setWthAmount(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Channel</label>
                        <select
                          value={wthMethod}
                          onChange={(e) => setWthMethod(e.target.value as 'EasyPaisa' | 'JazzCash')}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="EasyPaisa">EasyPaisa</option>
                          <option value="JazzCash">JazzCash</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Account Title</label>
                        <input
                          type="text"
                          required
                          value={wthTitle}
                          onChange={(e) => setWthTitle(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Account Mobile Number</label>
                        <input
                          type="text"
                          required
                          value={wthNumber}
                          onChange={(e) => setWthNumber(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Status</label>
                        <select
                          value={wthStatus}
                          onChange={(e) => setWthStatus(e.target.value as TransactionStatus)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed (Paid)</option>
                          <option value="Rejected">Rejected (Refunded)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setWthFormOpen(false)}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                      >
                        {editingWth ? 'Save Withdraw' : 'Add Withdraw'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Withdraws Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
                  {filteredWithdraws.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-500">
                      No withdraw records match the current filter.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                          <th className="py-2.5 px-4">Player</th>
                          <th className="py-2.5 px-3">Channel / Account</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-xs">
                        {filteredWithdraws.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-4">
                              <div className="font-semibold text-white">{tx.userName || tx.accountTitle}</div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {tx.txId} · {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-200">
                                {tx.method} · {tx.accountTitle}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400">{tx.accountNumber}</div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300 tabular-nums">
                              Rs {tx.amount.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`font-semibold ${
                                  tx.status === 'Completed'
                                    ? 'text-emerald-400'
                                    : tx.status === 'Pending'
                                    ? 'text-amber-400'
                                    : 'text-rose-400'
                                }`}
                              >
                                {tx.status === 'Completed' ? 'Approved' : tx.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center justify-end gap-1.5">
                                {tx.status !== 'Completed' && (
                                  <button
                                    onClick={() => {
                                      gameStore.approveWithdraw(tx.id);
                                      notify(`Approved Withdraw Rs ${tx.amount.toLocaleString()}`);
                                    }}
                                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                )}
                                {tx.status !== 'Rejected' && (
                                  <button
                                    onClick={() => {
                                      gameStore.rejectWithdraw(tx.id);
                                      notify(`Rejected & refunded Rs ${tx.amount.toLocaleString()}`);
                                    }}
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white text-[11px] font-semibold cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                )}
                                <button
                                  onClick={() => openEditWithdraw(tx)}
                                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                                  title="Edit Withdraw"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                {confirmDeleteWthId === tx.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        gameStore.deleteWithdraw(tx.id);
                                        setConfirmDeleteWthId(null);
                                        notify('Withdraw record deleted');
                                      }}
                                      className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteWthId(null)}
                                      className="px-1.5 py-1 rounded bg-slate-700 text-slate-200 text-[11px] cursor-pointer"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDeleteWthId(tx.id)}
                                    className="p-1.5 rounded bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white cursor-pointer"
                                    title="Delete Withdraw"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ================= 6. SETTINGS TAB ================= */}
            {activeTab === 'SETTINGS' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-lg font-bold text-white">Admin Console Settings</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure approval workflow and Admin PIN security.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-white">
                        Game Language
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Game interface language is set strictly to English.
                      </div>
                    </div>
                    <span className="px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 whitespace-nowrap">
                      English (Only)
                    </span>
                  </div>

                  <div className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-white">
                        Deposit Admin Approval
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        All player deposit requests remain Pending until manually approved by Admin.
                      </div>
                    </div>
                    <span className="px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 whitespace-nowrap">
                      Admin Approval Required (ON)
                    </span>
                  </div>

                  <div className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-white">
                        Withdraw Admin Approval
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        All user withdraw requests strictly stay Pending until approved by Admin.
                      </div>
                    </div>
                    <span className="px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 whitespace-nowrap">
                      Admin Approval Required (ON)
                    </span>
                  </div>

                  <div className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-white">Admin PIN Lock</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Require a PIN code whenever opening the Admin Panel.
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        gameStore.updateSettings({ adminPinEnabled: !settings.adminPinEnabled });
                        notify(
                          !settings.adminPinEnabled ? 'Admin PIN Lock enabled' : 'Admin PIN Lock disabled'
                        );
                      }}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                        settings.adminPinEnabled
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {settings.adminPinEnabled ? 'PIN Lock ON' : 'PIN Lock OFF'}
                    </button>
                  </div>

                  <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-white">Change Admin PIN</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Current PIN: <span className="font-mono text-amber-300">{settings.adminPin}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        placeholder="New PIN"
                        className="w-28 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                      />
                      <button
                        onClick={() => {
                          if (!newPinInput.trim()) return;
                          gameStore.updateSettings({ adminPin: newPinInput.trim() });
                          notify('Admin PIN updated');
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                      >
                        Update PIN
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

const StatBox: React.FC<{
  label: string;
  value: string;
  sub: string;
  highlight?: 'default' | 'amber' | 'emerald';
}> = ({ label, value, sub, highlight = 'default' }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
    <div className="text-xs text-slate-400">{label}</div>
    <div
      className={`text-lg font-bold font-mono tabular-nums mt-1 ${
        highlight === 'amber'
          ? 'text-amber-300'
          : highlight === 'emerald'
          ? 'text-emerald-400'
          : 'text-white'
      }`}
    >
      {value}
    </div>
    <div className="text-[11px] text-slate-500 mt-1 font-mono truncate">{sub}</div>
  </div>
);

const MiniCardPreview: React.FC<{ label: string; card: Card }> = ({ label, card }) => {
  const isRed = card.color === 'red';
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-bold uppercase text-slate-400">{label}</span>
      <div className="w-12 h-16 rounded-lg bg-white border-2 border-slate-300 shadow flex flex-col items-center justify-between p-1">
        <span className={`text-xs font-black leading-none self-start ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
          {card.rank}
        </span>
        <span className={`text-lg leading-none ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
          {card.suit}
        </span>
        <span className={`text-[10px] font-black leading-none self-end ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
          {card.rank}
        </span>
      </div>
    </div>
  );
};

const ArrowDownIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V8m0 0l-4 4m4-4l4 4M4 4h16" />
  </svg>
);
