import { Card, CardRank, CardSuit, BettingOption } from '../types/game';

export const SUITS: CardSuit[] = ['♠', '♥', '♣', '♦'];
export const RANKS: CardRank[] = [
  'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'
];

export function getRankValue(rank: CardRank): number {
  const idx = RANKS.indexOf(rank);
  return idx >= 0 ? idx + 1 : 1;
}

export function createSpecificCard(rank: CardRank, suit: CardSuit): Card {
  const value = getRankValue(rank);
  const color: 'red' | 'black' = suit === '♥' || suit === '♦' ? 'red' : 'black';
  return { suit, rank, value, color };
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let i = 0; i < RANKS.length; i++) {
      const rank = RANKS[i];
      const value = i + 1; // Ace = 1, King = 13
      const color = (suit === '♥' || suit === '♦') ? 'red' : 'black';
      deck.push({ suit, rank, value, color });
    }
  }
  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function drawCard(deck: Card[]): { card: Card; remainingDeck: Card[] } {
  let activeDeck = [...deck];
  if (activeDeck.length < 2) {
    activeDeck = createDeck();
  }
  const card = activeDeck.pop()!;
  return { card, remainingDeck: activeDeck };
}

export function determineWinner(dragonCard: Card, tigerCard: Card): BettingOption {
  if (dragonCard.value > tigerCard.value) {
    return 'DRAGON';
  } else if (tigerCard.value > dragonCard.value) {
    return 'TIGER';
  } else {
    return 'TIE';
  }
}

export function generateCardsForWinner(winner: BettingOption): { dragonCard: Card; tigerCard: Card } {
  const randomSuit = (): CardSuit => SUITS[Math.floor(Math.random() * SUITS.length)];

  if (winner === 'TIE') {
    const r = RANKS[Math.floor(Math.random() * RANKS.length)];
    const s1 = randomSuit();
    const otherSuits = SUITS.filter((s) => s !== s1);
    const s2 = otherSuits[Math.floor(Math.random() * otherSuits.length)];
    return {
      dragonCard: createSpecificCard(r, s1),
      tigerCard: createSpecificCard(r, s2),
    };
  }

  // Pick two distinct rank indices (0..12)
  const highIdx = 2 + Math.floor(Math.random() * (RANKS.length - 2)); // at least '3'
  const lowIdx = Math.floor(Math.random() * highIdx); // strictly lower than highIdx

  const highCard = createSpecificCard(RANKS[highIdx], randomSuit());
  const lowCard = createSpecificCard(RANKS[lowIdx], randomSuit());

  if (winner === 'DRAGON') {
    return { dragonCard: highCard, tigerCard: lowCard };
  }
  return { dragonCard: lowCard, tigerCard: highCard };
}
