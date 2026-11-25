import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, Wallet, Settings, MessageCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  GamePhase, BettingOption, Card, ChipValue, PlacedChip, 
  HistoryRecord 
} from '../types/game';
import { soundManager } from '../utils/audio';
import { createDeck, determineWinner } from '../utils/cardDeck';
import { gameStore } from '../utils/gameStore';
import { useGameStore } from '../hooks/useGameStore';
import { 
  LiveBotPlayer, getInitialTablePlayers, rotateTablePlayers, generateBotBet 
} from '../utils/playerBots';
import { Chip } from './Chip';
import { TransactionModal } from './TransactionModal';
import { RoadmapModal } from './RoadmapModal';
import { LowBalanceToast } from './LowBalanceToast';
import { AdminPanel } from './AdminPanel';
import { SettingsModal } from './SettingsModal';
import { SupportChatModal } from './SupportChatModal';

interface TigerDragonTableProps {
  onBackToLobby?: () => void;
}

export const TigerDragonTable: React.FC<TigerDragonTableProps> = ({ onBackToLobby }) => {
  // Synced reactive store (Users, Deposits/Withdraws, Card Control Overrides, Language)
  const { activeUser: user, transactions, language } = useGameStore();
  const isUr = language === 'ur';
  const languageRef = useRef(language);
  languageRef.current = language;
  const userNameRef = useRef(user.name);
  userNameRef.current = user.name;

  // Low-balance notification toast (< 500 Rs)
  const [showLowBalanceToast, setShowLowBalanceToast] = useState<boolean>(false);
  const prevBalanceRef = useRef<number>(user.balance);

  useEffect(() => {
    const prev = prevBalanceRef.current;
    if (prev >= 500 && user.balance < 500) {
      setShowLowBalanceToast(true);
    } else if (user.balance >= 500) {
      setShowLowBalanceToast(false);
    }
    prevBalanceRef.current = user.balance;
  }, [user.balance]);

  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());

  // Deck & Cards
  const deckRef = useRef<Card[]>(createDeck());
  const [dragonCard, setDragonCard] = useState<Card | null>(null);
  const [tigerCard, setTigerCard] = useState<Card | null>(null);
  const [revealCards, setRevealCards] = useState<boolean>(false);

  // Continuous wall-clock round state (never stops whether bets are placed or not)
  const initialClock = useRef(gameStore.getLiveRoundClock()).current;
  const [phase, setPhase] = useState<GamePhase>(initialClock.phase);
  const [timer, setTimer] = useState<number>(initialClock.timer);
  const [roundNumber, setRoundNumber] = useState<number>(initialClock.roundNumber);
  const [roundWinner, setRoundWinner] = useState<BettingOption | null>(null);

  const CHIP_VALUES: ChipValue[] = [10, 20, 100, 200, 1000, 2000, 10000];
  const getBestAffordableChip = (bal: number): ChipValue => {
    const affordable = CHIP_VALUES.filter((c) => c <= bal);
    if (affordable.length === 0) return 10;
    if (bal >= 200) return 200;
    return affordable[affordable.length - 1];
  };

  // Chips: 10, 20, 100, 200, 1000, 2000, 10000
  const [selectedChip, setSelectedChip] = useState<ChipValue>(() =>
    getBestAffordableChip(user.balance)
  );
  const [userBets, setUserBets] = useState<Record<BettingOption, number>>({
    DRAGON: 0,
    TIE: 0,
    TIGER: 0,
  });

  // Auto-step down selected chip when player balance drops below current chip (down to Rs 10)
  useEffect(() => {
    if (user.balance >= 10 && user.balance < selectedChip) {
      setSelectedChip(getBestAffordableChip(user.balance));
    }
  }, [user.balance, selectedChip]);

  // Table Totals: Starts fresh at 0 every round, updates live with bets!
  const [tableTotals, setTableTotals] = useState<Record<BettingOption, number>>({
    DRAGON: 0,
    TIE: 0,
    TIGER: 0,
  });

  // Placed Chips
  const [placedChips, setPlacedChips] = useState<PlacedChip[]>([]);

  // History ribbon: Starts empty without mock T T D D as requested!
  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    const saved = localStorage.getItem('3patti_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return []; // Empty by default!
  });

  useEffect(() => {
    localStorage.setItem('3patti_history', JSON.stringify(history));
  }, [history]);

  interface FlyingChipItem {
    id: string;
    chipValue: ChipValue;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  }

  // 4 Seated Live Table Players (Rotates each round with strictly unique names)
  const [liveBots, setLiveBots] = useState<LiveBotPlayer[]>(() => getInitialTablePlayers(user.name));
  const liveBotsRef = useRef<LiveBotPlayer[]>(liveBots);
  liveBotsRef.current = liveBots;

  const [flyingChips, setFlyingChips] = useState<FlyingChipItem[]>([]);

  // Modals & Win Streak Fire Effect
  const [isWalletOpen, setIsWalletOpen] = useState<boolean>(false);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [bannerMessage, setBannerMessage] = useState<string>('');
  const [winStreak, setWinStreak] = useState<number>(() => gameStore.getStrategyState().winStreak);
  const [streakOverlay, setStreakOverlay] = useState<{
    streak: number;
    winAmount: number;
  } | null>(null);
  const streakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const showBanner = (msg: string, durationMs: number = 3500) => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
    }
    setBannerMessage(msg);
    bannerTimerRef.current = setTimeout(() => {
      setBannerMessage('');
      bannerTimerRef.current = null;
    }, durationMs);
  };

  const scheduleSafeTimeout = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      activeTimeoutsRef.current.delete(id);
      fn();
    }, ms);
    activeTimeoutsRef.current.add(id);
    return id;
  };

  const tableLogoClicksRef = useRef<{ count: number; timer: ReturnType<typeof setTimeout> | null }>({
    count: 0,
    timer: null,
  });

  const handleSecretTableLogoClick = () => {
    if (tableLogoClicksRef.current.timer) {
      clearTimeout(tableLogoClicksRef.current.timer);
    }
    const nextCount = tableLogoClicksRef.current.count + 1;
    if (nextCount >= 5) {
      tableLogoClicksRef.current.count = 0;
      tableLogoClicksRef.current.timer = null;
      setIsAdminOpen(true);
      return;
    }
    tableLogoClicksRef.current.count = nextCount;
    tableLogoClicksRef.current.timer = setTimeout(() => {
      tableLogoClicksRef.current.count = 0;
      tableLogoClicksRef.current.timer = null;
    }, 2500);
  };

  // Soft Ambient Background Music (BGM) Auto-Play on interaction & clean timer teardown
  useEffect(() => {
    soundManager.startBGM();

    const handleFirstGesture = () => {
      soundManager.startBGM();
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };

    window.addEventListener('pointerdown', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);

    return () => {
      soundManager.stopBGM();
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      if (streakTimerRef.current) clearTimeout(streakTimerRef.current);
      if (tableLogoClicksRef.current.timer) clearTimeout(tableLogoClicksRef.current.timer);
      activeTimeoutsRef.current.forEach((id) => clearTimeout(id));
      activeTimeoutsRef.current.clear();
    };
  }, []);

  // Broadcast live round telemetry so Admin Panel sees real-time timer, phase, and table bets
  useEffect(() => {
    gameStore.updateLiveTelemetry({
      roundNumber,
      phase,
      timer,
      userBets,
      tableTotals,
      updatedAt: Date.now(),
    });
  }, [roundNumber, phase, timer, userBets, tableTotals]);

  // State Refs so timer interval runs continuously without restarting on user bets!
  const phaseRef = useRef<GamePhase>(phase);
  phaseRef.current = phase;

  const dragonCardRef = useRef<Card | null>(dragonCard);
  dragonCardRef.current = dragonCard;

  const tigerCardRef = useRef<Card | null>(tigerCard);
  tigerCardRef.current = tigerCard;

  const userBetsRef = useRef<Record<BettingOption, number>>(userBets);
  userBetsRef.current = userBets;

  const roundNumberRef = useRef<number>(roundNumber);
  roundNumberRef.current = roundNumber;

  const timerRef = useRef<number>(timer);
  timerRef.current = timer;

  const lastStartedRoundRef = useRef<number>(initialClock.roundNumber);
  const lastStopSoundRoundRef = useRef<number>(-1);
  const lastDealtRoundRef = useRef<number>(-1);
  const lastRevealRoundRef = useRef<number>(-1);
  const lastAnnouncedRoundRef = useRef<number>(-1);
  const lastBeepKeyRef = useRef<string>('');
  const lastBotBetKeyRef = useRef<string>('');

  // Deal Cards synchronously for a round (Uses Admin Panel Manual Override / Queue / Smart Strategy)
  const dealCardsForRound = (targetRound: number) => {
    if (lastDealtRoundRef.current === targetRound) return;
    lastDealtRoundRef.current = targetRound;

    soundManager.playCardSwoosh();

    const { dragonCard: dCard, tigerCard: tCard, remainingDeck } = gameStore.consumeCardsForDeal(
      deckRef.current,
      targetRound,
      userBetsRef.current
    );
    deckRef.current = remainingDeck;

    dragonCardRef.current = dCard;
    tigerCardRef.current = tCard;
    setDragonCard(dCard);
    setTigerCard(tCard);
  };

  // Continuous Real-Time Round Clock Engine:
  // Driven by Date.now() wall-clock epoch so the timer NEVER stops, pauses, or freezes —
  // whether bets are placed or not, modals are opened, or the browser tab returns from background!
  useEffect(() => {
    const syncClock = () => {
      const clock = gameStore.getLiveRoundClock();

      // If round advanced (e.g. while away or on natural boundary), settle any unsettled user bets and start fresh
      if (clock.roundNumber > lastStartedRoundRef.current) {
        const prevRound = lastStartedRoundRef.current;
        const prevBets = userBetsRef.current;
        const hadUserBet = (prevBets.DRAGON + prevBets.TIE + prevBets.TIGER) > 0;
        if (hadUserBet && lastAnnouncedRoundRef.current !== prevRound) {
          dealCardsForRound(prevRound);
          announceResult(prevRound);
        }
        startNewRound(clock.roundNumber);
      }

      if (roundNumberRef.current !== clock.roundNumber) {
        roundNumberRef.current = clock.roundNumber;
        setRoundNumber(clock.roundNumber);
      }
      if (phaseRef.current !== clock.phase) {
        phaseRef.current = clock.phase;
        setPhase(clock.phase);
      }
      if (timerRef.current !== clock.timer) {
        timerRef.current = clock.timer;
        setTimer(clock.timer);
      }

      // Phase-specific side effects (guarded to fire once per step)
      if (clock.phase === 'BETTING') {
        if (clock.timer <= 4) {
          const beepKey = `${clock.roundNumber}_${clock.timer}`;
          if (lastBeepKeyRef.current !== beepKey) {
            lastBeepKeyRef.current = beepKey;
            soundManager.playCountdownBeep(false);
          }
        }
      } else if (clock.phase === 'STOP_BETTING') {
        if (lastStopSoundRoundRef.current !== clock.roundNumber) {
          lastStopSoundRoundRef.current = clock.roundNumber;
          soundManager.playStopBetting();
        }
      } else if (clock.phase === 'DEALING') {
        dealCardsForRound(clock.roundNumber);
      } else if (clock.phase === 'SHOWDOWN') {
        dealCardsForRound(clock.roundNumber);
        if (lastRevealRoundRef.current !== clock.roundNumber) {
          lastRevealRoundRef.current = clock.roundNumber;
          setRevealCards(true);
          soundManager.playCardSwoosh();
        }
      } else if (clock.phase === 'RESULT') {
        dealCardsForRound(clock.roundNumber);
        if (lastRevealRoundRef.current !== clock.roundNumber) {
          lastRevealRoundRef.current = clock.roundNumber;
          setRevealCards(true);
        }
        if (lastAnnouncedRoundRef.current !== clock.roundNumber) {
          announceResult(clock.roundNumber);
        }
      }
    };

    syncClock();
    const interval = setInterval(syncClock, 200);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncClock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', syncClock);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', syncClock);
    };
  }, []);

  // Live Table Players Betting during 15s BETTING countdown as requested
  useEffect(() => {
    if (phase !== 'BETTING') return;
    if (timer <= 1 || timer > 14) return;

    // Betting wave moments: seconds 13, 11, 10, 8, 7, 5, 4, 2
    const betMoments = [13, 11, 10, 8, 7, 5, 4, 2];
    if (!betMoments.includes(timer)) return;

    const botKey = `${roundNumber}_${timer}`;
    if (lastBotBetKeyRef.current === botKey) return;
    lastBotBetKeyRef.current = botKey;

    const currentBots = liveBotsRef.current;
    if (!currentBots || currentBots.length === 0) return;

    // Pick 1 or 2 seated players to bet at this moment
    const countToBet = (timer === 10 || timer === 5) ? 2 : 1;
    const shuffled = [...currentBots].sort(() => 0.5 - Math.random());
    const chosenBots = shuffled.slice(0, countToBet);

    chosenBots.forEach((bot, idx) => {
      const targetRound = roundNumber;
      scheduleSafeTimeout(() => {
        if (phaseRef.current !== 'BETTING' || roundNumberRef.current !== targetRound) return;
        const bet = generateBotBet(bot);
        if (!bet) return;

        const flyId = 'fly_bot_' + Math.random().toString().slice(2, 9);
        setFlyingChips(prev => [
          ...prev,
          {
            id: flyId,
            chipValue: bet.chipValue,
            fromX: bot.originX,
            fromY: bot.originY,
            toX: bet.targetX,
            toY: bet.targetY,
          }
        ]);
        soundManager.playChipSound();

        // Update bot's balance, roundBets, and lastBetAction
        setLiveBots(prev => prev.map(b => {
          if (b.id !== bot.id) return b;
          return {
            ...b,
            balance: Math.max(0, b.balance - bet.chipValue),
            roundBets: {
              ...b.roundBets,
              [bet.target]: b.roundBets[bet.target] + bet.chipValue,
            },
            lastBetAction: {
              target: bet.target,
              amount: bet.chipValue,
              time: Date.now(),
            },
          };
        }));

        scheduleSafeTimeout(() => {
          setFlyingChips(prev => prev.filter(f => f.id !== flyId));
          if (roundNumberRef.current !== targetRound) return;
          setTableTotals(prev => ({
            ...prev,
            [bet.target]: prev[bet.target] + bet.chipValue,
          }));
          setPlacedChips(prev => [
            ...prev,
            {
              id: 'bot_chip_' + Math.random().toString().slice(2, 9),
              chipValue: bet.chipValue,
              target: bet.target,
              x: bet.targetX,
              y: bet.targetY,
              isUser: false,
              playerName: bot.name,
            }
          ]);
        }, 380);
      }, idx * 240);
    });
  }, [timer, phase, roundNumber]);

  // Announce Result & Trigger Roars / Animations
  const announceResult = (targetRound: number = roundNumberRef.current) => {
    if (lastAnnouncedRoundRef.current === targetRound) return;
    const dCard = dragonCardRef.current;
    const tCard = tigerCardRef.current;
    if (!dCard || !tCard) return;
    lastAnnouncedRoundRef.current = targetRound;

    const winner = determineWinner(dCard, tCard);
    setRoundWinner(winner);

    // Tiger Roar on Tiger Win; Dragon Roar on Dragon Win
    if (winner === 'TIGER') {
      soundManager.playTigerRoar();
    } else if (winner === 'DRAGON') {
      soundManager.playDragonRoar();
    }

    // Dynamic History Ribbon Update
    const currentRound = targetRound;
    const newRecord: HistoryRecord = {
      id: 'rec_' + Date.now(),
      roundNumber: currentRound,
      winner,
      dragonCard: dCard,
      tigerCard: tCard,
      timestamp: Date.now(),
    };
    setHistory(prev => [newRecord, ...prev.slice(0, 30)]);

    // Check winnings
    // Payout rule requested by user:
    // "10 روپے لگائے ہیں اگر آپ ون ہو گئے ہیں تو آپ کو نو روپے پرافٹ ملے گا، مطلب 19 روپے۔ نو روپے پرافٹ 10 آپ کے لگائے ہوں گے وہ والے۔"
    const bets = userBetsRef.current;
    let totalWinPayout = 0;
    let netProfit = 0;

    if (winner === 'TIGER' || winner === 'DRAGON') {
      if (bets[winner] > 0) {
        const betAmount = bets[winner];
        netProfit = Math.round(betAmount * 0.9); // 9 Rs profit per 10 Rs bet
        totalWinPayout = betAmount + netProfit;  // 19 Rs total returned (original 10 + 9 profit)
      }
    } else if (winner === 'TIE') {
      if (bets.TIE > 0) {
        const betAmount = bets.TIE;
        netProfit = betAmount * 8; // 8:1 profit => 80 Rs profit per 10 Rs
        totalWinPayout = betAmount + netProfit; // 90 Rs total returned
      }
      // Standard 50% refund on Dragon and Tiger bets during Tie
      const tieRefund = Math.floor(bets.DRAGON * 0.5) + Math.floor(bets.TIGER * 0.5);
      totalWinPayout += tieRefund;
    }

    // Calculate Bot Payouts and Wins (10 gives 19 rule, matching user requested payout!)
    setLiveBots(prev => prev.map(bot => {
      let winPayout = 0;

      if (winner === 'TIGER' || winner === 'DRAGON') {
        if (bot.roundBets[winner] > 0) {
          const betAmount = bot.roundBets[winner];
          const netProfit = Math.round(betAmount * 0.9);
          winPayout = betAmount + netProfit; // 19 Rs on 10 Rs
        }
      } else if (winner === 'TIE') {
        if (bot.roundBets.TIE > 0) {
          const betAmount = bot.roundBets.TIE;
          winPayout = betAmount * 9;
        }
        // 50% refund on Tiger & Dragon during Tie
        const refund = Math.floor(bot.roundBets.DRAGON * 0.5) + Math.floor(bot.roundBets.TIGER * 0.5);
        winPayout += refund;
      }

      if (winPayout > 0) {
        return {
          ...bot,
          balance: bot.balance + winPayout,
          recentWinAmount: winPayout,
          recentLossAmount: null,
        };
      } else {
        const totalRoundBet = bot.roundBets.DRAGON + bot.roundBets.TIGER + bot.roundBets.TIE;
        return {
          ...bot,
          recentWinAmount: null,
          recentLossAmount: totalRoundBet > 0 ? totalRoundBet : null,
        };
      }
    }));

    // Always trigger celebratory gold confetti on round conclusion, highlighting the winning side
    confetti({
      particleCount: totalWinPayout > 0 ? 110 : 65,
      spread: totalWinPayout > 0 ? 95 : 75,
      origin: {
        x: winner === 'DRAGON' ? 0.34 : winner === 'TIGER' ? 0.7 : 0.52,
        y: 0.52,
      },
      colors: ['#facc15', '#fbbf24', '#fef08a', '#f59e0b', '#ffffff'],
    });

    // Trigger authentic coin cascade / collect sound when table payout is distributed
    scheduleSafeTimeout(() => {
      soundManager.playWinFanfare();
    }, 1100);

    const totalUserBet = bets.DRAGON + bets.TIE + bets.TIGER;
    if (totalUserBet > 0) {
      const didNetWin = totalWinPayout > totalUserBet;
      const nextStreak = gameStore.recordRoundWinStreak(didNetWin);
      setWinStreak(nextStreak);

      if (didNetWin && nextStreak >= 3) {
        if (streakTimerRef.current) {
          clearTimeout(streakTimerRef.current);
        }
        setStreakOverlay({
          streak: nextStreak,
          winAmount: totalWinPayout,
        });
        confetti({
          particleCount: 130,
          spread: 115,
          origin: { x: 0.5, y: 0.48 },
          colors: ['#f97316', '#ef4444', '#facc15', '#fb923c', '#ffffff'],
        });
        streakTimerRef.current = setTimeout(() => {
          setStreakOverlay(null);
          streakTimerRef.current = null;
        }, 3400);
      }
    }

    if (totalWinPayout > 0) {
      confetti({ particleCount: 70, spread: 100, origin: { y: 0.45 }, colors: ['#facc15', '#22c55e', '#38bdf8'] });
      gameStore.adjustActiveUserBalance(totalWinPayout);
      gameStore.recordBetWinTransaction(totalWinPayout, currentRound, winner);
      showBanner(
        `🎉 Congratulations! You won on ${winner}! Payout: Rs ${totalWinPayout.toLocaleString()} (Net Profit: +Rs ${netProfit.toLocaleString()})`,
        5500
      );
    }
  };

  const startNewRound = (nextRoundNumber: number) => {
    if (lastStartedRoundRef.current === nextRoundNumber) return;
    lastStartedRoundRef.current = nextRoundNumber;

    userBetsRef.current = { DRAGON: 0, TIE: 0, TIGER: 0 };
    setUserBets({ DRAGON: 0, TIE: 0, TIGER: 0 });
    setTableTotals({ DRAGON: 0, TIE: 0, TIGER: 0 }); // Fresh 0 amount for each round

    // Rotate table players dynamically each round with distinct names
    const { newBots, joinedPlayerName } = rotateTablePlayers(liveBotsRef.current, userNameRef.current);
    setLiveBots(newBots);
    if (joinedPlayerName) {
      showBanner(`✨ ${joinedPlayerName} joined the table`, 2800);
    }

    dragonCardRef.current = null;
    tigerCardRef.current = null;
    setRoundWinner(null);
    setDragonCard(null);
    setTigerCard(null);
    setRevealCards(false);
    setPlacedChips([]); // Clears all chips for the fresh round
    setFlyingChips([]);
    roundNumberRef.current = nextRoundNumber;
    setRoundNumber(nextRoundNumber);
    soundManager.playStartBetting();
  };

  // Place Bet
  const handlePlaceBet = (target: BettingOption) => {
    if (phaseRef.current !== 'BETTING') {
      showBanner('⏳ Please wait for the next round Start Betting phase!', 2000);
      return;
    }
    const liveUser = gameStore.getActiveUser();
    if (liveUser.status === 'Suspended') {
      showBanner('⚠️ Your account has been suspended by Admin.', 3500);
      return;
    }

    let chipToBet = selectedChip;
    if (liveUser.balance < chipToBet) {
      if (liveUser.balance >= 10) {
        chipToBet = getBestAffordableChip(liveUser.balance);
        setSelectedChip(chipToBet);
      } else {
        showBanner('💰 Balance below Rs 10! Please Top Up your wallet.', 3000);
        setIsWalletOpen(true);
        return;
      }
    }

    soundManager.playChipSound();
    gameStore.adjustActiveUserBalance(-chipToBet);
    userBetsRef.current = {
      ...userBetsRef.current,
      [target]: userBetsRef.current[target] + chipToBet,
    };
    setUserBets({ ...userBetsRef.current });

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

    const betRound = roundNumberRef.current;
    const flyId = 'fly_user_' + Math.random();
    setFlyingChips(prev => [
      ...prev,
      {
        id: flyId,
        chipValue: chipToBet,
        fromX: 51.0,
        fromY: 88.0,
        toX: targetX,
        toY: targetY,
      }
    ]);

    scheduleSafeTimeout(() => {
      setFlyingChips(prev => prev.filter(f => f.id !== flyId));
      if (roundNumberRef.current !== betRound) return;
      setTableTotals(prev => ({ ...prev, [target]: prev[target] + chipToBet }));
      setPlacedChips(prev => [
        ...prev,
        {
          id: 'user_' + Math.random(),
          chipValue: chipToBet,
          target,
          x: targetX,
          y: targetY,
          isUser: true,
        }
      ]);
    }, 400);
  };

  const handleClearBets = () => {
    if (phaseRef.current !== 'BETTING') return;
    const current = userBetsRef.current;
    const totalPlaced = current.DRAGON + current.TIGER + current.TIE;
    if (totalPlaced === 0) return;

    soundManager.playChipSound();
    gameStore.adjustActiveUserBalance(totalPlaced);
    setTableTotals(prev => ({
      DRAGON: Math.max(0, prev.DRAGON - current.DRAGON),
      TIE: Math.max(0, prev.TIE - current.TIE),
      TIGER: Math.max(0, prev.TIGER - current.TIGER),
    }));
    userBetsRef.current = { DRAGON: 0, TIE: 0, TIGER: 0 };
    setUserBets({ DRAGON: 0, TIE: 0, TIGER: 0 });
    setPlacedChips(prev => prev.filter(c => !c.isUser));
  };

  return (
    <div className="relative w-screen h-screen bg-[#070d1a] overflow-hidden flex items-center justify-center select-none font-sans">
      
      {/* 
        MASTER CASINO CANVAS:
        Exact 2400:1080 aspect ratio scaled smoothly inside any screen without distortion!
      */}
      <div 
        className="relative w-[min(100vw,calc(100vh*2400/1080))] h-[min(100vh,calc(100vw*1080/2400))] bg-center bg-no-repeat overflow-hidden shadow-2xl"
        style={{
          backgroundImage: "url('/assets/game/dragon_tiger_clean_arena.jpg')",
          backgroundSize: '100% 100%'
        }}
      >
        
        {/* ================= TOP CONTROLS (Lobby, Profile + Fire Streak, Wallet & Settings) ================= */}
        <div className="absolute top-2 left-3 z-30 flex items-center gap-2">
          {onBackToLobby && (
            <button
              onClick={onBackToLobby}
              className="px-2 py-0.5 rounded bg-black/60 hover:bg-black/80 border border-amber-500/40 text-amber-300 text-[10px] font-black tracking-wider transition cursor-pointer"
            >
              LOBBY
            </button>
          )}
          <div
            onClick={handleSecretTableLogoClick}
            className="w-7 h-7 rounded-full border border-amber-400/80 overflow-hidden bg-slate-900 shrink-0 shadow active:scale-95 transition-transform"
          >
            <img
              src="/assets/aistudio/IMG-20261113-WA5056_bdc6a48b.jpg"
              alt="Dragon Tiger"
              draggable={false}
              className="w-full h-full object-cover"
            />
          </div>

          {/* User Profile Area with Fire Streak Aura & Visual Counter */}
          <div
            className={`relative flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all duration-300 ${
              winStreak >= 3
                ? 'bg-gradient-to-r from-[#3a0d05]/95 via-[#5c1607]/95 to-[#3a1604]/95 border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.95)] ring-1 ring-yellow-300/80 animate-fire-profile'
                : 'bg-black/65 border-amber-500/40'
            }`}
            title={`Player: ${user.name}${winStreak > 0 ? ` • ${winStreak} Win Streak` : ''}`}
          >
            {winStreak >= 3 && (
              <span className="absolute -top-2 -left-1 text-xs animate-bounce pointer-events-none drop-shadow-[0_0_6px_rgba(249,115,22,1)]">
                🔥
              </span>
            )}
            <span className="text-xs leading-none">{user.avatar || '😎'}</span>
            <span className="text-[10px] font-black text-amber-100 max-w-[68px] truncate">
              {user.name}
            </span>
            {winStreak > 0 && (
              <span
                className={`flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-black tracking-tight ${
                  winStreak >= 3
                    ? 'bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 text-slate-950 shadow-[0_0_12px_rgba(251,146,60,0.95)]'
                    : 'bg-orange-500/25 text-orange-300 border border-orange-400/50'
                }`}
              >
                <Flame className={`w-2.5 h-2.5 ${winStreak >= 3 ? 'fill-red-600 text-red-700 animate-pulse' : 'text-orange-400'}`} />
                <span>{winStreak}x</span>
                {winStreak >= 3 && <span className="hidden sm:inline ml-0.5">FIRE</span>}
              </span>
            )}
          </div>

          <button
            onClick={() => setIsWalletOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#2c140d]/95 via-[#190905]/95 to-[#2c140d]/95 border border-amber-400/80 shadow text-amber-300 text-[11px] font-black font-mono tracking-wide hover:scale-105 active:scale-95 transition cursor-pointer"
            title="Wallet & Balance (Click to Deposit / Withdraw)"
          >
            <span className="text-yellow-400 text-xs">🪙</span>
            <span className="text-yellow-300 font-mono font-bold">Rs {user.balance.toLocaleString()}</span>
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center font-sans">+</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1 rounded bg-black/60 hover:bg-black/80 border border-amber-500/40 text-amber-300 text-[10px] transition cursor-pointer"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {userBets.DRAGON + userBets.TIE + userBets.TIGER > 0 && phase === 'BETTING' && (
            <button
              onClick={handleClearBets}
              className="px-2 py-0.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-300 text-[10px] font-black tracking-wider transition shadow cursor-pointer"
              title="Clear Current Bets"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Win / Status Banner Notification */}
        {bannerMessage && (
          <div className="absolute top-2 inset-x-0 z-40 flex justify-center pointer-events-none animate-bounce">
            <div className="px-6 py-1.5 rounded-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 border-2 border-white text-slate-950 font-black text-xs sm:text-sm shadow-2xl">
              {bannerMessage}
            </div>
          </div>
        )}

        {/* ================= CARD SHOWDOWN OVERLAYS (FLIP IN PLACE ON SHOWDOWN) ================= */}
        {/* Left Card: Dragon Card (coordinates 43.9%, 5.2%, 5.8%, 18.0%) */}
        {revealCards && dragonCard && (
          <div 
            className="absolute z-20 cursor-pointer"
            style={{ left: '43.9%', top: '5.2%', width: '5.8%', height: '18.0%' }}
            onClick={() => {
              if (roundWinner === 'DRAGON') {
                soundManager.playDragonRoar();
              }
            }}
            title="Dragon Card"
          >
            <div className={`relative w-full h-full rounded-md bg-white border-2 ${roundWinner === 'DRAGON' && phase === 'RESULT' ? 'border-yellow-300 ring-4 ring-yellow-400 shadow-[0_0_28px_rgba(250,204,21,0.95)] scale-105' : 'border-slate-300'} shadow-xl flex flex-col justify-between p-1 text-slate-900 transition-all animate-flip-in overflow-hidden`}>
              <div className={`text-[11px] font-black leading-none ${dragonCard.color === 'red' ? 'text-red-600' : 'text-slate-950'}`}>
                {dragonCard.rank}
                <div className="text-[10px]">{dragonCard.suit}</div>
              </div>
              <div className={`text-2xl font-black text-center ${dragonCard.color === 'red' ? 'text-red-600' : 'text-slate-950'}`}>
                {dragonCard.suit}
              </div>
              <div className="text-[8px] font-mono text-center font-bold text-slate-500">
                PTS: {dragonCard.value}
              </div>

              {/* Floating Dragon Mascot & Roar Sound Badge on Card Win */}
              {phase === 'RESULT' && roundWinner === 'DRAGON' && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    soundManager.playDragonRoar();
                  }}
                  className="absolute bottom-1 inset-x-0.5 flex flex-col items-center justify-center py-0.5 rounded bg-blue-600 border border-sky-300 text-white text-[8px] sm:text-[9px] font-black shadow-xl animate-bounce pointer-events-auto z-30"
                  title={isUr ? 'کلک کر کے ڈریگن ساؤنڈ سنیں' : 'Click for Dragon Roar'}
                >
                  <div className="flex items-center gap-0.5">
                    <span>🐉</span> <span>DRAGON!</span>
                  </div>
                  <span className="text-[7px] text-cyan-200 flex items-center gap-0.5 font-bold">
                    <span>{isUr ? '🔊 روار ساؤنڈ' : '🔊 Roar'}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Card: Tiger Card (coordinates 54.2%, 5.2%, 5.8%, 18.0%) */}
        {revealCards && tigerCard && (
          <div 
            className="absolute z-20 cursor-pointer"
            style={{ left: '54.2%', top: '5.2%', width: '5.8%', height: '18.0%' }}
            onClick={() => {
              if (roundWinner === 'TIGER') {
                soundManager.playTigerRoar();
              }
            }}
            title="Tiger Card"
          >
            <div className={`relative w-full h-full rounded-md bg-white border-2 ${roundWinner === 'TIGER' && phase === 'RESULT' ? 'border-yellow-300 ring-4 ring-yellow-400 shadow-[0_0_28px_rgba(250,204,21,0.95)] scale-105' : 'border-slate-300'} shadow-xl flex flex-col justify-between p-1 text-slate-900 transition-all animate-flip-in overflow-hidden`}>
              <div className={`text-[11px] font-black leading-none ${tigerCard.color === 'red' ? 'text-red-600' : 'text-slate-950'}`}>
                {tigerCard.rank}
                <div className="text-[10px]">{tigerCard.suit}</div>
              </div>
              <div className={`text-2xl font-black text-center ${tigerCard.color === 'red' ? 'text-red-600' : 'text-slate-950'}`}>
                {tigerCard.suit}
              </div>
              <div className="text-[8px] font-mono text-center font-bold text-slate-500">
                PTS: {tigerCard.value}
              </div>

              {/* Floating Roaring Tiger Mascot & Roar Sound Badge on Card Win */}
              {phase === 'RESULT' && roundWinner === 'TIGER' && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    soundManager.playTigerRoar();
                  }}
                  className="absolute bottom-1 inset-x-0.5 flex flex-col items-center justify-center py-0.5 rounded bg-gradient-to-r from-amber-600 to-yellow-500 border border-yellow-200 text-slate-950 text-[8px] sm:text-[9px] font-black shadow-xl animate-bounce pointer-events-auto z-30"
                  title={isUr ? 'کلک کر کے ٹائیگر ساؤنڈ سنیں' : 'Click for Tiger Roar'}
                >
                  <div className="flex items-center gap-0.5">
                    <span>🐯</span> <span>TIGER!</span>
                  </div>
                  <span className="text-[7px] text-amber-950 flex items-center gap-0.5 font-black">
                    <span>{isUr ? '🔊 روار ساؤنڈ' : '🔊 Roar'}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= DYNAMIC BETTING TIMER / RESULT BADGE ================= */}
        {/* Single line, fully inside table roof frame without breaking into two lines */}
        <div 
          className="absolute z-20 flex items-center justify-center pointer-events-none select-none"
          style={{ left: '42.0%', top: '21.4%', width: '16.5%', height: '4.6%' }}
        >
          <div className="w-full h-full rounded bg-[#3b1c11] border border-amber-500/80 flex items-center justify-center px-1.5 shadow-md">
            <span className="text-yellow-400 text-xs mr-1 shrink-0">⭐</span>
            <span className="text-amber-200 text-[11px] sm:text-xs font-black uppercase tracking-wider tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">
              {phase === 'BETTING' && `Start Betting ${timer}`}
              {phase === 'STOP_BETTING' && 'Stop Betting!'}
              {phase === 'DEALING' && 'Dealing Cards...'}
              {phase === 'SHOWDOWN' && 'Showdown!'}
              {phase === 'RESULT' && (
                roundWinner === 'TIGER' 
                  ? '🐯 TIGER WINS!' 
                  : roundWinner === 'DRAGON' 
                  ? '🐉 DRAGON WINS!' 
                  : '⚖️ TIE (8:1)!'
              )}
            </span>
          </div>
        </div>

        {/* ================= DYNAMIC ROADMAP TREND RIBBON ================= */}
        {/* 
          User requested:
          "Yeh Jo Patti main ne mark ki hai isko Thora bera kr do t d d t Jo adhy adhy chupe Howe Hain pure Nazar aain"
          This bar is expanded and layered at z-25 above the boxes so all T D D T balls are 100% visible and never cut off!
        */}
        <div 
          className="absolute z-25 flex items-center px-3 rounded-xl bg-gradient-to-r from-[#241209] via-[#160904] to-[#241209] border-2 border-amber-600/70 shadow-2xl overflow-x-auto no-scrollbar pointer-events-auto"
          style={{ left: '24.8%', top: '26.4%', width: '49.8%', height: '8.0%' }}
        >
          {history.length === 0 ? (
            <div className="w-full flex items-center justify-between px-2 text-[10px] text-amber-200/90 font-bold select-none">
              <span className="flex items-center gap-1.5">
                <span className="text-yellow-400 animate-spin">⭐</span>
                {isUr ? 'نئے راؤنڈ کے رزلٹس کا انتظار ہے...' : 'Waiting for live round results...'}
              </span>
              <div className="flex gap-1.5 opacity-30">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border border-dashed border-amber-400" />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 py-1">
              {history.slice(0, 22).map((h, idx) => {
                const isT = h.winner === 'TIGER';
                const isD = h.winner === 'DRAGON';
                const isNewest = idx === 0;

                return (
                  <div key={h.id} className="relative shrink-0 flex items-center justify-center">
                    <div
                      className={`w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-black border shadow transition-all duration-300 ${
                        isT
                          ? 'bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 text-slate-950 border-yellow-200 shadow-amber-500/70'
                          : isD
                          ? 'bg-gradient-to-br from-blue-600 via-sky-400 to-blue-700 text-white border-sky-300 shadow-sky-500/70'
                          : 'bg-gradient-to-br from-emerald-600 via-green-400 to-emerald-700 text-slate-950 border-emerald-300 shadow-emerald-500/70'
                      } ${isNewest ? 'scale-105 ring-2 ring-yellow-400' : ''}`}
                    >
                      {isT ? 'T' : isD ? 'D' : 'Tie'}
                    </div>

                    {isNewest && (
                      <span className="absolute -top-1.5 -right-1 text-[7px] bg-red-600 text-white font-black px-1 rounded-full shadow border border-white animate-pulse">
                        {isUr ? 'نئی' : 'NEW'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ROADMAP TREND BUTTON (📈) */}
        <button
          onClick={() => setIsRoadmapOpen(true)}
          className="absolute z-25 cursor-pointer hover:brightness-125 active:scale-95 transition"
          style={{ left: '74.8%', top: '26.4%', width: '4.0%', height: '8.0%' }}
          title="Open Bead Plate & Big Road Matrix"
        />

        {/* ================= 3 MAIN INTERACTIVE BETTING BOXES ================= */}
        
        {/* ================= 3 MAIN INTERACTIVE BETTING BOXES ================= */}
        {/* 
          As requested by user:
          "کارڈ کے اوپر جو چپس لگی ہوئی ہیں پہلے والی پکچر کے اندر ان کو ریموو کرو اور جو نئی چپس لگتی ہیں وہ لگی ہوں۔ 
           جو کارڈ پر اماؤنٹ لکھی ہوئی ہے پرانی پکچر میں وہ پکچر موو کرو اور نئی اماؤنٹ اس کے اوپر شو ہو۔"
          These 3 opaque velvet felts cleanly cover all old screenshot chips and static numbers,
          showing ONLY live dynamic amounts and newly placed interactive chips!
        */}
        
        {/* 1. DRAGON BETTING BOX (left: 24.1%, top: 35.0%, width: 18.7%, height: 44.0%) */}
        <div
          onClick={() => handlePlaceBet('DRAGON')}
          className={`absolute z-20 cursor-pointer rounded-xl overflow-hidden transition-all duration-300 border-2 ${
            roundWinner === 'DRAGON' && phase === 'RESULT'
              ? 'border-yellow-300 ring-4 ring-yellow-400 shadow-[0_0_45px_rgba(250,204,21,0.95)] scale-102 z-30'
              : 'border-sky-400/80 hover:border-sky-300 shadow-xl active:scale-99'
          } bg-gradient-to-b from-[#192b52] via-[#132242] to-[#0d1830]`}
          style={{ left: '24.1%', top: '35.0%', width: '18.7%', height: '44.0%' }}
        >
          {/* Top Header Bar: Covers old 15340.00 completely with new live amount */}
          <div className="w-full py-1 px-2.5 bg-gradient-to-r from-[#291b4c] via-[#1f123d] to-[#291b4c] border-b border-purple-500/50 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 text-xs">⭐</span>
              <span className="text-yellow-300 font-mono font-black text-xs sm:text-sm tabular-nums">
                Rs {tableTotals.DRAGON.toFixed(2)}
              </span>
            </div>
            {userBets.DRAGON > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-sky-400 text-slate-950 text-[10px] font-black shadow-md">
                My: Rs {userBets.DRAGON}
              </span>
            )}
          </div>

          {/* Clean Velvet Felt Body (ZERO old picture chips!) */}
          <div className="relative w-full h-[calc(100%-30px)] flex flex-col items-center justify-between p-2 select-none">
            {/* Watermark Dragon Silhouette */}
            <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
              <span className="text-7xl filter drop-shadow-[0_0_25px_rgba(56,189,248,0.9)]">🐉</span>
            </div>

            {/* Bottom Label & Odds */}
            <div className="mt-auto text-center pointer-events-none z-10 pb-1">
              <div className="text-xl sm:text-2xl font-black text-sky-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] tracking-wider uppercase">
                {isUr ? 'ڈریگن' : 'DRAGON'}
              </div>
              <div className="text-xs sm:text-sm font-bold text-sky-200 font-mono tracking-wider">
                1:1 <span className="text-[10px] text-yellow-300 font-bold">{isUr ? '(1.9x واپسی)' : '(1.9x Return)'}</span>
              </div>
            </div>

            {/* ONLY newly placed interactive chips appear */}
            {placedChips
              .filter(c => c.target === 'DRAGON')
              .map(c => (
                <div
                  key={c.id}
                  style={{ left: `${c.x}%`, top: `${c.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-15"
                >
                  <Chip value={c.chipValue} size="sm" />
                </div>
              ))}

            {/* DRAGON VICTORY MASCOT & GOLD GLOW EFFECT */}
            {phase === 'RESULT' && roundWinner === 'DRAGON' && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-amber-500/25 via-blue-950/88 to-amber-500/25 backdrop-blur-xs border-2 border-yellow-300 shadow-[inset_0_0_35px_rgba(250,204,21,0.65)] animate-pulse pointer-events-none">
                <span className="text-6xl sm:text-7xl drop-shadow-[0_0_30px_rgba(250,204,21,1)] animate-bounce">
                  🐉
                </span>
                <div className="mt-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 border border-white text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl">
                  {isUr ? '★ DRAGON WINS! (ڈریگن) ★' : '★ DRAGON WINS! ★'}
                </div>
                <div className="text-[11px] text-yellow-200 font-black mt-1 drop-shadow">
                  {isUr ? '10 روپے پر 19 روپے واپسی!' : 'Rs 19 Return per Rs 10!'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. TIE BETTING BOX (left: 43.2%, top: 35.0%, width: 17.7%, height: 44.0%) */}
        <div
          onClick={() => handlePlaceBet('TIE')}
          className={`absolute z-20 cursor-pointer rounded-xl overflow-hidden transition-all duration-300 border-2 ${
            roundWinner === 'TIE' && phase === 'RESULT'
              ? 'border-yellow-300 ring-4 ring-yellow-400 shadow-[0_0_45px_rgba(250,204,21,0.95)] scale-102 z-30'
              : 'border-emerald-400/80 hover:border-emerald-300 shadow-xl active:scale-99'
          } bg-gradient-to-b from-[#133c2a] via-[#0d2d1f] to-[#081e14]`}
          style={{ left: '43.2%', top: '35.0%', width: '17.7%', height: '44.0%' }}
        >
          {/* Top Header Bar: Covers old 620.00 completely with new live amount */}
          <div className="w-full py-1 px-2.5 bg-gradient-to-r from-[#0d2a1b] via-[#071d12] to-[#0d2a1b] border-b border-emerald-500/50 flex items-center justify-between shadow-md">
            <span className="text-yellow-300 font-mono font-black text-xs sm:text-sm tabular-nums mx-auto">
              Rs {tableTotals.TIE.toFixed(2)}
            </span>
            {userBets.TIE > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black shadow-md absolute right-2">
                My: Rs {userBets.TIE}
              </span>
            )}
          </div>

          {/* Clean Velvet Felt Body (ZERO old picture chips!) */}
          <div className="relative w-full h-[calc(100%-30px)] flex flex-col items-center justify-between p-2 select-none">
            {/* Center Label & Odds */}
            <div className="my-auto text-center pointer-events-none z-10">
              <div className="text-2xl sm:text-3xl font-black text-emerald-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] tracking-wider uppercase">
                {isUr ? 'برابر' : 'TIE'}
              </div>
              <div className="text-xs sm:text-sm font-bold text-emerald-200 font-mono tracking-wider">
                8:1 <span className="text-[10px] text-yellow-300 font-bold">{isUr ? '(9x واپسی)' : '(9x Return)'}</span>
              </div>
            </div>

            {/* ONLY newly placed interactive chips appear */}
            {placedChips
              .filter(c => c.target === 'TIE')
              .map(c => (
                <div
                  key={c.id}
                  style={{ left: `${c.x}%`, top: `${c.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-15"
                >
                  <Chip value={c.chipValue} size="sm" />
                </div>
              ))}

            {/* TIE VICTORY POPUP WITH GOLD GLOW */}
            {phase === 'RESULT' && roundWinner === 'TIE' && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-amber-500/25 via-emerald-950/88 to-amber-500/25 backdrop-blur-xs border-2 border-yellow-300 shadow-[inset_0_0_35px_rgba(250,204,21,0.65)] animate-pulse pointer-events-none">
                <span className="text-5xl sm:text-6xl drop-shadow-[0_0_25px_rgba(250,204,21,1)] animate-bounce">
                  ⚖️
                </span>
                <div className="mt-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 border border-white text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl">
                  {isUr ? '★ TIE (برابر 8:1)! ★' : '★ TIE WINS (8:1)! ★'}
                </div>
                <div className="text-[11px] text-yellow-200 font-black mt-1 drop-shadow">
                  {isUr ? '10 روپے پر 90 روپے واپسی!' : 'Rs 90 Return per Rs 10!'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= LIVE RATIO BAR (COVERS SCREENSHOT'S STATIC D/T BAR) ================= */}
        <div 
          className="absolute z-20 flex items-center justify-between px-2.5 rounded-md bg-gradient-to-r from-[#211135] via-[#140b22] to-[#211135] border border-purple-500/50 shadow-lg select-none"
          style={{ left: '43.2%', top: '79.2%', width: '17.7%', height: '5.8%' }}
        >
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center border border-sky-300">
              D
            </span>
            <span className="text-[10px] font-mono font-bold text-sky-300">
              {history.filter(h => h.winner === 'DRAGON').length}
            </span>
          </div>

          <div className="flex-1 mx-2 h-1.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-700">
            <div 
              className="bg-sky-400 transition-all duration-500"
              style={{
                width: history.length === 0 ? '50%' : `${Math.round((history.filter(h => h.winner === 'DRAGON').length / (history.filter(h => h.winner === 'DRAGON').length + history.filter(h => h.winner === 'TIGER').length || 1)) * 100)}%`
              }}
            />
            <div 
              className="bg-amber-400 transition-all duration-500"
              style={{
                width: history.length === 0 ? '50%' : `${Math.round((history.filter(h => h.winner === 'TIGER').length / (history.filter(h => h.winner === 'DRAGON').length + history.filter(h => h.winner === 'TIGER').length || 1)) * 100)}%`
              }}
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono font-bold text-amber-300">
              {history.filter(h => h.winner === 'TIGER').length}
            </span>
            <span className="w-4 h-4 rounded-full bg-amber-600 text-slate-950 text-[9px] font-black flex items-center justify-center border border-yellow-200">
              T
            </span>
          </div>
        </div>

        {/* 3. TIGER BETTING BOX (left: 61.3%, top: 35.0%, width: 18.7%, height: 44.0%) */}
        <div
          onClick={() => handlePlaceBet('TIGER')}
          className={`absolute z-20 cursor-pointer rounded-xl overflow-hidden transition-all duration-300 border-2 ${
            roundWinner === 'TIGER' && phase === 'RESULT'
              ? 'border-yellow-300 ring-4 ring-yellow-400 shadow-[0_0_45px_rgba(250,204,21,0.95)] scale-102 z-30'
              : 'border-amber-400/80 hover:border-amber-300 shadow-xl active:scale-99'
          } bg-gradient-to-b from-[#4a240d] via-[#3a1b08] to-[#251004]`}
          style={{ left: '61.3%', top: '35.0%', width: '18.7%', height: '44.0%' }}
        >
          {/* Top Header Bar: Covers old 38800.00 completely with new live amount */}
          <div className="w-full py-1 px-2.5 bg-gradient-to-r from-[#3c1d0d] via-[#2d1408] to-[#3c1d0d] border-b border-amber-500/50 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 text-xs">⭐</span>
              <span className="text-yellow-300 font-mono font-black text-xs sm:text-sm tabular-nums">
                Rs {tableTotals.TIGER.toFixed(2)}
              </span>
            </div>
            {userBets.TIGER > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shadow-md">
                My: Rs {userBets.TIGER}
              </span>
            )}
          </div>

          {/* Clean Velvet Felt Body (ZERO old picture chips!) */}
          <div className="relative w-full h-[calc(100%-30px)] flex flex-col items-center justify-between p-2 select-none">
            {/* Watermark Tiger Silhouette */}
            <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
              <span className="text-7xl filter drop-shadow-[0_0_25px_rgba(245,158,11,0.9)]">🐯</span>
            </div>

            {/* Bottom Label & Odds */}
            <div className="mt-auto text-center pointer-events-none z-10 pb-1">
              <div className="text-xl sm:text-2xl font-black text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] tracking-wider uppercase">
                {isUr ? 'ٹائیگر' : 'TIGER'}
              </div>
              <div className="text-xs sm:text-sm font-bold text-amber-200 font-mono tracking-wider">
                1:1 <span className="text-[10px] text-yellow-300 font-bold">{isUr ? '(1.9x واپسی)' : '(1.9x Return)'}</span>
              </div>
            </div>

            {/* ONLY newly placed interactive chips appear */}
            {placedChips
              .filter(c => c.target === 'TIGER')
              .map(c => (
                <div
                  key={c.id}
                  style={{ left: `${c.x}%`, top: `${c.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-15"
                >
                  <Chip value={c.chipValue} size="sm" />
                </div>
              ))}

            {/* TIGER VICTORY MASCOT & GOLD GLOW EFFECT */}
            {phase === 'RESULT' && roundWinner === 'TIGER' && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-amber-500/25 via-amber-950/88 to-amber-500/25 backdrop-blur-xs border-2 border-yellow-300 shadow-[inset_0_0_35px_rgba(250,204,21,0.65)] animate-pulse pointer-events-none">
                <span className="text-6xl sm:text-7xl drop-shadow-[0_0_30px_rgba(250,204,21,1)] animate-bounce">
                  🐯
                </span>
                <div className="mt-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 border border-white text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl">
                  {isUr ? '★ TIGER WINS! (ٹائیگر) ★' : '★ TIGER WINS! ★'}
                </div>
                <div className="text-[11px] text-yellow-200 font-black mt-1 drop-shadow">
                  {isUr ? '10 روپے پر 19 روپے واپسی!' : 'Rs 19 Return per Rs 10!'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= FLYING CHIPS (REAL-TIME ANIMATION OF BETS FROM PLAYERS) ================= */}
        {flyingChips.map((fc) => (
          <div
            key={fc.id}
            className="absolute pointer-events-none z-35 animate-fly-chip"
            style={{
              '--from-x': `${fc.fromX}%`,
              '--from-y': `${fc.fromY}%`,
              '--to-x': `${fc.toX}%`,
              '--to-y': `${fc.toY}%`,
            } as React.CSSProperties}
          >
            <Chip value={fc.chipValue} size="sm" />
          </div>
        ))}

        {/* ================= LIVE TABLE PLAYERS (DYNAMIC AVATARS ON ARENA STANDS) ================= */}
        {liveBots.map((bot) => (
          <div
            key={`${bot.seatIndex}_${bot.id}`}
            className="absolute z-25 flex flex-col items-center pointer-events-none select-none transition-all duration-300"
            style={{
              left: `${bot.originX}%`,
              top: `${bot.originY}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Avatar Portrait with Golden Ring & VIP Crown */}
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-400 via-yellow-200 to-amber-600 p-0.5 shadow-2xl">
                <div className="w-full h-full rounded-full bg-[#1b0d09] border border-amber-300/40 flex items-center justify-center text-base sm:text-xl shadow-inner">
                  {bot.avatarIcon}
                </div>
              </div>
              {bot.isVip && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs filter drop-shadow">
                  👑
                </span>
              )}
              {/* Active Bet Badge when Bot Bets */}
              {bot.roundBets.DRAGON + bot.roundBets.TIE + bot.roundBets.TIGER > 0 && phase === 'BETTING' && (
                <span className="absolute -bottom-1 -right-2 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[8px] font-black border border-white shadow-md animate-pulse">
                  Rs {(bot.roundBets.DRAGON + bot.roundBets.TIE + bot.roundBets.TIGER).toLocaleString()}
                </span>
              )}
            </div>

            {/* Live Bet Action Bubble when Bot bets */}
            {bot.lastBetAction && (Date.now() - bot.lastBetAction.time < 3500) && phase === 'BETTING' && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-red-600 via-amber-600 to-red-600 border border-yellow-300 text-white font-black text-[9px] shadow-lg animate-bounce whitespace-nowrap z-30">
                <span>{bot.lastBetAction.target === 'DRAGON' ? '🐉' : bot.lastBetAction.target === 'TIGER' ? '🐯' : '⚖️'}</span>
                <span>Rs {bot.lastBetAction.amount.toLocaleString()}</span>
              </div>
            )}

            {/* Player Name Tag */}
            <div className="mt-0.5 px-2 py-0.2 rounded-full bg-black/85 border border-amber-500/40 text-amber-200 text-[9px] sm:text-[10px] font-black tracking-wide whitespace-nowrap shadow flex items-center gap-1">
              <span>{bot.name}</span>
              <span className="text-[7.5px] text-amber-400 font-bold bg-amber-950/60 px-1 rounded">VIP{bot.vipLevel || 5}</span>
            </div>

            {/* Live Balance Plaque */}
            <div className="mt-0.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#2a130e] via-[#160a07] to-[#2a130e] border border-amber-500/80 shadow-md text-amber-300 font-mono font-black text-[9px] sm:text-[10px] tabular-nums tracking-wide flex items-center gap-1 whitespace-nowrap">
              <span className="text-yellow-400 text-[8px]">🪙</span>
              <span>Rs {bot.balance >= 1000 ? `${(bot.balance / 1000).toFixed(1)}K` : bot.balance.toLocaleString()}</span>
            </div>

            {/* Floating Victory Celebration Popup on Win */}
            {bot.recentWinAmount !== null && phase === 'RESULT' && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 text-white font-black text-[11px] sm:text-xs shadow-2xl border-2 border-yellow-300 animate-bounce whitespace-nowrap z-40">
                <span className="text-yellow-300 animate-spin">★</span>
                <span>+Rs {bot.recentWinAmount.toLocaleString()}</span>
                <span className="text-yellow-300">🏆</span>
              </div>
            )}

            {/* Floating Loss Indicator */}
            {bot.recentLossAmount !== null && phase === 'RESULT' && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900/90 text-rose-400 font-bold text-[9px] shadow border border-rose-500/40 whitespace-nowrap z-40">
                -Rs {bot.recentLossAmount.toLocaleString()}
              </div>
            )}
          </div>
        ))}

        {/* ================= INTERACTIVE CHIP SELECTOR TRAY (SPACIOUS & CENTERED) ================= */}
        {/* Matches Screenshot 2 chips: 10, 20, 100, 200, 1000, 2K, 10K */}
        <div 
          className="absolute z-30 flex items-center justify-between px-3 py-0.5 rounded-full bg-gradient-to-r from-[#2a130e]/95 via-[#190c12]/95 to-[#2a130e]/95 border border-amber-500/50 shadow-2xl"
          style={{ left: '22.0%', top: '86.0%', width: '58.0%', height: '11.0%' }}
        >
          {CHIP_VALUES.map((val) => {
            const affordable = user.balance >= val;
            return (
              <div
                key={val}
                className={`flex-1 flex justify-center transition-opacity ${affordable ? 'opacity-100' : 'opacity-45'}`}
              >
                <Chip
                  value={val}
                  size="md"
                  isSelected={selectedChip === val}
                  onClick={() => {
                    soundManager.playChipSound();
                    setSelectedChip(val);
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* ================= DRAGON TIGER LOGO SUPPORT CHATBOT BUTTON ================= */}
        <button
          onClick={() => {
            soundManager.playCashSound();
            setIsSupportOpen(true);
          }}
          className="absolute z-30 cursor-pointer hover:scale-105 active:scale-95 transition flex items-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full bg-gradient-to-r from-[#28130a]/95 via-slate-900/95 to-[#28130a]/95 border-2 border-amber-400/90 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
          style={{ left: '2.0%', top: '86.0%', height: '11.0%' }}
          title={isUr ? 'ڈریگن ٹائیگر سپورٹ چیٹ بوٹ' : 'Dragon Tiger Support Bot'}
        >
          <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-yellow-300 shrink-0">
            <img
              src="/assets/aistudio/IMG-20261113-WA5056_bdc6a48b.jpg"
              alt="Dragon Tiger Bot"
              draggable={false}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950 animate-pulse" />
          </div>
          <div className="text-left leading-tight">
            <div className="text-[10px] sm:text-xs font-black text-amber-300 flex items-center gap-1 whitespace-nowrap">
              <MessageCircle className="w-3 h-3 text-emerald-400" />
              <span>{isUr ? 'ہیلپ بوٹ' : 'Help Bot'}</span>
            </div>
            <div className="text-[8px] text-slate-300 font-bold whitespace-nowrap hidden sm:block">
              {isUr ? 'فوری مدد' : 'Ask Support'}
            </div>
          </div>
        </button>

        {/* ================= FAST WALLET (EASYPAISA & JAZZCASH FAST WALLET) ================= */}
        <button
          onClick={() => setIsWalletOpen(true)}
          className="absolute z-30 cursor-pointer hover:scale-105 active:scale-95 transition flex items-center justify-center gap-1.5 px-3 py-1 rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border-2 border-yellow-300 text-slate-950 font-black text-xs sm:text-sm shadow-2xl"
          style={{ left: '83.0%', top: '86.0%', width: '15.0%', height: '11.0%' }}
          title="Instant EasyPaisa & JazzCash Recharge / Withdraw"
        >
          <Wallet className="w-4 h-4 text-slate-950 shrink-0" />
          <span className="whitespace-nowrap">{isUr ? 'والٹ / ریچارج' : 'Wallet / Top Up'}</span>
        </button>

        {/* ================= 3-CONSECUTIVE-WIN FIRE STREAK OVERLAY ANIMATION ================= */}
        {streakOverlay && (
          <div className="absolute inset-0 z-45 pointer-events-none flex items-center justify-center overflow-hidden">
            {/* Blazing fire vignette backdrop */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.35)_0%,rgba(220,38,38,0.22)_45%,transparent_80%)] animate-pulse" />

            {/* Rising ember sparks */}
            <div className="absolute inset-0 overflow-hidden">
              {[12, 24, 38, 50, 62, 74, 86].map((leftPct, i) => (
                <span
                  key={leftPct}
                  className="absolute bottom-6 text-xl sm:text-2xl animate-fire-rise opacity-90"
                  style={{
                    left: `${leftPct}%`,
                    animationDelay: `${i * 0.14}s`,
                  }}
                >
                  {i % 2 === 0 ? '🔥' : '✨'}
                </span>
              ))}
            </div>

            {/* Centerpiece Fire Streak Banner */}
            <div className="relative animate-streak-pop px-7 py-4 rounded-3xl bg-gradient-to-b from-[#3b0c04]/95 via-[#1f0603]/95 to-[#2b0904]/95 border-2 border-orange-400 shadow-[0_0_55px_rgba(249,115,22,0.95),inset_0_0_25px_rgba(251,146,60,0.45)] text-center flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-7 h-7 sm:w-9 sm:h-9 text-orange-400 fill-orange-500 animate-bounce drop-shadow-[0_0_15px_rgba(249,115,22,1)]" />
                <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-orange-400 to-red-500 drop-shadow-[0_2px_10px_rgba(249,115,22,0.9)] tracking-wider">
                  {streakOverlay.streak}x WIN STREAK!
                </span>
                <Flame className="w-7 h-7 sm:w-9 sm:h-9 text-orange-400 fill-orange-500 animate-bounce drop-shadow-[0_0_15px_rgba(249,115,22,1)]" />
              </div>

              <div className="px-4 py-1 rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-red-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-widest shadow-lg">
                PLAYER ON FIRE • +Rs {streakOverlay.winAmount.toLocaleString()}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Embedded CSS for smooth 60fps chip throwing & Fire streak animations */}
      <style>{`
        @keyframes flyChipKeyframe {
          0% {
            left: var(--from-x);
            top: var(--from-y);
            transform: translate(-50%, -50%) scale(0.6);
            opacity: 0.9;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
          }
          100% {
            left: var(--to-x);
            top: var(--to-y);
            transform: translate(-50%, -50%) scale(1.0);
            opacity: 1;
          }
        }
        .animate-fly-chip {
          animation: flyChipKeyframe 0.42s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes streakPopKeyframe {
          0% {
            transform: scale(0.55);
            opacity: 0;
          }
          20% {
            transform: scale(1.08);
            opacity: 1;
          }
          35% {
            transform: scale(1);
          }
          85% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(0.92);
            opacity: 0;
          }
        }
        .animate-streak-pop {
          animation: streakPopKeyframe 3.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes fireRiseKeyframe {
          0% {
            transform: translateY(0) scale(0.7);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateY(-280px) scale(1.35);
            opacity: 0;
          }
        }
        .animate-fire-rise {
          animation: fireRiseKeyframe 2.1s ease-out infinite;
        }
        @keyframes fireProfileKeyframe {
          0%, 100% {
            box-shadow: 0 0 14px rgba(249, 115, 22, 0.85), 0 0 4px rgba(250, 204, 21, 0.8);
          }
          50% {
            box-shadow: 0 0 24px rgba(239, 68, 68, 1), 0 0 10px rgba(251, 146, 60, 1);
          }
        }
        .animate-fire-profile {
          animation: fireProfileKeyframe 1.2s ease-in-out infinite;
        }
      `}</style>

      {/* ================= MODALS & POPUPS ================= */}
      {/* Fast Transactions Modal: EasyPaisa & JazzCash */}
      <TransactionModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        balance={user.balance}
        onDeposit={(amount, method, txId) => {
          const res = gameStore.submitDeposit(amount, method, txId, user.id);
          return res.status;
        }}
        onWithdraw={(amount, method, accountTitle, accountNumber) => {
          return gameStore.submitWithdraw(amount, method, accountTitle, accountNumber, user.id);
        }}
        transactions={transactions.filter((t) => !t.userId || t.userId === user.id)}
      />

      <RoadmapModal
        isOpen={isRoadmapOpen}
        onClose={() => setIsRoadmapOpen(false)}
        history={history}
      />

      {/* Settings & Language Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        isMuted={isMuted}
        onToggleSound={() => {
          const muted = soundManager.toggleMute();
          setIsMuted(muted);
        }}
      />

      {/* Low-Balance Notification Toast (< 500 Rs) */}
      <LowBalanceToast
        show={showLowBalanceToast}
        balance={user.balance}
        onDepositClick={() => {
          setShowLowBalanceToast(false);
          setIsWalletOpen(true);
        }}
        onClose={() => setShowLowBalanceToast(false)}
      />

      {/* Dragon Tiger Support Chatbot Modal */}
      <SupportChatModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        user={user}
        transactions={transactions.filter((t) => !t.userId || t.userId === user.id)}
        currentView="TABLE"
        onOpenWallet={() => setIsWalletOpen(true)}
      />

      {/* Live Admin Control Panel Overlay (Set Next Cards while round runs!) */}
      {isAdminOpen && (
        <AdminPanel
          isOverlay={true}
          initialTab="CARDS"
          onClose={() => setIsAdminOpen(false)}
        />
      )}

    </div>
  );
};
