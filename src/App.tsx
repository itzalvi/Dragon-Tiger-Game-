import React, { useState } from 'react';
import { TigerDragonTable } from './components/TigerDragonTable';
import { LobbyView } from './components/LobbyView';
import { SplashView } from './components/SplashView';
import { AuthView } from './components/AuthView';
import { LandscapeLockOverlay } from './components/LandscapeLockOverlay';
import { AdminPanel } from './components/AdminPanel';
import { UserProfile } from './types/game';
import { soundManager } from './utils/audio';
import { gameStore } from './utils/gameStore';
import { useGameStore } from './hooks/useGameStore';

type AppView = 'SPLASH' | 'AUTH' | 'TIGER_DRAGON' | 'LOBBY' | 'ADMIN';

export default function App() {
  const [initialRefCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('ref') || '';
    }
    return '';
  });

  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === '1' || window.location.hash === '#admin') {
        return 'ADMIN';
      }
    }
    return 'SPLASH';
  });

  const { activeUser: user, transactions } = useGameStore();

  // Start soothing piano BGM once past initial loading splash screen
  React.useEffect(() => {
    if (currentView === 'ADMIN' || currentView === 'SPLASH') return;
    soundManager.startBGM();
    const handleFirstGesture = () => {
      soundManager.startBGM();
    };
    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });
    window.addEventListener('click', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('click', handleFirstGesture);
    };
  }, [currentView]);

  const pendingCount = transactions.filter(
    (t) => (t.type === 'DEPOSIT' || t.type === 'WITHDRAW') && t.status === 'Pending'
  ).length;

  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    gameStore.updateActiveUser(updated);
  };

  const handleDeposit = (
    amount: number,
    method: 'EasyPaisa' | 'JazzCash' | 'AllBankQR',
    txId: string
  ) => {
    const res = gameStore.submitDeposit(amount, method, txId, user.id);
    return res.status;
  };

  const handleWithdraw = (
    amount: number,
    method: 'EasyPaisa' | 'JazzCash',
    accountTitle: string,
    accountNumber: string
  ) => {
    return gameStore.submitWithdraw(amount, method, accountTitle, accountNumber, user.id);
  };

  if (currentView === 'ADMIN') {
    return (
      <AdminPanel
        isOverlay={false}
        initialTab="OVERVIEW"
        onClose={() => setCurrentView(gameStore.isAuthenticated() ? 'LOBBY' : 'AUTH')}
      />
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      <LandscapeLockOverlay />
      {currentView === 'SPLASH' && (
        <SplashView
          onLoaded={() =>
            setCurrentView(gameStore.isAuthenticated() ? 'LOBBY' : 'AUTH')
          }
        />
      )}
      {currentView === 'AUTH' && (
        <AuthView
          initialRefCode={initialRefCode}
          onAuthenticated={() => setCurrentView('LOBBY')}
          onSecretAdminOpen={() => setCurrentView('ADMIN')}
        />
      )}
      {currentView === 'LOBBY' && (
        <LobbyView
          user={user}
          onEnterTigerDragon={() => setCurrentView('TIGER_DRAGON')}
          onOpenAdmin={() => setCurrentView('ADMIN')}
          onSignOut={() => {
            gameStore.signOut();
            setCurrentView('AUTH');
          }}
          onUpdateUser={handleUpdateUser}
          transactions={transactions.filter((t) => !t.userId || t.userId === user.id)}
          onDeposit={handleDeposit}
          onWithdraw={handleWithdraw}
          pendingCount={pendingCount}
        />
      )}
      {currentView === 'TIGER_DRAGON' && (
        <TigerDragonTable
          onBackToLobby={() => setCurrentView('LOBBY')}
        />
      )}
    </div>
  );
}
