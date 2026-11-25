import {
  AdminSettings,
  AppLanguage,
  BettingOption,
  Card,
  CardControlState,
  CardOverrideRule,
  LiveRoundTelemetry,
  ManagedUser,
  Transaction,
  TransactionMethod,
  TransactionStatus,
  UserProfile,
} from '../types/game';
import { createDeck, determineWinner, drawCard, generateCardsForWinner } from './cardDeck';

const KEYS = {
  ACTIVE_USER_ID: '3patti_active_user_id',
  IS_AUTHENTICATED: '3patti_is_authenticated',
  LEGACY_USER_PROFILE: '3patti_user_profile',
  ADMIN_USERS: '3patti_admin_users',
  TRANSACTIONS: '3patti_transactions',
  CARD_CONTROL: '3patti_card_control',
  ADMIN_SETTINGS: '3patti_admin_settings',
  LIVE_TELEMETRY: '3patti_live_telemetry',
  STRATEGY_STATE: '3patti_strategy_state',
  LANGUAGE: '3patti_language',
  ROUND_CLOCK_EPOCH: '3patti_round_clock_epoch',
};

const CHANNEL_NAME = 'tiger_dragon_admin_sync_v1';

const DEFAULT_SETTINGS: AdminSettings = {
  autoPayDeposits: false,
  manualApprovalRequired: true,
  adminPinEnabled: false,
  adminPin: '1234',
  minDeposit: 300,
  minWithdraw: 500,
  language: 'en',
};

const DEFAULT_CARD_CONTROL: CardControlState = {
  activeOverride: null,
  queue: [],
  autoHouseProfit: false,
  smartStrategyEnabled: true,
  lastDealt: null,
};

export interface StrategyCycleState {
  cycleBetCount: number;
  cycleWinCount: number;
  cycleMaxWins: 1;
  recentBets: number[];
  totalStaked: number;
  totalPaidOut: number;
  totalBetsCount: number;
  totalWinsCount: number;
  winStreak: number;
  bestStreak: number;
}

const DEFAULT_STRATEGY_STATE: StrategyCycleState = {
  cycleBetCount: 0,
  cycleWinCount: 0,
  cycleMaxWins: 1,
  recentBets: [],
  totalStaked: 0,
  totalPaidOut: 0,
  totalBetsCount: 0,
  totalWinsCount: 0,
  winStreak: 0,
  bestStreak: 0,
};

