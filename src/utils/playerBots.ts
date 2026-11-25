import { BettingOption, ChipValue } from '../types/game';

export interface RosterPlayer {
  id: string;
  name: string;
  avatarIcon: string;
  baseBalance: number;
  isVip: boolean;
  vipLevel: number;
  betStyle: 'high' | 'mid' | 'low';
}

export interface LiveBotPlayer {
  id: string;
  name: string;
  avatarIcon: string;
  balance: number;
  originX: number; // percentage on table
  originY: number; // percentage on table
  pillLeft: string;
  pillTop: string;
  roundBets: Record<BettingOption, number>;
  recentWinAmount: number | null;
  recentLossAmount: number | null;
  isVip: boolean;
  vipLevel: number;
  betStyle: 'high' | 'mid' | 'low';
  seatIndex: number;
  lastBetAction?: {
    target: BettingOption;
    amount: number;
    time: number;
  } | null;
}

export const SEAT_COORDINATES = [
  { seatIndex: 0, originX: 8.0, originY: 25.0, pillLeft: '3.6%', pillTop: '31.6%' },
  { seatIndex: 1, originX: 92.5, originY: 25.0, pillLeft: '86.4%', pillTop: '31.6%' },
  { seatIndex: 2, originX: 8.0, originY: 60.0, pillLeft: '3.6%', pillTop: '67.0%' },
  { seatIndex: 3, originX: 92.5, originY: 60.0, pillLeft: '86.4%', pillTop: '67.0%' },
];

export const PLAYER_ROSTER: RosterPlayer[] = [
  { id: 'p_laiba', name: 'LaibaBasit', avatarIcon: '👸', baseBalance: 82500, isVip: true, vipLevel: 6, betStyle: 'high' },
  { id: 'p_hasnain', name: 'Hasnain_Raza', avatarIcon: '🧔', baseBalance: 96200, isVip: true, vipLevel: 5, betStyle: 'high' },
  { id: 'p_saad', name: 'Saad_Qureshi', avatarIcon: '🧔‍♂️', baseBalance: 120000, isVip: true, vipLevel: 7, betStyle: 'high' },
  { id: 'p_ahmed', name: 'AhmedShah_PK', avatarIcon: '🤴', baseBalance: 48500, isVip: false, vipLevel: 3, betStyle: 'mid' },
  { id: 'p_malik', name: 'Malik_Arslan', avatarIcon: '🦁', baseBalance: 154000, isVip: true, vipLevel: 8, betStyle: 'high' },
  { id: 'p_zahid', name: 'Zahid_Mehmood', avatarIcon: '🧕', baseBalance: 68000, isVip: true, vipLevel: 4, betStyle: 'mid' },
  { id: 'p_zainab', name: 'Zainab_Khan', avatarIcon: '👸', baseBalance: 39500, isVip: false, vipLevel: 2, betStyle: 'low' },
  { id: 'p_rana', name: 'Rana_Farooq', avatarIcon: '👑', baseBalance: 189000, isVip: true, vipLevel: 8, betStyle: 'high' },
  { id: 'p_chaudhry', name: 'Chaudhry_Asad', avatarIcon: '😎', baseBalance: 215000, isVip: true, vipLevel: 9, betStyle: 'high' },
  { id: 'p_kashif', name: 'Kashif_Javed', avatarIcon: '🧔', baseBalance: 54000, isVip: false, vipLevel: 3, betStyle: 'mid' },
  { id: 'p_babar', name: 'Babar_Azam99', avatarIcon: '🦅', baseBalance: 98000, isVip: true, vipLevel: 5, betStyle: 'mid' },
  { id: 'p_bilal', name: 'Bilal_Sheikh', avatarIcon: '🔥', baseBalance: 76000, isVip: false, vipLevel: 4, betStyle: 'mid' },
  { id: 'p_sardar', name: 'Sardar_Tariq', avatarIcon: '🧔‍♂️', baseBalance: 165000, isVip: true, vipLevel: 7, betStyle: 'high' },
  { id: 'p_mian', name: 'Mian_Naveed', avatarIcon: '👨‍💼', baseBalance: 91000, isVip: true, vipLevel: 5, betStyle: 'mid' },
  { id: 'p_shahzaib', name: 'Shahzaib_Ali', avatarIcon: '🥷', baseBalance: 44000, isVip: false, vipLevel: 2, betStyle: 'low' },
  { id: 'p_usman', name: 'Usman_Ghani', avatarIcon: '💎', baseBalance: 118000, isVip: true, vipLevel: 6, betStyle: 'high' },
  { id: 'p_hamza', name: 'Hamza_Malik', avatarIcon: '🚀', baseBalance: 62000, isVip: false, vipLevel: 3, betStyle: 'mid' },
  { id: 'p_rehman', name: 'Rehman_Jutt', avatarIcon: '🧔', baseBalance: 134000, isVip: true, vipLevel: 7, betStyle: 'high' },
  { id: 'p_danish', name: 'Danish_Taimoor', avatarIcon: '😎', baseBalance: 81000, isVip: true, vipLevel: 4, betStyle: 'mid' },
  { id: 'p_hassan', name: 'Hassan_786', avatarIcon: '🧔‍♂️', baseBalance: 36000, isVip: false, vipLevel: 1, betStyle: 'low' },
  { id: 'p_ayesha', name: 'Ayesha_Noor', avatarIcon: '👸', baseBalance: 63000, isVip: false, vipLevel: 3, betStyle: 'low' },
  { id: 'p_rizwan', name: 'Rizwan_Bhatti', avatarIcon: '🦅', baseBalance: 95000, isVip: true, vipLevel: 5, betStyle: 'mid' },
  { id: 'p_adeel', name: 'Adeel_Gujjar', avatarIcon: '🦁', baseBalance: 160000, isVip: true, vipLevel: 8, betStyle: 'high' },
  { id: 'p_zeeshan', name: 'Zeeshan_Mirza', avatarIcon: '👑', baseBalance: 205000, isVip: true, vipLevel: 9, betStyle: 'high' },
  { id: 'p_fahad', name: 'Fahad_Siddiqui', avatarIcon: '🤴', baseBalance: 72000, isVip: false, vipLevel: 4, betStyle: 'mid' },
  { id: 'p_rao', name: 'Rao_Daniyal', avatarIcon: '💎', baseBalance: 88000, isVip: true, vipLevel: 5, betStyle: 'mid' },
  { id: 'p_farhan', name: 'Farhan_Virk', avatarIcon: '🔥', baseBalance: 142000, isVip: true, vipLevel: 7, betStyle: 'high' },
  { id: 'p_junaid', name: 'Junaid_Khan', avatarIcon: '🚀', baseBalance: 59000, isVip: false, vipLevel: 3, betStyle: 'low' },
  { id: 'p_salman', name: 'Salman_Butt', avatarIcon: '🦁', baseBalance: 112000, isVip: true, vipLevel: 6, betStyle: 'high' },
  { id: 'p_waqas', name: 'Waqas_Chohan', avatarIcon: '😎', baseBalance: 74000, isVip: false, vipLevel: 4, betStyle: 'mid' },
  { id: 'p_umar', name: 'Umar_Daraz', avatarIcon: '👑', baseBalance: 127000, isVip: true, vipLevel: 6, betStyle: 'high' },
  { id: 'p_noman', name: 'Noman_Qazi', avatarIcon: '💎', baseBalance: 65000, isVip: false, vipLevel: 3, betStyle: 'mid' },
];

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildSeatPlayer(
  p: RosterPlayer,
  seat: (typeof SEAT_COORDINATES)[number]
): LiveBotPlayer {
  const jitter = Math.floor(Math.random() * 8000) - 4000;
  return {
    id: p.id,
    name: p.name,
    avatarIcon: p.avatarIcon,
    balance: Math.max(18000, p.baseBalance + jitter),
    originX: seat.originX,
    originY: seat.originY,
    pillLeft: seat.pillLeft,
    pillTop: seat.pillTop,
    roundBets: { DRAGON: 0, TIE: 0, TIGER: 0 },
    recentWinAmount: null,
    recentLossAmount: null,
    isVip: p.isVip,
    vipLevel: p.vipLevel,
    betStyle: p.betStyle,
    seatIndex: seat.seatIndex,
    lastBetAction: null,
  };
}

