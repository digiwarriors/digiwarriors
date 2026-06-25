import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LeaderboardEntry, loadLeaderboard } from '../hooks/useGameState';

interface LeaderboardProps {
  onNavigate: (page: string) => void;
  playerName: string;
}

function getRankSuffix(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
}

function getRankStyle(rank: number, isPlayer: boolean) {
  if (isPlayer) return 'bg-amber-400/10 border-amber-400/30';
  if (rank === 1) return 'bg-yellow-400/5 border-yellow-400/15';
  if (rank === 2) return 'bg-slate-400/5 border-slate-400/15';
  if (rank === 3) return 'bg-amber-700/5 border-amber-700/15';
  return 'bg-slate-800/30 border-slate-700/30';
}

function EntryRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const suffix = getRankSuffix(rank);
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.03, duration: 0.25 }}
      className={`flex items-center gap-3 p-3 rounded-xl border ${getRankStyle(rank, entry.isPlayer)}`}
    >
      {/* Rank */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        entry.isPlayer ? 'bg-amber-400/20' : rank <= 3 ? 'bg-slate-700/50' : 'bg-slate-800/50'
      }`}>
        {suffix ? (
          <span className="text-sm">{suffix}</span>
        ) : (
          <span className={`font-pixel text-[10px] ${entry.isPlayer ? 'text-amber-400' : 'text-slate-400'}`}>{rank}</span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`text-xs font-body font-semibold truncate ${entry.isPlayer ? 'text-amber-300' : 'text-slate-200'}`}>
            {entry.name}
          </p>
          {entry.isPlayer && (
            <span className="text-[7px] px-1.5 py-px rounded font-pixel bg-amber-400/20 text-amber-400 border border-amber-400/30">
              YOU
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[8px] text-slate-500 font-body">LV.{entry.level}</span>
          <span className="text-[8px] text-slate-600 font-body">·</span>
          <span className="text-[8px] text-slate-500 font-body">{entry.winRate}% WR</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-center">
          <p className={`font-pixel text-[11px] ${entry.isPlayer ? 'text-emerald-400' : 'text-emerald-400/70'}`}>{entry.wins}</p>
          <p className="text-[7px] text-slate-600 font-body">W</p>
        </div>
        <div className="text-center">
          <p className={`font-pixel text-[11px] ${entry.isPlayer ? 'text-red-400' : 'text-red-400/70'}`}>{entry.losses}</p>
          <p className="text-[7px] text-slate-600 font-body">L</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Leaderboard({ onNavigate, playerName }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'me'>('all');

  useEffect(() => {
    setEntries(loadLeaderboard());
  }, []);

  const displayEntries = filter === 'me'
    ? entries.filter(e => e.isPlayer)
    : entries;

  const playerRank = entries.findIndex(e => e.isPlayer) + 1;

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14]">
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b border-slate-800/50 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('/')} className="text-slate-400 hover:text-white transition-colors text-sm font-body">←</button>
          <div className="flex-1">
            <h1 className="font-pixel text-amber-400 text-[10px]">LEADERBOARD</h1>
            {playerName && <p className="text-slate-500 text-[9px] font-body">{playerName}</p>}
          </div>
          {playerRank > 0 && (
            <div className="glass rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
              <span className="text-amber-400 text-[10px]">🏆</span>
              <span className="font-pixel text-amber-400 text-[9px]">#{playerRank}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Top 3 podium */}
        {entries.length >= 3 && filter === 'all' && (
          <motion.div
            className="flex items-end justify-center gap-2 mb-6 pt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* 2nd place */}
            <div className="flex flex-col items-center w-24">
              <div className="w-10 h-10 rounded-full bg-slate-400/10 border border-slate-400/30 flex items-center justify-center mb-1">
                <span className="text-sm">🥈</span>
              </div>
              <p className="text-[9px] font-body text-slate-300 font-medium truncate w-full text-center">{entries[1].name}</p>
              <p className="text-[8px] font-pixel text-slate-400">{entries[1].wins}W</p>
              <div className="w-full h-16 bg-slate-400/8 rounded-t-lg mt-1 border-t border-x border-slate-400/20" />
            </div>
            {/* 1st place */}
            <div className="flex flex-col items-center w-28">
              <motion.div
                className="w-12 h-12 rounded-full bg-yellow-400/15 border border-yellow-400/40 flex items-center justify-center mb-1"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-lg">🥇</span>
              </motion.div>
              <p className={`text-[10px] font-body font-semibold truncate w-full text-center ${entries[0].isPlayer ? 'text-amber-300' : 'text-yellow-300'}`}>{entries[0].name}</p>
              <p className="text-[9px] font-pixel text-yellow-400">{entries[0].wins}W</p>
              <div className="w-full h-24 bg-yellow-400/8 rounded-t-lg mt-1 border-t border-x border-yellow-400/25" />
            </div>
            {/* 3rd place */}
            <div className="flex flex-col items-center w-24">
              <div className="w-10 h-10 rounded-full bg-amber-700/10 border border-amber-700/30 flex items-center justify-center mb-1">
                <span className="text-sm">🥉</span>
              </div>
              <p className="text-[9px] font-body text-slate-300 font-medium truncate w-full text-center">{entries[2].name}</p>
              <p className="text-[8px] font-pixel text-slate-400">{entries[2].wins}W</p>
              <div className="w-full h-12 bg-amber-700/8 rounded-t-lg mt-1 border-t border-x border-amber-700/20" />
            </div>
          </motion.div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-3">
          {(['all', 'me'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`font-pixel text-[8px] px-3 py-1.5 rounded-lg transition-all ${
                filter === f
                  ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                  : 'bg-slate-800/40 text-slate-500 border border-slate-700/30 hover:text-slate-300'
              }`}
            >
              {f === 'all' ? 'ALL' : 'MY RANK'}
            </button>
          ))}
        </div>

        {/* Entries list */}
        {displayEntries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3 opacity-50">🏆</p>
            <p className="text-slate-500 font-body text-sm">No rankings yet</p>
            <p className="text-slate-600 font-body text-xs mt-1 mb-4">Set your name and battle to appear here</p>
            <motion.button
              onClick={() => onNavigate('/select')}
              className="bg-gradient-to-b from-amber-400 to-amber-500 text-gray-900 font-pixel text-[9px] px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20"
              whileTap={{ scale: 0.97 }}
            >
              BATTLE NOW
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 pb-2">
            {displayEntries.map((entry, i) => {
              const rank = filter === 'me' ? entries.findIndex(e => e.isPlayer) + 1 : i + 1;
              return <EntryRow key={entry.id} entry={entry} rank={rank} />;
            })}
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div className="sticky bottom-0 px-4 py-4 glass border-t border-slate-800/30">
        <motion.button
          onClick={() => onNavigate('/select')}
          className="w-full bg-gradient-to-b from-amber-400 to-amber-500 text-gray-900 font-pixel text-xs py-4 rounded-2xl shadow-lg shadow-amber-500/20"
          whileTap={{ scale: 0.97 }}
        >
          ⚔️ BATTLE
        </motion.button>
      </div>
    </div>
  );
}