const DEFAULT_TELEMETRY: LiveRoundTelemetry = {
  roundNumber: 1042,
  phase: 'BETTING',
  timer: 15,
  userBets: { DRAGON: 0, TIE: 0, TIGER: 0 },
  tableTotals: { DRAGON: 0, TIE: 0, TIGER: 0 },
  updatedAt: Date.now(),
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function createInitialUsers(): ManagedUser[] {
  const existingUsers = safeParse<ManagedUser[] | null>(
    localStorage.getItem(KEYS.ADMIN_USERS),
    null
  );
  if (existingUsers && Array.isArray(existingUsers) && existingUsers.length > 0) {
    const cleaned = existingUsers
      .filter((u): u is ManagedUser => Boolean(u && typeof u === 'object' && u.id))
      .map((u) => ({
        ...u,
        id: String(u.id),
        name: typeof u.name === 'string' && u.name.trim() ? u.name : 'Player',
        phone: typeof u.phone === 'string' ? u.phone : '03000000000',
        avatar: typeof u.avatar === 'string' && u.avatar && !u.avatar.startsWith('/') ? u.avatar : '😎',
        balance: Number.isFinite(Number(u.balance)) ? Math.max(0, Number(u.balance)) : 1500,
        bonus: Number.isFinite(Number(u.bonus)) ? Math.max(0, Number(u.bonus)) : 0,
        vip: Number.isFinite(Number(u.vip)) ? Math.max(0, Number(u.vip)) : 0,
        status: (u.status === 'Suspended' ? 'Suspended' : 'Active') as 'Active' | 'Suspended',
        todayBonusClaimed: Boolean(u.todayBonusClaimed),
        createdAt: Number.isFinite(Number(u.createdAt)) ? Number(u.createdAt) : Date.now(),
      }));
    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  const legacyProfile = safeParse<UserProfile | null>(
    localStorage.getItem(KEYS.LEGACY_USER_PROFILE),
    null
  );

  const primaryUser: ManagedUser = {
    id: legacyProfile?.id || '4811551',
    name: legacyProfile?.name || 'Guest4',
    phone: legacyProfile?.phone || '03048921102',
    avatar: legacyProfile?.avatar && legacyProfile.avatar.startsWith('/') ? '👓' : (legacyProfile?.avatar || '👓'),
    balance: typeof legacyProfile?.balance === 'number' ? legacyProfile.balance : 1500,
    bonus: typeof legacyProfile?.bonus === 'number' ? legacyProfile.bonus : 1000000,
    vip: typeof legacyProfile?.vip === 'number' ? legacyProfile.vip : 0,
    status: legacyProfile?.status || 'Active',
    todayBonusClaimed: Boolean(legacyProfile?.todayBonusClaimed),
    createdAt: Date.now() - 86400000 * 5,
  };

  const seededUsers: ManagedUser[] = [
    primaryUser,
    {
      id: '7821904',
      name: 'Ali_Hassan',
      phone: '03124567890',
      avatar: '🧔',
      balance: 14500,
      bonus: 50000,
      vip: 3,
      status: 'Active',
      todayBonusClaimed: false,
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: '9034112',
      name: 'LaibaBasit',
      phone: '03459876543',
      avatar: '👸',
      balance: 48200,
      bonus: 250000,
      vip: 6,
      status: 'Active',
      todayBonusClaimed: true,
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: '5520183',
      name: 'Rana_Farooq',
      phone: '03217788990',
      avatar: '👑',
      balance: 8900,
      bonus: 15000,
      vip: 2,
      status: 'Active',
      todayBonusClaimed: false,
      createdAt: Date.now() - 86400000,
    },
  ];

  localStorage.setItem(KEYS.ADMIN_USERS, JSON.stringify(seededUsers));
  localStorage.setItem(KEYS.ACTIVE_USER_ID, primaryUser.id);
  return seededUsers;
}

function createInitialTransactions(): Transaction[] {
  const existing = safeParse<Transaction[] | null>(
    localStorage.getItem(KEYS.TRANSACTIONS),
    null
  );
  if (existing && Array.isArray(existing) && existing.length > 0) {
    // Ensure userId / userName exist on legacy transactions
    return existing.map((tx) => ({
      ...tx,
      userId: tx.userId || '4811551',
      userName: tx.userName || tx.accountTitle || 'Guest4',
    }));
  }

  const seeded: Transaction[] = [
    {
      id: 'tx_pending_dep_1',
      userId: '7821904',
      userName: 'Ali_Hassan',
      type: 'DEPOSIT',
      amount: 2000,
      method: 'AllBankQR',
      accountTitle: 'Ali Hassan',
      accountNumber: '03124567890',
      status: 'Pending',
      timestamp: Date.now() - 240000,
      txId: 'QR99401285',
      note: 'Raast All Bank QR Payment',
    },
    {
      id: 'tx_pending_wth_1',
      userId: '9034112',
      userName: 'LaibaBasit',
      type: 'WITHDRAW',
      amount: 3500,
      method: 'EasyPaisa',
      accountTitle: 'Laiba Basit',
      accountNumber: '03459876543',
      status: 'Pending',
      timestamp: Date.now() - 480000,
      txId: 'WTH77291034',
      note: 'Cashout Request',
    },
    {
      id: 'tx_seed_1',
      userId: '4811551',
      userName: 'Guest4',
      type: 'DEPOSIT',
      amount: 2000,
      method: 'AllBankQR',
      accountTitle: 'Muhammad Shoaib',
      accountNumber: '03048921102',
      status: 'Completed',
      timestamp: Date.now() - 3600000,
      txId: 'TXN84910245',
    },
    {
      id: 'tx_seed_2',
      userId: '4811551',
      userName: 'Guest4',
      type: 'WITHDRAW',
      amount: 500,
      method: 'JazzCash',
      accountTitle: 'Muhammad Shoaib',
      accountNumber: '03048921102',
      status: 'Completed',
      timestamp: Date.now() - 1800000,
      txId: 'TXN91823741',
    },
  ];

  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(seeded));
  return seeded;
}

class GameStore {
  private listeners = new Set<() => void>();
  private telemetryListeners = new Set<() => void>();
  private channel: BroadcastChannel | null = null;

  constructor() {
    // Ensure initial storage is seeded
    createInitialUsers();
    createInitialTransactions();

    if (typeof window !== 'undefined') {
      if ('BroadcastChannel' in window) {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          const kind = (event?.data as { kind?: string } | undefined)?.kind;
          if (kind === 'telemetry') {
            this.notifyTelemetryListeners();
          } else {
            this.notifyLocalListeners();
          }
        };
      }
      window.addEventListener('storage', (e) => {
        if (!e.key) return;
        if (e.key === KEYS.LIVE_TELEMETRY) {
          this.notifyTelemetryListeners();
        } else if (Object.values(KEYS).includes(e.key)) {
          this.notifyLocalListeners();
        }
      });
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeTelemetry(listener: () => void): () => void {
    this.telemetryListeners.add(listener);
    return () => {
      this.telemetryListeners.delete(listener);
    };
  }

  private notifyLocalListeners() {
    this.listeners.forEach((fn) => fn());
  }

  private notifyTelemetryListeners() {
    this.telemetryListeners.forEach((fn) => fn());
  }

  private broadcastChange() {
    this.notifyLocalListeners();
    try {
      this.channel?.postMessage({ kind: 'store', ts: Date.now() });
    } catch {
      // ignore
    }
  }

  // ==================== USERS ====================
  public getUsers(): ManagedUser[] {
    return createInitialUsers();
  }

  public getActiveUserId(): string {
    const users = this.getUsers();
    const savedId = localStorage.getItem(KEYS.ACTIVE_USER_ID);
    if (savedId && users.some((u) => u.id === savedId)) {
      return savedId;
    }
    return users[0]?.id || '4811551';
  }

  public getActiveUser(): UserProfile {
    const users = this.getUsers();
    const activeId = this.getActiveUserId();
    const found = users.find((u) => u.id === activeId) || users[0];
    return {
      id: found.id,
      name: found.name,
      avatar: found.avatar,
      balance: found.balance,
      bonus: found.bonus,
      vip: found.vip,
      todayBonusClaimed: found.todayBonusClaimed,
      status: found.status,
      phone: found.phone,
    };
  }

  private saveUsers(users: ManagedUser[]) {
    localStorage.setItem(KEYS.ADMIN_USERS, JSON.stringify(users));
    // Keep legacy key synced for active user
    const activeId = this.getActiveUserId();
    const active = users.find((u) => u.id === activeId) || users[0];
    if (active) {
      localStorage.setItem(KEYS.LEGACY_USER_PROFILE, JSON.stringify(active));
    }
    this.broadcastChange();
  }

  public setActiveUser(userId: string) {
    const users = this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    localStorage.setItem(KEYS.ACTIVE_USER_ID, target.id);
    localStorage.setItem(KEYS.LEGACY_USER_PROFILE, JSON.stringify(target));
    this.broadcastChange();
  }

  // ==================== AUTHENTICATION (SIGN IN & CREATE ACCOUNT) ====================
  public isAuthenticated(): boolean {
    return localStorage.getItem(KEYS.IS_AUTHENTICATED) === 'true';
  }

  public signOut() {
    localStorage.removeItem(KEYS.IS_AUTHENTICATED);
    this.broadcastChange();
  }

  public signIn(
    identifier: string,
    password: string
  ): { ok: boolean; error?: string; user?: ManagedUser } {
    const isUr = this.getLanguage() === 'ur';
    const query = identifier.trim().toLowerCase();
    if (!query || !password.trim()) {
      return {
        ok: false,
        error: isUr
          ? 'براہ کرم موبائل نمبر/نام اور پاس ورڈ درج کریں۔'
          : 'Please enter your mobile number/username and password.',
      };
    }
    const users = this.getUsers();
    const found = users.find(
      (u) =>
        u.phone.trim().toLowerCase() === query ||
        u.name.trim().toLowerCase() === query ||
        u.id === query
    );
    if (!found) {
      return {
        ok: false,
        error: isUr
          ? 'اس نمبر یا نام سے کوئی اکاؤنٹ موجود نہیں ہے۔ نیا اکاؤنٹ بنائیں۔'
          : 'No account found with that mobile number or name. Please create an account.',
      };
    }
    if (found.status === 'Suspended') {
      return {
        ok: false,
        error: isUr
          ? 'آپ کا اکاؤنٹ ایڈمن کی طرف سے معطل (Suspended) ہے۔'
          : 'Your account has been suspended by Admin.',
      };
    }
    const savedPass = found.password || '123456';
    if (password.trim() !== savedPass) {
      return {
        ok: false,
        error: isUr
          ? 'پاس ورڈ غلط ہے! دوبارہ چیک کریں۔'
          : 'Incorrect password! Please try again.',
      };
    }
    localStorage.setItem(KEYS.ACTIVE_USER_ID, found.id);
    localStorage.setItem(KEYS.IS_AUTHENTICATED, 'true');
    localStorage.setItem(KEYS.LEGACY_USER_PROFILE, JSON.stringify(found));
    this.broadcastChange();
    return { ok: true, user: found };
  }

  public registerUser(input: {
    name: string;
    phone: string;
    password: string;
    referredBy?: string;
  }): { ok: boolean; error?: string; user?: ManagedUser } {
    const isUr = this.getLanguage() === 'ur';
    const cleanName = input.name.trim();
    const cleanPhone = input.phone.trim();
    const cleanPass = input.password.trim();

    if (cleanName.length < 2) {
      return {
        ok: false,
        error: isUr
          ? 'براہ کرم کم از کم 2 حروف کا درست نام درج کریں۔'
          : 'Please enter a valid name (at least 2 characters).',
      };
    }
    if (cleanPhone.length < 10) {
      return {
        ok: false,
        error: isUr
          ? 'براہ کرم درست 11 ہندسوں کا موبائل نمبر درج کریں۔'
          : 'Please enter a valid mobile number (at least 10 digits).',
      };
    }
    if (cleanPass.length < 4) {
      return {
        ok: false,
        error: isUr
          ? 'پاس ورڈ کم از کم 4 حروف کا ہونا چاہیے۔'
          : 'Password must be at least 4 characters long.',
      };
    }

    const users = this.getUsers();
    const duplicate = users.find(
      (u) =>
        u.phone.trim() === cleanPhone ||
        u.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicate) {
      return {
        ok: false,
        error: isUr
          ? 'یہ موبائل نمبر یا نام پہلے سے رجسٹرڈ ہے۔ براہ کرم Sign In کریں۔'
          : 'This mobile number or username is already registered. Please Sign In.',
      };
    }

    const refCode = input.referredBy?.trim();
    const validReferrer = refCode ? users.find((u) => u.id === refCode) : undefined;

    // New user receives Rs 20 welcome signup bonus!
    const newUser: ManagedUser = {
      id: String(Math.floor(1000000 + Math.random() * 8999999)),
      name: cleanName,
      phone: cleanPhone,
      password: cleanPass,
      avatar: '😎',
      balance: 20,
      bonus: 20,
      vip: 0,
      status: 'Active',
      todayBonusClaimed: true,
      referredBy: validReferrer?.id,
      createdAt: Date.now(),
    };

    const nextUsers = [newUser, ...users];
    localStorage.setItem(KEYS.ACTIVE_USER_ID, newUser.id);
    localStorage.setItem(KEYS.IS_AUTHENTICATED, 'true');
    this.saveUsers(nextUsers);

    // Record Rs 20 signup bonus transaction
    const signupTx: Transaction = {
      id: 'tx_signup_' + Date.now(),
      userId: newUser.id,
      userName: newUser.name,
      type: 'BET_WIN',
      amount: 20,
      method: 'ManualAdmin',
      accountTitle: 'New Account Bonus (+Rs 20)',
      accountNumber: newUser.phone,
      status: 'Completed',
      timestamp: Date.now(),
      txId: 'NEW' + Math.floor(100000 + Math.random() * 900000),
      note: 'Welcome New User Bonus Rs 20',
    };
    const txs = this.getTransactions();
    this.saveTransactions([signupTx, ...txs]);

    return { ok: true, user: newUser };
  }

  public updateActiveUser(updated: Partial<UserProfile>) {
    const activeId = this.getActiveUserId();
    this.updateUser(activeId, updated);
  }

  public adjustActiveUserBalance(delta: number) {
    const activeId = this.getActiveUserId();
    this.adjustUserBalance(activeId, delta);
  }

  public addUser(input: {
    name: string;
    phone: string;
    balance: number;
    vip?: number;
    avatar?: string;
    status?: 'Active' | 'Suspended';
  }): ManagedUser {
    const users = this.getUsers();
    const newUser: ManagedUser = {
      id: String(Math.floor(1000000 + Math.random() * 8999999)),
      name: input.name.trim() || 'Player',
      phone: input.phone.trim() || '03000000000',
      avatar: input.avatar || '😎',
      balance: Math.max(0, Number(input.balance) || 0),
      bonus: 100000,
      vip: Math.max(0, Math.min(10, Number(input.vip) || 0)),
      status: input.status || 'Active',
      todayBonusClaimed: false,
      createdAt: Date.now(),
    };
    this.saveUsers([newUser, ...users]);
    return newUser;
  }

  public updateUser(userId: string, updates: Partial<ManagedUser>) {
    const users = this.getUsers();
    const next = users.map((u) => {
      if (u.id !== userId) return u;
      return {
        ...u,
        ...updates,
        balance: updates.balance !== undefined ? Math.max(0, Number(updates.balance)) : u.balance,
      };
    });
    this.saveUsers(next);
  }

  public adjustUserBalance(userId: string, delta: number) {
    const users = this.getUsers();
    const next = users.map((u) => {
      if (u.id !== userId) return u;
      return {
        ...u,
        balance: Math.max(0, Math.round(u.balance + delta)),
      };
    });
    this.saveUsers(next);
  }

  public setUserBalance(userId: string, newBalance: number) {
    const users = this.getUsers();
    const next = users.map((u) => {
      if (u.id !== userId) return u;
      return {
        ...u,
        balance: Math.max(0, Math.round(Number(newBalance) || 0)),
      };
    });
    this.saveUsers(next);
  }

  public deleteUserBalance(userId: string) {
    this.setUserBalance(userId, 0);
  }

  public deleteUser(userId: string): boolean {
    const users = this.getUsers();
    if (users.length <= 1) return false; // Always retain at least 1 user
    const next = users.filter((u) => u.id !== userId);
    if (localStorage.getItem(KEYS.ACTIVE_USER_ID) === userId && next[0]) {
      localStorage.setItem(KEYS.ACTIVE_USER_ID, next[0].id);
    }
    this.saveUsers(next);
    return true;
  }

  // ==================== TRANSACTIONS (DEPOSIT & WITHDRAW) ====================
  public getTransactions(): Transaction[] {
    return createInitialTransactions();
  }

  private saveTransactions(txs: Transaction[]) {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txs));
    this.broadcastChange();
  }

  public submitDeposit(
    amount: number,
    method: TransactionMethod,
    txId: string,
    userId?: string
  ): { tx: Transaction; status: TransactionStatus } {
    const users = this.getUsers();
    const targetUser = users.find((u) => u.id === (userId || this.getActiveUserId())) || users[0];
    // Deposits ALWAYS start as Pending and require Admin Approval before balance is credited
    const status: TransactionStatus = 'Pending';

    const newTx: Transaction = {
      id: 'tx_dep_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      userId: targetUser.id,
      userName: targetUser.name,
      type: 'DEPOSIT',
      amount,
      method,
      accountTitle: targetUser.name,
      accountNumber: targetUser.phone || '03048921102',
      status,
      timestamp: Date.now(),
      txId,
      note: 'Awaiting Admin Approval',
    };

    const txs = this.getTransactions();
    this.saveTransactions([newTx, ...txs]);
    return { tx: newTx, status };
  }

  public creditReferralShareBonus(referrerId: string, baseAmount: number, reason?: string): number {
    const bonus = Math.max(1, Math.round(baseAmount * 0.07));
    const users = this.getUsers();
    const referrer = users.find((u) => u.id === referrerId);
    if (!referrer) return 0;

    this.adjustUserBalance(referrer.id, bonus);
    const bonusTx: Transaction = {
      id: 'tx_ref7_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      userId: referrer.id,
      userName: referrer.name,
      type: 'BET_WIN',
      amount: bonus,
      method: 'ManualAdmin',
      accountTitle: reason || '7% Share Bonus',
      accountNumber: `7% of Rs ${baseAmount}`,
      status: 'Completed',
      timestamp: Date.now(),
      txId: 'SHR7' + Math.floor(100000 + Math.random() * 900000),
      note: '7% Share & Referral Bonus',
    };
    const txs = this.getTransactions();
    this.saveTransactions([bonusTx, ...txs]);
    return bonus;
  }

  public submitWithdraw(
    amount: number,
    method: 'EasyPaisa' | 'JazzCash',
    accountTitle: string,
    accountNumber: string,
    userId?: string
  ): { ok: boolean; status?: TransactionStatus; tx?: Transaction } {
    const users = this.getUsers();
    const targetUser = users.find((u) => u.id === (userId || this.getActiveUserId())) || users[0];
    if (!targetUser || targetUser.balance < amount) {
      return { ok: false };
    }

    // Withdraws ALWAYS require Admin Approval before completion
    const status: TransactionStatus = 'Pending';

    // Hold amount from playable balance until admin approves or rejects (refunded on reject)
    this.adjustUserBalance(targetUser.id, -amount);

    const newTx: Transaction = {
      id: 'tx_wth_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      userId: targetUser.id,
      userName: targetUser.name,
      type: 'WITHDRAW',
      amount,
      method,
      accountTitle,
      accountNumber,
      status,
      timestamp: Date.now(),
      txId: 'WTH' + Math.floor(10000000 + Math.random() * 90000000),
      note: 'Awaiting Admin Approval',
    };

    const txs = this.getTransactions();
    this.saveTransactions([newTx, ...txs]);
    return { ok: true, status, tx: newTx };
  }

  public recordBetWinTransaction(amount: number, roundNumber: number, winner: BettingOption) {
    const active = this.getActiveUser();
    const winTx: Transaction = {
      id: 'tx_win_' + Date.now(),
      userId: active.id,
      userName: active.name,
      type: 'BET_WIN',
      amount,
      method: 'ManualAdmin',
      accountTitle: 'Game Winnings',
      accountNumber: `Round #${roundNumber} (${winner})`,
      status: 'Completed',
      timestamp: Date.now(),
      txId: 'WIN' + Math.floor(10000000 + Math.random() * 90000000),
    };
    const txs = this.getTransactions();
    this.saveTransactions([winTx, ...txs]);
  }

  // ---- Admin Deposit CRUD ----
  public approveDeposit(id: string) {
    const txs = this.getTransactions();
    const target = txs.find((t) => t.id === id && t.type === 'DEPOSIT');
    if (!target || target.status === 'Completed') return;

    if (target.userId) {
      this.adjustUserBalance(target.userId, target.amount);
      const users = this.getUsers();
      const depositor = users.find((u) => u.id === target.userId);
      if (depositor?.referredBy && target.note !== 'Approved by Admin') {
        this.creditReferralShareBonus(
          depositor.referredBy,
          target.amount,
          `7% Share Bonus (${depositor.name} Deposit)`
        );
      }
    }

    const latestTxs = this.getTransactions();
    const next = latestTxs.map((t) =>
      t.id === id ? { ...t, status: 'Completed' as const, note: 'Approved by Admin' } : t
    );
    this.saveTransactions(next);
  }

  public rejectDeposit(id: string) {
    const txs = this.getTransactions();
    const target = txs.find((t) => t.id === id && t.type === 'DEPOSIT');
    if (!target || target.status === 'Rejected') return;

    if (target.status === 'Completed' && target.userId) {
      this.adjustUserBalance(target.userId, -target.amount);
    }

    const next = txs.map((t) =>
      t.id === id ? { ...t, status: 'Rejected' as const, note: 'Rejected by Admin' } : t
    );
    this.saveTransactions(next);
  }

  public addAdminDeposit(input: {
    userId: string;
    amount: number;
    method: TransactionMethod;
    txId: string;
    status: 'Pending' | 'Completed' | 'Rejected';
    note?: string;
  }) {
    const users = this.getUsers();
    const user = users.find((u) => u.id === input.userId) || users[0];
    const amount = Math.max(1, Number(input.amount) || 0);

    const newTx: Transaction = {
      id: 'tx_dep_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      userId: user.id,
      userName: user.name,
      type: 'DEPOSIT',
      amount,
      method: input.method,
      accountTitle: user.name,
      accountNumber: user.phone || '03048921102',
      status: input.status,
      timestamp: Date.now(),
      txId: input.txId.trim() || 'ADM' + Math.floor(10000000 + Math.random() * 90000000),
      note: input.note || 'Added by Admin',
    };

    if (input.status === 'Completed') {
      this.adjustUserBalance(user.id, amount);
    }

    const txs = this.getTransactions();
    this.saveTransactions([newTx, ...txs]);
  }

  public editDeposit(
    id: string,
    updates: {
      userId?: string;
      amount?: number;
      method?: TransactionMethod;
      txId?: string;
      status?: TransactionStatus;
      note?: string;
    }
  ) {
    const txs = this.getTransactions();
    const oldTx = txs.find((t) => t.id === id && t.type === 'DEPOSIT');
    if (!oldTx) return;

    const users = this.getUsers();
    const newUserId = updates.userId || oldTx.userId || users[0]?.id;
    const newUser = users.find((u) => u.id === newUserId);
    const newAmount = updates.amount !== undefined ? Math.max(0, Number(updates.amount)) : oldTx.amount;
    const newStatus = updates.status || oldTx.status;

    const oldCredit = oldTx.status === 'Completed' ? oldTx.amount : 0;
    const newCredit = newStatus === 'Completed' ? newAmount : 0;

    if (oldTx.userId && oldCredit > 0) {
      this.adjustUserBalance(oldTx.userId, -oldCredit);
    }
    if (newUserId && newCredit > 0) {
      this.adjustUserBalance(newUserId, newCredit);
    }

    const next = txs.map((t) =>
      t.id === id
        ? {
            ...t,
            userId: newUserId,
            userName: newUser?.name || t.userName,
            amount: newAmount,
            method: updates.method || t.method,
            txId: updates.txId ?? t.txId,
            status: newStatus,
            note: updates.note ?? t.note,
          }
        : t
    );
    this.saveTransactions(next);
  }

  public deleteDeposit(id: string) {
    const txs = this.getTransactions();
    const target = txs.find((t) => t.id === id && t.type === 'DEPOSIT');
    if (!target) return;

    if (target.status === 'Completed' && target.userId) {
      this.adjustUserBalance(target.userId, -target.amount);
    }

    this.saveTransactions(txs.filter((t) => t.id !== id));
  }

  // ---- Admin Withdraw CRUD ----
  public approveWithdraw(id: string) {
    const txs = this.getTransactions();
    const target = txs.find((t) => t.id === id && t.type === 'WITHDRAW');
    if (!target || target.status === 'Completed') return;

    // If previously rejected (meaning it was refunded), re-deduct when approving
    if (target.status === 'Rejected' && target.userId) {
      this.adjustUserBalance(target.userId, -target.amount);
    }

    const next = txs.map((t) =>
      t.id === id ? { ...t, status: 'Completed' as const, note: 'Paid by Admin' } : t
    );
    this.saveTransactions(next);
  }

  public rejectWithdraw(id: string) {
    const txs = this.getTransactions();
    const target = txs.find((t) => t.id === id && t.type === 'WITHDRAW');
    if (!target || target.status === 'Rejected') return;

    // Refund held amount back to user balance
    if (target.userId) {
      this.adjustUserBalance(target.userId, target.amount);
    }

    const next = txs.map((t) =>
      t.id === id ? { ...t, status: 'Rejected' as const, note: 'Rejected & Refunded by Admin' } : t
    );
    this.saveTransactions(next);
  }

  public addAdminWithdraw(input: {
    userId: string;
    amount: number;
    method: 'EasyPaisa' | 'JazzCash';
    accountTitle: string;
    accountNumber: string;
    status: 'Pending' | 'Completed' | 'Rejected';
    note?: string;
  }) {
    const users = this.getUsers();
    const user = users.find((u) => u.id === input.userId) || users[0];
    const amount = Math.max(1, Number(input.amount) || 0);

    if (input.status !== 'Rejected') {
      this.adjustUserBalance(user.id, -amount);
    }

    const newTx: Transaction = {
      id: 'tx_wth_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      userId: user.id,
      userName: user.name,
      type: 'WITHDRAW',
      amount,
      method: input.method,
      accountTitle: input.accountTitle.trim() || user.name,
      accountNumber: input.accountNumber.trim() || user.phone || '03048921102',
      status: input.status,
      timestamp: Date.now(),
      txId: 'WTH' + Math.floor(10000000 + Math.random() * 90000000),
      note: input.note || 'Added by Admin',
    };

    const txs = this.getTransactions();
    this.saveTransactions([newTx, ...txs]);
  }

  public editWithdraw(
    id: string,
    updates: {
      userId?: string;
      amount?: number;
      method?: 'EasyPaisa' | 'JazzCash';
      accountTitle?: string;
      accountNumber?: string;
      status?: TransactionStatus;
      note?: string;
    }
  ) {
    const txs = this.getTransactions();
    const oldTx = txs.find((t) => t.id === id && t.type === 'WITHDRAW');
    if (!oldTx) return;

    const users = this.getUsers();
    const newUserId = updates.userId || oldTx.userId || users[0]?.id;
    const newUser = users.find((u) => u.id === newUserId);
    const newAmount = updates.amount !== undefined ? Math.max(0, Number(updates.amount)) : oldTx.amount;
    const newStatus = updates.status || oldTx.status;

    const oldHeld = oldTx.status !== 'Rejected' ? oldTx.amount : 0;
    const newHeld = newStatus !== 'Rejected' ? newAmount : 0;

    if (oldTx.userId && oldHeld > 0) {
      this.adjustUserBalance(oldTx.userId, oldHeld);
    }
    if (newUserId && newHeld > 0) {
      this.adjustUserBalance(newUserId, -newHeld);
    }

    const next = txs.map((t) =>
      t.id === id
        ? {
            ...t,
            userId: newUserId,
            userName: newUser?.name || t.userName,
            amount: newAmount,
            method: updates.method || t.method,
            accountTitle: updates.accountTitle ?? t.accountTitle,
            accountNumber: updates.accountNumber ?? t.accountNumber,
            status: newStatus,
            note: updates.note ?? t.note,
          }
        : t
    );
    this.saveTransactions(next);
  }

  public deleteWithdraw(id: string) {
    const txs = this.getTransactions();
    const target = txs.find((t) => t.id === id && t.type === 'WITHDRAW');
    if (!target) return;

    // Refund if pending when deleted
    if (target.status === 'Pending' && target.userId) {
      this.adjustUserBalance(target.userId, target.amount);
    }

    this.saveTransactions(txs.filter((t) => t.id !== id));
  }

  // ==================== CARD & RESULT CONTROL ====================
  public getCardControl(): CardControlState {
    const parsed = safeParse<CardControlState>(
      localStorage.getItem(KEYS.CARD_CONTROL),
      DEFAULT_CARD_CONTROL
    );
    const smartStrategyEnabled =
      parsed.smartStrategyEnabled !== undefined ? parsed.smartStrategyEnabled : true;
    // Ensure any legacy sticky repeatEveryRound flag is cleared so manual control is strictly single-round
    if (parsed.activeOverride?.repeatEveryRound) {
      return {
        ...parsed,
        smartStrategyEnabled,
        activeOverride: { ...parsed.activeOverride, repeatEveryRound: false },
      };
    }
    return {
      ...parsed,
      smartStrategyEnabled,
    };
  }

  private saveCardControl(state: CardControlState) {
    localStorage.setItem(KEYS.CARD_CONTROL, JSON.stringify(state));
    this.broadcastChange();
  }

  public getStrategyState(): StrategyCycleState {
    const parsed = safeParse<Partial<StrategyCycleState>>(
      localStorage.getItem(KEYS.STRATEGY_STATE),
      DEFAULT_STRATEGY_STATE
    );
    return {
      cycleBetCount: typeof parsed.cycleBetCount === 'number' ? parsed.cycleBetCount : 0,
      cycleWinCount: typeof parsed.cycleWinCount === 'number' ? parsed.cycleWinCount : 0,
      cycleMaxWins: 1,
      recentBets: Array.isArray(parsed.recentBets) ? parsed.recentBets : [],
      totalStaked: typeof parsed.totalStaked === 'number' ? parsed.totalStaked : 0,
      totalPaidOut: typeof parsed.totalPaidOut === 'number' ? parsed.totalPaidOut : 0,
      totalBetsCount: typeof parsed.totalBetsCount === 'number' ? parsed.totalBetsCount : 0,
      totalWinsCount: typeof parsed.totalWinsCount === 'number' ? parsed.totalWinsCount : 0,
      winStreak: typeof parsed.winStreak === 'number' ? parsed.winStreak : 0,
      bestStreak: typeof parsed.bestStreak === 'number' ? parsed.bestStreak : 0,
    };
  }

  private saveStrategyState(state: StrategyCycleState) {
    localStorage.setItem(KEYS.STRATEGY_STATE, JSON.stringify(state));
  }

  public recordRoundWinStreak(didWin: boolean): number {
    const current = this.getStrategyState();
    const nextStreak = didWin ? current.winStreak + 1 : 0;
    const nextBest = Math.max(current.bestStreak, nextStreak);
    this.saveStrategyState({
      ...current,
      winStreak: nextStreak,
      bestStreak: nextBest,
    });
    this.broadcastChange();
    return nextStreak;
  }

  public resetStrategyStats() {
    this.saveStrategyState({ ...DEFAULT_STRATEGY_STATE });
    this.broadcastChange();
  }

  public setSmartStrategyEnabled(enabled: boolean) {
    const current = this.getCardControl();
    this.saveCardControl({
      ...current,
      smartStrategyEnabled: enabled,
    });
  }

  public setExactNextCards(dragonCard: Card, tigerCard: Card) {
    const current = this.getCardControl();
    const winner = determineWinner(dragonCard, tigerCard);
    const rule: CardOverrideRule = {
      id: 'rule_' + Date.now(),
      mode: 'EXACT_CARDS',
      dragonCard,
      tigerCard,
      forcedWinner: winner,
      repeatEveryRound: false,
      label: `Dragon ${dragonCard.rank}${dragonCard.suit} vs Tiger ${tigerCard.rank}${tigerCard.suit} (${winner})`,
      createdAt: Date.now(),
    };
    this.saveCardControl({
      ...current,
      activeOverride: rule,
    });
  }

  public setForcedNextWinner(winner: BettingOption) {
    const { dragonCard, tigerCard } = generateCardsForWinner(winner);
    this.setExactNextCards(dragonCard, tigerCard);
  }

  public clearActiveOverride() {
    const current = this.getCardControl();
    this.saveCardControl({
      ...current,
      activeOverride: null,
    });
  }

  public addToCardQueue(dragonCard: Card, tigerCard: Card) {
    const current = this.getCardControl();
    const winner = determineWinner(dragonCard, tigerCard);
    const rule: CardOverrideRule = {
      id: 'queue_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      mode: 'EXACT_CARDS',
      dragonCard,
      tigerCard,
      forcedWinner: winner,
      repeatEveryRound: false,
      label: `Dragon ${dragonCard.rank}${dragonCard.suit} vs Tiger ${tigerCard.rank}${tigerCard.suit}`,
      createdAt: Date.now(),
    };
    this.saveCardControl({
      ...current,
      queue: [...current.queue, rule],
    });
  }

  public removeFromCardQueue(ruleId: string) {
    const current = this.getCardControl();
    this.saveCardControl({
      ...current,
      queue: current.queue.filter((r) => r.id !== ruleId),
    });
  }

  public clearCardQueue() {
    const current = this.getCardControl();
    this.saveCardControl({
      ...current,
      queue: [],
    });
  }

  public setAutoHouseProfit(enabled: boolean) {
    const current = this.getCardControl();
    this.saveCardControl({
      ...current,
      autoHouseProfit: enabled,
    });
  }

  /**
   * Called by TigerDragonTable during dealCards() so Admin overrides / queue / smart 5-bet strategy take effect cleanly!
   */
  public consumeCardsForDeal(
    currentDeck: Card[],
    roundNumber: number,
    realUserBets: Record<BettingOption, number>
  ): {
    dragonCard: Card;
    tigerCard: Card;
    remainingDeck: Card[];
    source: 'MANUAL_ADMIN' | 'HOUSE_PROFIT' | 'SMART_STRATEGY' | 'FAIR_SHUFFLE';
  } {
    const state = this.getCardControl();
    let dCard: Card | null = null;
    let tCard: Card | null = null;
    let remainingDeck = [...currentDeck];
    let source: 'MANUAL_ADMIN' | 'HOUSE_PROFIT' | 'SMART_STRATEGY' | 'FAIR_SHUFFLE' = 'FAIR_SHUFFLE';

    let nextActiveOverride = state.activeOverride;
    let nextQueue = [...state.queue];

    const dBet = realUserBets.DRAGON || 0;
    const tBet = realUserBets.TIGER || 0;
    const tieBet = realUserBets.TIE || 0;
    const totalUserBet = dBet + tBet + tieBet;

    const payoutFor = (opt: BettingOption) => {
      if (opt === 'DRAGON') return Math.round(dBet * 1.9);
      if (opt === 'TIGER') return Math.round(tBet * 1.9);
      return tieBet * 9 + Math.floor(dBet * 0.5) + Math.floor(tBet * 0.5);
    };

    const pickLowestPayoutOutcome = (): BettingOption => {
      const dragonPay = payoutFor('DRAGON');
      const tigerPay = payoutFor('TIGER');
      const tiePay = payoutFor('TIE');

      // If player hedged both Dragon & Tiger without Tie, occasionally drop Tie to wipe 50% of hedge
      if (dBet > 0 && tBet > 0 && tieBet === 0 && tiePay < Math.min(dragonPay, tigerPay)) {
        if (Math.random() < 0.45) {
          return 'TIE';
        }
      }

      if (dragonPay < tigerPay) return 'DRAGON';
      if (tigerPay < dragonPay) return 'TIGER';
      // Equal bets on Dragon & Tiger (or Tie-only bet): pick Dragon or Tiger randomly
      return Math.random() < 0.5 ? 'DRAGON' : 'TIGER';
    };

    if (state.activeOverride) {
      const rule = state.activeOverride;
      if (rule.mode === 'EXACT_CARDS' && rule.dragonCard && rule.tigerCard) {
        dCard = rule.dragonCard;
        tCard = rule.tigerCard;
      } else if (rule.forcedWinner) {
        const pair = generateCardsForWinner(rule.forcedWinner);
        dCard = pair.dragonCard;
        tCard = pair.tigerCard;
      }
      source = 'MANUAL_ADMIN';
      // Strictly one round only: clear activeOverride immediately so next round is back to normal!
      nextActiveOverride = null;
    } else if (nextQueue.length > 0) {
      const rule = nextQueue.shift()!;
      if (rule.dragonCard && rule.tigerCard) {
        dCard = rule.dragonCard;
        tCard = rule.tigerCard;
      } else if (rule.forcedWinner) {
        const pair = generateCardsForWinner(rule.forcedWinner);
        dCard = pair.dragonCard;
        tCard = pair.tigerCard;
      }
      source = 'MANUAL_ADMIN';
    } else if (state.autoHouseProfit && totalUserBet > 0) {
      // Strictly pick the outcome that gives the lowest player payout & highest Admin profit
      const winner = pickLowestPayoutOutcome();
      const pair = generateCardsForWinner(winner);
      dCard = pair.dragonCard;
      tCard = pair.tigerCard;
      source = 'HOUSE_PROFIT';

      const strat = this.getStrategyState();
      const actualPay = payoutFor(winner);
      this.saveStrategyState({
        ...strat,
        recentBets: [...strat.recentBets, totalUserBet].slice(-12),
        totalStaked: strat.totalStaked + totalUserBet,
        totalPaidOut: strat.totalPaidOut + actualPay,
        totalBetsCount: strat.totalBetsCount + 1,
        totalWinsCount: strat.totalWinsCount + (actualPay > totalUserBet ? 1 : 0),
      });
    } else if (state.smartStrategyEnabled !== false && totalUserBet > 0) {
      // PLAYER-FRIENDLY STREAK STRATEGY (~58-62% Win Rate on normal bets):
      // - Natural ~60% win probability on normal Dragon/Tiger bets so players don't get stuck in harsh loss streaks
      //   and can organically achieve 3-Consecutive-Win Fire Streaks!
      // - Gentle guard against extreme Martingale spikes (> 3.5x recent average) & Tie-only 8:1 exploits.
      const strat = this.getStrategyState();
      const prevAvg =
        strat.recentBets.length > 0
          ? strat.recentBets.reduce((s, v) => s + v, 0) / strat.recentBets.length
          : totalUserBet;
      const recent = [...strat.recentBets, totalUserBet].slice(-12);

      const isSpikeBet =
        strat.recentBets.length >= 2 && totalUserBet > prevAvg * 3.5;

      // Pick the Dragon/Tiger side the player bet on (highest payout first)
      const winningCandidates: BettingOption[] = (['DRAGON', 'TIGER'] as BettingOption[])
        .filter((opt) => payoutFor(opt) > totalUserBet)
        .sort((a, b) => payoutFor(b) - payoutFor(a));

      let shouldUserWin = false;
      if (!isSpikeBet && winningCandidates.length > 0) {
        // ~60% win rate on normal rounds (nudged to ~40% if already on 4+ streak for realism)
        const winChance = strat.winStreak >= 4 ? 0.4 : 0.6;
        shouldUserWin = Math.random() < winChance;
      }

      let chosenWinner: BettingOption;
      if (shouldUserWin && winningCandidates.length > 0) {
        chosenWinner = winningCandidates[0];
      } else if (!isSpikeBet && tieBet > 0 && dBet === 0 && tBet === 0 && Math.random() < 0.05) {
        chosenWinner = 'TIE';
      } else {
        shouldUserWin = false;
        chosenWinner = pickLowestPayoutOutcome();
      }

      const pair = generateCardsForWinner(chosenWinner);
      dCard = pair.dragonCard;
      tCard = pair.tigerCard;
      source = 'SMART_STRATEGY';

      const actualPayout = payoutFor(chosenWinner);
      const wonRound = actualPayout > totalUserBet;

      this.saveStrategyState({
        ...strat,
        cycleBetCount: (strat.cycleBetCount + 1) % 3,
        cycleWinCount: wonRound ? strat.cycleWinCount + 1 : 0,
        cycleMaxWins: 1,
        recentBets: recent,
        totalStaked: strat.totalStaked + totalUserBet,
        totalPaidOut: strat.totalPaidOut + actualPayout,
        totalBetsCount: strat.totalBetsCount + 1,
        totalWinsCount: strat.totalWinsCount + (wonRound ? 1 : 0),
      });
    }

    if (!dCard || !tCard) {
      if (remainingDeck.length < 2) {
        remainingDeck = createDeck();
      }
      const res1 = drawCard(remainingDeck);
      const res2 = drawCard(res1.remainingDeck);
      dCard = res1.card;
      tCard = res2.card;
      remainingDeck = res2.remainingDeck;
      source = 'FAIR_SHUFFLE';
    }

    const winner = determineWinner(dCard, tCard);
    this.saveCardControl({
      ...state,
      activeOverride: nextActiveOverride,
      queue: nextQueue,
      lastDealt: {
        roundNumber,
        dragonCard: dCard,
        tigerCard: tCard,
        winner,
        source,
        timestamp: Date.now(),
      },
    });

    return {
      dragonCard: dCard,
      tigerCard: tCard,
      remainingDeck,
      source,
    };
  }

  // ==================== CONTINUOUS ROUND CLOCK & TELEMETRY ====================
  public getRoundClockEpoch(): number {
    const raw = localStorage.getItem(KEYS.ROUND_CLOCK_EPOCH);
    const parsed = raw ? Number(raw) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    const epoch = Date.now();
    localStorage.setItem(KEYS.ROUND_CLOCK_EPOCH, String(epoch));
    return epoch;
  }

  /**
   * Deterministic wall-clock round schedule (26s per round):
   * 0..14s  -> BETTING (15..1)
   * 15..16s -> STOP_BETTING (2..1)
   * 17s     -> DEALING (1)
   * 18..20s -> SHOWDOWN (3..1)
   * 21..25s -> RESULT (5..1)
   * Never stops or freezes whether bets are placed or not.
   */
  public getLiveRoundClock(): {
    roundNumber: number;
    phase: 'BETTING' | 'STOP_BETTING' | 'DEALING' | 'SHOWDOWN' | 'RESULT';
    timer: number;
    secInRound: number;
  } {
    const ROUND_DURATION_SEC = 26;
    const BASE_ROUND = 1042;
    const epoch = this.getRoundClockEpoch();
    const elapsedSec = Math.max(0, Math.floor((Date.now() - epoch) / 1000));
    const roundNumber = BASE_ROUND + Math.floor(elapsedSec / ROUND_DURATION_SEC);
    const secInRound = elapsedSec % ROUND_DURATION_SEC;

    if (secInRound < 15) {
      return { roundNumber, phase: 'BETTING', timer: 15 - secInRound, secInRound };
    }
    if (secInRound < 17) {
      return { roundNumber, phase: 'STOP_BETTING', timer: 17 - secInRound, secInRound };
    }
    if (secInRound < 18) {
      return { roundNumber, phase: 'DEALING', timer: 1, secInRound };
    }
    if (secInRound < 21) {
      return { roundNumber, phase: 'SHOWDOWN', timer: 21 - secInRound, secInRound };
    }
    return { roundNumber, phase: 'RESULT', timer: 26 - secInRound, secInRound };
  }

  public getLiveTelemetry(): LiveRoundTelemetry {
    const saved = safeParse<LiveRoundTelemetry>(
      localStorage.getItem(KEYS.LIVE_TELEMETRY),
      DEFAULT_TELEMETRY
    );
    const clock = this.getLiveRoundClock();
    const sameRound = saved.roundNumber === clock.roundNumber;
    return {
      roundNumber: clock.roundNumber,
      phase: clock.phase,
      timer: clock.timer,
      userBets: sameRound ? saved.userBets : { DRAGON: 0, TIE: 0, TIGER: 0 },
      tableTotals: sameRound ? saved.tableTotals : { DRAGON: 0, TIE: 0, TIGER: 0 },
      updatedAt: Date.now(),
    };
  }

  public updateLiveTelemetry(telemetry: LiveRoundTelemetry) {
    localStorage.setItem(KEYS.LIVE_TELEMETRY, JSON.stringify(telemetry));
    this.notifyTelemetryListeners();
    try {
      this.channel?.postMessage({ kind: 'telemetry', ts: telemetry.updatedAt });
    } catch {
      // ignore
    }
  }

  public getLanguage(): AppLanguage {
    // Game language is strictly English only
    if (localStorage.getItem(KEYS.LANGUAGE) !== 'en') {
      localStorage.setItem(KEYS.LANGUAGE, 'en');
    }
    return 'en';
  }

  public setLanguage(_lang: AppLanguage) {
    localStorage.setItem(KEYS.LANGUAGE, 'en');
    const current = this.getSettings();
    localStorage.setItem(
      KEYS.ADMIN_SETTINGS,
      JSON.stringify({ ...current, language: 'en' })
    );
    this.broadcastChange();
  }

  public getSettings(): AdminSettings {
    const parsed = safeParse<Partial<AdminSettings>>(
      localStorage.getItem(KEYS.ADMIN_SETTINGS),
      {}
    );
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      language: 'en',
      // Deposits & Withdraws always require admin approval
      autoPayDeposits: false,
      manualApprovalRequired: true,
    };
  }

  public updateSettings(updates: Partial<AdminSettings>) {
    const current = this.getSettings();
    localStorage.setItem(KEYS.LANGUAGE, 'en');
    const next = {
      ...current,
      ...updates,
      language: 'en' as const,
      autoPayDeposits: false,
      manualApprovalRequired: true,
    };
    localStorage.setItem(KEYS.ADMIN_SETTINGS, JSON.stringify(next));
    this.broadcastChange();
  }
}

export const gameStore = new GameStore();