/**
 * Creates initial 4 seated table players with strictly unique names
 */
export function getInitialTablePlayers(excludeName?: string): LiveBotPlayer[] {
  const normalizedExclude = excludeName?.trim().toLowerCase() || '';
  const eligible = PLAYER_ROSTER.filter(
    (p) => !normalizedExclude || p.name.trim().toLowerCase() !== normalizedExclude
  );
  const shuffled = shuffleArray(eligible);
  const seenNames = new Set<string>();
  const picked: RosterPlayer[] = [];

  for (const candidate of shuffled) {
    const key = candidate.name.trim().toLowerCase();
    if (!seenNames.has(key)) {
      seenNames.add(key);
      picked.push(candidate);
      if (picked.length === SEAT_COORDINATES.length) break;
    }
  }

  return SEAT_COORDINATES.map((seat, idx) => buildSeatPlayer(picked[idx], seat));
}

/**
 * Rotates 2-4 seats every round with strictly unique, shuffled players
 * so no two boards ever display the same name or repeat the same bettors.
 */
export function rotateTablePlayers(
  currentBots: LiveBotPlayer[],
  excludeName?: string
): {
  newBots: LiveBotPlayer[];
  joinedPlayerName?: string;
} {
  const normalizedExclude = excludeName?.trim().toLowerCase() || '';
  const currentNames = new Set(currentBots.map((b) => b.name.trim().toLowerCase()));

  // Exclude all currently seated players + active player so incoming bettors are always fresh & unique
  const availableRoster = shuffleArray(
    PLAYER_ROSTER.filter((p) => {
      const key = p.name.trim().toLowerCase();
      if (normalizedExclude && key === normalizedExclude) return false;
      return !currentNames.has(key);
    })
  );

  // Rotate 2 to 4 seats randomly every round
  const seatsToChangeCount = Math.min(
    availableRoster.length,
    2 + Math.floor(Math.random() * 3)
  );
  const seatIndicesToChange = new Set(
    shuffleArray([0, 1, 2, 3]).slice(0, seatsToChangeCount)
  );

  // Track names already committed to this round's 4 seats to guarantee 100% uniqueness
  const committedNames = new Set<string>();
  if (normalizedExclude) committedNames.add(normalizedExclude);

  for (const bot of currentBots) {
    if (!seatIndicesToChange.has(bot.seatIndex)) {
      committedNames.add(bot.name.trim().toLowerCase());
    }
  }

  const joinedNames: string[] = [];

  const updated = SEAT_COORDINATES.map((seat, idx) => {
    const existingBot = currentBots.find((b) => b.seatIndex === seat.seatIndex) || currentBots[idx];
    const shouldReplace =
      !existingBot ||
      seatIndicesToChange.has(seat.seatIndex) ||
      (normalizedExclude && existingBot.name.trim().toLowerCase() === normalizedExclude);

    if (shouldReplace) {
      while (availableRoster.length > 0) {
        const candidate = availableRoster.pop()!;
        const key = candidate.name.trim().toLowerCase();
        if (!committedNames.has(key)) {
          committedNames.add(key);
          joinedNames.push(candidate.name);
          return buildSeatPlayer(candidate, seat);
        }
      }
    }

    // Keeping existing player for this seat (reset round bets and win/loss markers)
    return {
      ...existingBot,
      originX: seat.originX,
      originY: seat.originY,
      pillLeft: seat.pillLeft,
      pillTop: seat.pillTop,
      seatIndex: seat.seatIndex,
      roundBets: { DRAGON: 0, TIE: 0, TIGER: 0 },
      recentWinAmount: null,
      recentLossAmount: null,
      lastBetAction: null,
    };
  });

  // Final strict uniqueness guard across all 4 seats
  const finalNames = new Set<string>();
  if (normalizedExclude) finalNames.add(normalizedExclude);
  const fallbackPool = shuffleArray(PLAYER_ROSTER);

  const deduplicated = updated.map((bot, idx) => {
    const key = bot.name.trim().toLowerCase();
    if (!finalNames.has(key)) {
      finalNames.add(key);
      return bot;
    }
    const replacement = fallbackPool.find(
      (p) => !finalNames.has(p.name.trim().toLowerCase())
    );
    if (replacement) {
      finalNames.add(replacement.name.trim().toLowerCase());
      return buildSeatPlayer(replacement, SEAT_COORDINATES[idx]);
    }
    return bot;
  });

  const randomJoined =
    joinedNames.length > 0
      ? joinedNames[Math.floor(Math.random() * joinedNames.length)]
      : undefined;

  return { newBots: deduplicated, joinedPlayerName: randomJoined };
}

