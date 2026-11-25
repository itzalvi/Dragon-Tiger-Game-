export type GamePhase = 
  | 'BETTING'        // 15s to 1s countdown
  | 'STOP_BETTING'   // Stop betting bell rings
  | 'DEALING'        // Dealing cards to Dragon and Tiger
  | 'SHOWDOWN'       // Reveal Dragon card then Tiger card
  | 'RESULT'         // Winner announced, celebration, payout distributed
  | 'PREPARING';     // 2s reset for next round

export type BettingOption = 'DRAGON' | 'TIGER' | 'TIE';

export type CardSuit = '♠' | '♥' | '♣' | '♦';
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: CardSuit;
  rank: CardRank;
  value: number; // A=1, 2=2... K=13
  color: 'red' | 'black';
}

export type ChipValue = 10 | 20 | 100 | 200 | 1000 | 2000 | 10000;

export interface PlacedChip {
  id: string;
  chipValue: ChipValue;
  target: BettingOption;
  x: number; // percentage inside target box 10-90%
  y: number; // percentage inside target box 15-85%
  isUser: boolean;
  playerName?: string;
}

export interface HistoryRecord {
  id: string;
  roundNumber: number;
  winner: BettingOption;
  dragonCard: Card;
  tigerCard: Card;
  timestamp: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  bonus: number;
  vip: number;
  todayBonusClaimed: boolean;
  status?: 'Active' | 'Suspended';
  phone?: string;
  referredBy?: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  phone: string;
  password?: string;
  avatar: string;
  balance: number;
  bonus: number;
  vip: number;
  status: 'Active' | 'Suspended';
  todayBonusClaimed: boolean;
  referredBy?: string;
  createdAt: number;
}

export type TransactionMethod = 'EasyPaisa' | 'JazzCash' | 'AllBankQR' | 'ManualAdmin';
export type TransactionStatus = 'Pending' | 'Completed' | 'Rejected' | 'Processing';

export interface Transaction {
  id: string;
  userId?: string;
  userName?: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'BET_WIN';
  amount: number;
  method: TransactionMethod;
  accountTitle: string;
  accountNumber: string;
  status: TransactionStatus;
  timestamp: number;
  txId: string;
  note?: string;
}

export interface BotPlayer {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  isVip?: boolean;
}

export interface CardOverrideRule {
  id: string;
  mode: 'EXACT_CARDS' | 'FORCE_WINNER';
  dragonCard?: Card | null;
  tigerCard?: Card | null;
  forcedWinner?: BettingOption | null;
  repeatEveryRound?: boolean;
  label?: string;
  createdAt: number;
}

export interface CardControlState {
  activeOverride: CardOverrideRule | null;
  queue: CardOverrideRule[];
  autoHouseProfit: boolean;
  smartStrategyEnabled?: boolean;
  lastDealt: {
    roundNumber: number;
    dragonCard: Card;
    tigerCard: Card;
    winner: BettingOption;
    source: 'MANUAL_ADMIN' | 'HOUSE_PROFIT' | 'SMART_STRATEGY' | 'FAIR_SHUFFLE';
    timestamp: number;
  } | null;
}

export interface LiveRoundTelemetry {
  roundNumber: number;
  phase: GamePhase;
  timer: number;
  userBets: Record<BettingOption, number>;
  tableTotals: Record<BettingOption, number>;
  updatedAt: number;
}

export type AppLanguage = 'en' | 'ur';

export interface AdminSettings {
  autoPayDeposits: boolean;
  manualApprovalRequired: boolean;
  adminPinEnabled: boolean;
  adminPin: string;
  minDeposit: number;
  minWithdraw: number;
  language?: AppLanguage;
}
