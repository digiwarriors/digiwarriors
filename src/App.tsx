import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Digimon } from './data/digimon';
import { useGameState } from './hooks/useGameState';
import Home from './pages/Home';
import Select from './pages/Select';
import Battle from './pages/Battle';
import Records from './pages/Records';
import Leaderboard from './pages/Leaderboard';
import Encyclopedia from './pages/Encyclopedia';
import DailyChallenge from './pages/DailyChallenge';
import { createDigimon } from './data/digimon';
import { recordDailyResult, ConstraintType } from './utils/dailyChallenge';

export default function App() {
  const [page, setPage] = useState('/');
  const [selectedDigimon, setSelectedDigimon] = useState<Digimon | null>(null);
  const [challengeConfig, setChallengeConfig] = useState<{ foeId: number; constraintType: ConstraintType } | null>(null);
  const { state, level, levelBonus, progressPercent, setName, addBattle, resetState, exportSave, importSave } = useGameState();

  const navigate = useCallback((newPage: string) => {
    setPage(newPage);
  }, []);

  const handleSelectDigimon = useCallback((digimon: Digimon) => {
    setChallengeConfig(null);
    setSelectedDigimon(digimon);
    setPage('/battle');
  }, []);

  const handleAcceptChallenge = useCallback((playerDigimonId: number, opponentDigimonId: number, constraintType: ConstraintType) => {
    const digimon = createDigimon(playerDigimonId);
    setSelectedDigimon(digimon);
    setChallengeConfig({ foeId: opponentDigimonId, constraintType });
    setPage('/battle');
  }, []);

  const handleBattleEnd = useCallback((
    result: 'win' | 'loss',
    myDigimon: Digimon,
    opponentDigimon: Digimon,
    turns: number
  ) => {
    addBattle({
      date: new Date().toISOString(),
      result,
      myDigimon: myDigimon.name,
      myDigimonId: myDigimon.id,
      opponentDigimon: opponentDigimon.name,
      opponentDigimonId: opponentDigimon.id,
      turnsPlayed: turns,
    });
  }, [addBattle]);

  const handleChallengeResult = useCallback((met: boolean) => {
    const newState = recordDailyResult(met);
    if (met) {
      const bonusWins = 3;
      for (let i = 0; i < bonusWins; i++) {
        addBattle({
          date: new Date().toISOString(),
          result: 'win',
          myDigimon: 'Daily Challenge',
          myDigimonId: 0,
          opponentDigimon: 'Challenge Foe',
          opponentDigimonId: 0,
          turnsPlayed: 0,
        });
      }
    }
    void newState;
    setChallengeConfig(null);
  }, [addBattle]);

  const renderPage = () => {
    switch (page) {
      case '/select':
        return <Select onNavigate={navigate} onSelectDigimon={handleSelectDigimon} />;
      case '/battle':
        if (!selectedDigimon) { navigate('/select'); return null; }
        return (
          <Battle
            playerDigimon={selectedDigimon}
            onNavigate={navigate}
            onBattleEnd={handleBattleEnd}
            levelBonus={levelBonus}
            playerName={state.name}
            forcedFoeId={challengeConfig?.foeId}
            challengeConstraint={challengeConfig?.constraintType}
            onChallengeResult={challengeConfig ? handleChallengeResult : undefined}
          />
        );
      case '/challenge':
        return <DailyChallenge onNavigate={navigate} onAccept={handleAcceptChallenge} />;
      case '/records':
        return <Records onNavigate={navigate} wins={state.wins} losses={state.losses} level={level} progressPercent={progressPercent} battles={state.battles} playerName={state.name} onReset={resetState} onExport={exportSave} onImport={importSave} />;
      case '/encyclopedia':
        return <Encyclopedia onNavigate={navigate} />;
      case '/leaderboard':
        return <Leaderboard onNavigate={navigate} playerName={state.name} />;
      default:
        return <Home onNavigate={navigate} wins={state.wins} losses={state.losses} level={level} playerName={state.name} onSetName={setName} />;
    }
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-screen relative bg-[#070b14]">
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
      <footer className="text-center py-3 text-[10px] text-slate-400">
        <a
          href="https://x.com/digiwarriorsfun"
          target="_blank"
          rel="noopener noreferrer"
          className="underline transition-colors hover:text-white"
        >
          x.com/digiwarriorsfun
        </a>
      </footer>
    </div>
  );
}
