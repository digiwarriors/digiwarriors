import { useState, useCallback, useEffect } from 'react';

export interface BattleRecord {
  id: string;
  date: string;
  result: 'win' | 'loss';
  myDigimon: string;
  myDigimonId: number;
  opponentDigimon: string;
  opponentDigimonId: number;
  turnsPlayed: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  wins: number;
  losses: number;
  level: number;
  winRate: number;
  isPlayer: boolean;
}

export interface GameState {
  name: string;
  wins: number;
  losses: number;
  battles: BattleRecord[];
}

const STORAGE_KEY = 'digiwarriors_state';
const LEADERBOARD_KEY = 'digiwarriors_leaderboard';

function getDefaultState(): GameState {
  return { name: '', wins: 0, losses: 0, battles: [] };
}

function loadState(): GameState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return getDefaultState();
}

function saveState(state: GameState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

// --- Leaderboard ---

const NPC_NAMES = [
  'Taichi', 'Yamato', 'Sora', 'Koshiro', 'Mimi', 'Joe', 'Takeru', 'Hikari',
  'Daisuke', 'Ken', 'Miyako', 'Iori', 'Takato', 'Ruki', 'Jenrya', 'Takuya',
  'Koji', 'Zoe', 'JP', 'Tommy', 'Marcus', 'Thomas', 'Yoshi', 'Keenan',
  'Mikey', 'Angie', 'Jeremy', 'Nene', 'Tagiru', 'Airu', 'Ryoma', 'Ren',
];

function seedLeaderboard(): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = NPC_NAMES.map((name, i) => {
    const wins = Math.floor(Math.random() * 50) + 5;
    const losses = Math.floor(Math.random() * 25);
    const level = Math.floor(wins / 3) + 1;
    const winRate = Math.round((wins / (wins + losses)) * 100);
    return { id: `npc-${i}`, name, wins, losses, level, winRate, isPlayer: false };
  });
  // Sort by wins desc, then winRate desc
  entries.sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);
  return entries;
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  const seeded = seedLeaderboard();
  try { localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(seeded)); } catch {}
  return seeded;
}

export function syncPlayerToLeaderboard(entry: Omit<LeaderboardEntry, 'isPlayer'>): LeaderboardEntry[] {
  const board = loadLeaderboard();
  // Remove old player entry
  const filtered = board.filter(e => !e.isPlayer);
  // Add updated player entry
  const playerEntry: LeaderboardEntry = { ...entry, isPlayer: true };
  const merged = [...filtered, playerEntry];
  // Sort: wins desc, then winRate desc
  merged.sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);
  // Keep top 50
  const trimmed = merged.slice(0, 50);
  try { localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed)); } catch {}
  return trimmed;
}

export function getTrainerLevel(wins: number): number {
  return Math.floor(wins / 3) + 1;
}

export function useGameState() {
  const [state, setState] = useState<GameState>(loadState);

  useEffect(() => { saveState(state); }, [state]);

  // Sync to leaderboard whenever wins/losses/name change
  useEffect(() => {
    if (!state.name) return;
    const total = state.wins + state.losses;
    const winRate = total > 0 ? Math.round((state.wins / total) * 100) : 0;
    syncPlayerToLeaderboard({
      id: 'player',
      name: state.name,
      wins: state.wins,
      losses: state.losses,
      level: getTrainerLevel(state.wins),
      winRate,
    });
  }, [state.name, state.wins, state.losses]);

  const setName = useCallback((name: string) => {
    setState(prev => ({ ...prev, name }));
  }, []);

  const addBattle = useCallback((record: Omit<BattleRecord, 'id'>) => {
    setState(prev => {
      const newRecord: BattleRecord = { ...record, id: Date.now().toString() };
      return {
        ...prev,
        wins: prev.wins + (record.result === 'win' ? 1 : 0),
        losses: prev.losses + (record.result === 'loss' ? 1 : 0),
        battles: [newRecord, ...prev.battles].slice(0, 50),
      };
    });
  }, []);

  const resetState = useCallback(() => {
    const newState = getDefaultState();
    setState(newState);
    saveState(newState);
  }, []);

  const exportSave = useCallback(() => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digiwarriors_${state.name || 'save'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importSave = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr) as GameState;
      if (
        typeof parsed.name !== 'string' ||
        typeof parsed.wins !== 'number' ||
        typeof parsed.losses !== 'number' ||
        !Array.isArray(parsed.battles)
      ) return false;
      setState(parsed);
      saveState(parsed);
      return true;
    } catch {
      return false;
    }
  }, []);

  const level = getTrainerLevel(state.wins);
  const levelBonus = (level - 1) * 5;
  const progressPercent = level >= 20 ? 100 : Math.round(((state.wins % 3) / 3) * 100);

  return {
    state,
    level,
    levelBonus,
    progressPercent,
    setName,
    addBattle,
    resetState,
    exportSave,
    importSave,
  };
}
