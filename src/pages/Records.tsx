import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BattleRecord } from '../hooks/useGameState';

interface RecordsProps {
  onNavigate: (page: string) => void;
  wins: number;
  losses: number;
  level: number;
  progressPercent: number;
  battles: BattleRecord[];
  playerName: string;
  onReset: () => void;
  onExport: () => void;
  onImport: (jsonStr: string) => boolean;
}

function BattleRow({ record, index }: { record: BattleRecord; index: number }) {
  const isWin = record.result === 'win';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`flex items-center gap-3 p-3 rounded-xl ${
        isWin ? 'bg-emerald-400/5' : 'bg-red-400/5'
      }`}
    >
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-pixel ${
        isWin ? 'bg-emerald-400/15 text-emerald-400' : 'bg-red-400/15 text-red-400'
      }`}>
        {isWin ? 'W' : 'L'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-200 text-xs font-body truncate">
          {record.myDigimon} <span className="text-slate-500">vs</span> {record.opponentDigimon}
        </p>
        <p className="text-slate-500 text-[10px] font-body">{record.turnsPlayed} turns</p>
      </div>
      <div className="text-[9px] text-slate-600 font-body flex-shrink-0">
        {new Date(record.date).toLocaleDateString()}
      </div>
    </motion.div>
  );
}

export default function Records({ onNavigate, wins, losses, level, progressPercent, battles, playerName, onReset, onExport, onImport }: RecordsProps) {
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const ok = onImport(text);
      setImportStatus(ok ? 'success' : 'error');
      setTimeout(() => setImportStatus('idle'), 2500);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    onReset();
    setShowResetConfirm(false);
    onNavigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14]">
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b border-slate-800/50 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('/')} className="text-slate-400 hover:text-white transition-colors text-sm font-body">←</button>
          <div className="flex-1">
            <h1 className="font-pixel text-amber-400 text-[10px]">ARENA RECORDS</h1>
            {playerName && <p className="text-slate-500 text-[9px] font-body">{playerName}</p>}
          </div>
          <div className="glass rounded-lg px-2 py-1 flex items-center gap-1">
            <span className="text-amber-400 text-[10px]">⭐</span>
            <span className="font-pixel text-amber-400 text-[9px]">LV.{level}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Level progress */}
        <motion.div
          className="glass rounded-2xl p-4 mb-4"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-xs">⭐</span>
              <span className="font-pixel text-amber-400 text-[10px]">TAMER LEVEL {level}</span>
            </div>
            <span className="text-amber-400/40 text-[9px] font-body">+{(level - 1) * 5}% ATK</span>
          </div>
          <div className="h-1.5 bg-slate-700/40 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-amber-400 rounded-full"
              style={{ boxShadow: '0 0 8px rgba(251,191,36,0.5)' }}
              initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <p className="text-slate-500 text-[9px] font-body mt-1">{progressPercent}% to next level</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Wins', value: wins, color: 'text-emerald-400' },
            { label: 'Losses', value: losses, color: 'text-red-400' },
            { label: 'Win Rate', value: `${winRate}%`, color: 'text-amber-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="glass-light rounded-xl p-3 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <p className={`font-pixel text-sm ${stat.color}`}>{stat.value}</p>
              <p className="text-slate-500 text-[8px] font-body mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* History */}
        <p className="font-pixel text-[8px] text-slate-500 mb-2 uppercase tracking-wider">Battle History</p>
        {battles.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3 opacity-50">⚔️</p>
            <p className="text-slate-500 font-body text-sm">No battles yet</p>
            <p className="text-slate-600 font-body text-xs mt-1 mb-4">Start battling to see your records</p>
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
            {battles.map((record, i) => (
              <BattleRow key={record.id} record={record} index={i} />
            ))}
          </div>
        )}

        {/* Save Data section */}
        <motion.div
          className="mt-6 glass rounded-2xl p-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="font-pixel text-[8px] text-slate-500 mb-3 uppercase tracking-wider">Save Data</p>
          <div className="flex flex-col gap-2">
            {/* Export */}
            <motion.button
              onClick={onExport}
              className="flex items-center gap-3 w-full glass-light rounded-xl px-4 py-3 text-left hover:border-amber-400/30 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-lg">💾</span>
              <div className="flex-1">
                <p className="text-slate-200 font-pixel text-[9px]">EXPORT SAVE</p>
                <p className="text-slate-500 font-body text-[10px] mt-0.5">Download your progress as a file</p>
              </div>
              <span className="text-slate-600 text-xs">↓</span>
            </motion.button>

            {/* Import */}
            <motion.button
              onClick={handleImportClick}
              className="flex items-center gap-3 w-full glass-light rounded-xl px-4 py-3 text-left hover:border-emerald-400/30 transition-colors relative"
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-lg">📂</span>
              <div className="flex-1">
                <p className="text-slate-200 font-pixel text-[9px]">IMPORT SAVE</p>
                <p className="text-slate-500 font-body text-[10px] mt-0.5">Load progress from a file</p>
              </div>
              <AnimatePresence mode="wait">
                {importStatus === 'success' && (
                  <motion.span
                    key="ok"
                    className="text-emerald-400 text-[10px] font-pixel"
                    initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  >✓ OK</motion.span>
                )}
                {importStatus === 'error' && (
                  <motion.span
                    key="err"
                    className="text-red-400 text-[10px] font-pixel"
                    initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  >✗ ERR</motion.span>
                )}
                {importStatus === 'idle' && (
                  <motion.span key="arrow" className="text-slate-600 text-xs" exit={{ opacity: 0 }}>↑</motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />

            {/* Reset */}
            <motion.button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-3 w-full glass-light rounded-xl px-4 py-3 text-left hover:border-red-400/30 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-lg">🗑️</span>
              <div className="flex-1">
                <p className="text-red-400/80 font-pixel text-[9px]">RESET PROGRESS</p>
                <p className="text-slate-500 font-body text-[10px] mt-0.5">Erase all data and start over</p>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Bottom action */}
      <div className="sticky bottom-0 px-4 py-4 glass border-t border-slate-800/30">
        <motion.button
          onClick={() => onNavigate('/select')}
          className="w-full bg-gradient-to-b from-amber-400 to-amber-500 text-gray-900 font-pixel text-xs py-4 rounded-2xl shadow-lg shadow-amber-500/20"
          whileTap={{ scale: 0.97 }}
        >
          ⚔️ BATTLE AGAIN
        </motion.button>
      </div>

      {/* Reset confirm overlay */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass rounded-3xl p-8 w-full max-w-[300px] text-center"
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            >
              <div className="text-4xl mb-3">⚠️</div>
              <h2 className="font-pixel text-red-400 text-sm mb-2">RESET PROGRESS?</h2>
              <p className="text-slate-400 font-body text-xs mb-6 leading-relaxed">
                This will erase all your wins, losses, and battle history. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 glass text-slate-300 font-pixel text-[9px] py-3 rounded-xl"
                  whileTap={{ scale: 0.97 }}
                >
                  CANCEL
                </motion.button>
                <motion.button
                  onClick={handleReset}
                  className="flex-1 bg-red-500/80 text-white font-pixel text-[9px] py-3 rounded-xl"
                  whileTap={{ scale: 0.97 }}
                >
                  RESET
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
