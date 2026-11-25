import { useEffect, useState } from 'react';
import {
  AdminSettings,
  AppLanguage,
  CardControlState,
  ManagedUser,
  Transaction,
  UserProfile,
} from '../types/game';
import { gameStore } from '../utils/gameStore';

export interface GameStoreSnapshot {
  users: ManagedUser[];
  activeUser: UserProfile;
  transactions: Transaction[];
  cardControl: CardControlState;
  settings: AdminSettings;
  language: AppLanguage;
}

function readSnapshot(): GameStoreSnapshot {
  return {
    users: gameStore.getUsers(),
    activeUser: gameStore.getActiveUser(),
    transactions: gameStore.getTransactions(),
    cardControl: gameStore.getCardControl(),
    settings: gameStore.getSettings(),
    language: gameStore.getLanguage(),
  };
}

export function useGameStore(): GameStoreSnapshot {
  const [snapshot, setSnapshot] = useState<GameStoreSnapshot>(() => readSnapshot());

  useEffect(() => {
    const handleSync = () => {
      setSnapshot(readSnapshot());
    };
    return gameStore.subscribe(handleSync);
  }, []);

  return snapshot;
}