/**
 * Calculates a dynamic bot bet for a specific second of the betting countdown
 */
export function generateBotBet(bot: LiveBotPlayer): {
  chipValue: ChipValue;
  target: BettingOption;
  targetX: number;
  targetY: number;
} | null {
  // If bot balance is low, skip
  if (bot.balance < 100) return null;

  // Target selection: 46% Dragon, 46% Tiger, 8% Tie
  const randTarget = Math.random();
  let target: BettingOption = 'DRAGON';
  if (randTarget < 0.46) {
    target = 'DRAGON';
  } else if (randTarget < 0.92) {
    target = 'TIGER';
  } else {
    target = 'TIE';
  }

  // Chip selection based on betStyle
  let chipValue: ChipValue = 100;
  if (target === 'TIE') {
    // Tie bets are usually smaller
    const tieChips: ChipValue[] = [20, 100, 200];
    chipValue = tieChips[Math.floor(Math.random() * tieChips.length)];
  } else if (bot.betStyle === 'high') {
    const highChips: ChipValue[] = [200, 1000, 2000, 10000];
    chipValue = highChips[Math.floor(Math.random() * highChips.length)];
  } else if (bot.betStyle === 'mid') {
    const midChips: ChipValue[] = [100, 200, 1000];
    chipValue = midChips[Math.floor(Math.random() * midChips.length)];
  } else {
    const lowChips: ChipValue[] = [10, 20, 100, 200];
    chipValue = lowChips[Math.floor(Math.random() * lowChips.length)];
  }

  if (bot.balance < chipValue) {
    chipValue = 100;
    if (bot.balance < chipValue) return null;
  }

  // Calculate target coordinates inside the respective box
  let targetX = 50;
  let targetY = 55;
  if (target === 'DRAGON') {
    targetX = 28 + Math.random() * 11;
    targetY = 46 + Math.random() * 26;
  } else if (target === 'TIGER') {
    targetX = 66 + Math.random() * 11;
    targetY = 46 + Math.random() * 26;
  } else {
    targetX = 48 + Math.random() * 9;
    targetY = 44 + Math.random() * 20;
  }

  return { chipValue, target, targetX, targetY };
}
