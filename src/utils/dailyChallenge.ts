import { ALL_DIGIMON } from '../data/digimon';

export type ConstraintType = 'swift' | 'blitz' | 'no_digivolve' | 'survive';

export interface ChallengeConstraint {
  type: ConstraintType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const CONSTRAINTS: Record<ConstraintType, ChallengeConstraint> = {
  swift:        { type: 'swift',        label: 'Swift Victory',  description: 'Win in 5 turns or fewer',      icon: '⚡', color: '#f7e44b' },
  blitz:        { type: 'blitz',        label: 'Blitz!',         description: 'Win in 3 turns or fewer',      icon: '💥', color: '#f97316' },
  no_digivolve: { type: 'no_digivolve', label: 'Pure Rookie',    description: 'Win without Digivolving',      icon: '🛡️', color: '#4a90d9' },
  survive:      { type: 'survive',      label: 'Underdog',       description: 'Win against a Champion+ foe',  icon: '🏆', color: '#a855f7' },
};

export interface DailyChallenge {
  date: string;
  playerDigimonId: number;
  opponentDigimonId: number;
  constraint: ChallengeConstraint;
}

export interface DailyChallengeState {
  lastCompletedDate: string | null;
  lastResult: 'met' | 'missed' | null;
  streak: number;
  totalCompleted: number;
}

const DAILY_KEY = 'digiwarriors_daily';

function dateSeed(dateStr: string): number {
  let h = 0;
  for (const c of dateStr) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDailyChallenge(): DailyChallenge {
  const date = todayStr();
  const seed = dateSeed(date);

  const rookies = ALL_DIGIMON.filter(d => d.level === 'Rookie');
  const constraintTypes: ConstraintType[] = ['swift', 'blitz', 'no_digivolve', 'survive'];
  const constraintType = constraintTypes[(seed >> 4) % constraintTypes.length];

  const playerIdx = seed % rookies.length;
  const player = rookies[playerIdx];

  let opponents = ALL_DIGIMON.filter(d => d.id !== player.id);
  if (constraintType === 'survive') {
    const harder = opponents.filter(d => d.level === 'Champion' || d.level === 'Ultimate' || d.level === 'Mega');
    if (harder.length > 0) opponents = harder;
  }

  const opponentIdx = (seed >> 8) % opponents.length;
  const opponent = opponents[opponentIdx];

  return {
    date,
    playerDigimonId: player.id,
    opponentDigimonId: opponent.id,
    constraint: CONSTRAINTS[constraintType],
  };
}

export function loadDailyChallengeState(): DailyChallengeState {
  try {
    const stored = localStorage.getItem(DAILY_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { lastCompletedDate: null, lastResult: null, streak: 0, totalCompleted: 0 };
}

export function saveDailyChallengeState(state: DailyChallengeState): void {
  try { localStorage.setItem(DAILY_KEY, JSON.stringify(state)); } catch {}
}

export function isDailyAttempted(): boolean {
  const state = loadDailyChallengeState();
  return state.lastCompletedDate === todayStr();
}

export function recordDailyResult(met: boolean): DailyChallengeState {
  const state = loadDailyChallengeState();
  const today = todayStr();
  if (state.lastCompletedDate === today) return state;

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newStreak = met
    ? (state.lastCompletedDate === yesterday ? state.streak + 1 : 1)
    : 0;

  const newState: DailyChallengeState = {
    lastCompletedDate: today,
    lastResult: met ? 'met' : 'missed',
    streak: newStreak,
    totalCompleted: met ? state.totalCompleted + 1 : state.totalCompleted,
  };
  saveDailyChallengeState(newState);
  return newState;
}
