import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TYPE_INFO, DigimonType } from '../data/digimon';

interface HomeProps {
  onNavigate: (page: string) => void;
  wins: number;
  losses: number;
  level: number;
  playerName: string;
  onSetName: (name: string) => void;
}

export default function Home({ onNavigate, wins, losses, level, playerName, onSetName }: HomeProps) {
  const typeKeys = Object.keys(TYPE_INFO) as DigimonType[];
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);
  const [showNamePrompt, setShowNamePrompt] = useState(!playerName);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed.length > 0) {
      onSetName(trimmed);
      setEditingName(false);
      setShowNamePrompt(false);
    }
  };

  const handleBattleClick = () => {
    if (!playerName) {
      setShowNamePrompt(true);
      return;
    }
    onNavigate('/select');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8 relative overflow-hidden">
      {/* Subtle animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #fbbf24, transparent 70%)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #f97316, transparent 70%)' }} />
        <div className="absolute top-1/2 right-1/3 w-56 h-56 rounded-full opacity-[0.02]" style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }} />
      </div>

      <motion.div
        className="relative z-10 text-center flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo */}
        <motion.div
          className="mb-4"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-7xl drop-shadow-lg">🐉</span>
        </motion.div>

        <h1
          className="font-pixel text-2xl sm:text-3xl text-amber-400 mb-1 tracking-wide"
          style={{ textShadow: '0 0 30px rgba(251,191,36,0.4), 0 2px 4px rgba(0,0,0,0.9)' }}
        >
          DIGI
        </h1>
        <h1
          className="font-pixel text-2xl sm:text-3xl text-orange-500 mb-6 tracking-wide"
          style={{ textShadow: '0 0 30px rgba(249,115,22,0.3), 0 2px 4px rgba(0,0,0,0.9)' }}
        >
          WARRIORS
        </h1>

        {/* Username area */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {playerName && !editingName ? (
            <button
              onClick={() => { setNameInput(playerName); setEditingName(true); }}
              className="group flex items-center gap-2 glass rounded-full px-5 py-2 hover:border-amber-400/40 transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-amber-400/15 flex items-center justify-center text-amber-400 text-xs font-pixel border border-amber-400/30">
                {playerName.charAt(0).toUpperCase()}
              </div>
              <span className="text-slate-200 font-body text-sm font-medium">{playerName}</span>
              <svg className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                placeholder="Enter your name..."
                maxLength={16}
                className="bg-slate-800/80 border border-amber-400/40 rounded-full px-4 py-2 text-sm font-body text-white placeholder-slate-500 outline-none focus:border-amber-400/60 w-48 text-center"
              />
              <motion.button
                onClick={handleSaveName}
                className="bg-amber-400 text-gray-900 font-pixel text-[8px] px-3 py-2 rounded-full"
                whileTap={{ scale: 0.95 }}
              >
                OK
              </motion.button>
            </div>
          )}
        </motion.div>

        <motion.p
          className="text-sm text-slate-400 font-body mb-4 max-w-[280px] leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Choose your Digimon and battle against wild opponents.
          Use type advantages, status effects, and digivolution to win!
        </motion.p>

        {/* Feature highlights */}
        <motion.div
          className="flex gap-3 mb-6 text-[10px] text-slate-500 font-body"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="flex items-center gap-1">🔥 Status</span>
          <span className="flex items-center gap-1">⭐ Digivolve</span>
          <span className="flex items-center gap-1">⚔️ Combo</span>
        </motion.div>

        {/* Stats pills */}
        <motion.div
          className="flex gap-2 mb-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="glass rounded-full px-4 py-1.5 flex items-center gap-1.5">
            <span className="text-amber-400 text-xs">⭐</span>
            <span className="text-amber-400 font-pixel text-[10px]">LV.{level}</span>
          </div>
          <div className="glass rounded-full px-4 py-1.5 flex items-center gap-1.5">
            <span className="text-emerald-400 font-pixel text-[10px]">{wins}W</span>
          </div>
          <div className="glass rounded-full px-4 py-1.5 flex items-center gap-1.5">
            <span className="text-red-400 font-pixel text-[10px]">{losses}L</span>
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="flex flex-col gap-3 w-full max-w-[280px]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <motion.button
            onClick={handleBattleClick}
            className="w-full bg-gradient-to-b from-amber-400 to-amber-500 text-gray-900 font-pixel text-xs py-4 rounded-2xl shadow-lg shadow-amber-500/20"
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
          >
            ⚔️ BATTLE
          </motion.button>

          <div className="flex gap-2">
            <motion.button
              onClick={() => onNavigate('/leaderboard')}
              className="flex-1 glass text-slate-300 font-pixel text-[9px] py-3 rounded-2xl"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
            >
              🏆 RANKINGS
            </motion.button>

            <motion.button
              onClick={() => onNavigate('/records')}
              className="flex-1 glass text-slate-300 font-pixel text-[9px] py-3 rounded-2xl"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
            >
              📊 RECORDS
            </motion.button>
          </div>

          <div className="flex gap-2">
            <motion.button
              onClick={() => onNavigate('/challenge')}
              className="flex-1 glass text-amber-300 font-pixel text-[9px] py-3 rounded-2xl border border-amber-400/20"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
            >
              🎯 DAILY
            </motion.button>
            <motion.button
              onClick={() => onNavigate('/encyclopedia')}
              className="flex-1 glass text-slate-300 font-pixel text-[9px] py-3 rounded-2xl"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
            >
              📖 DIGI-DEX
            </motion.button>
          </div>
        </motion.div>

        {/* Type icons */}
        <motion.div
          className="mt-12 flex flex-wrap justify-center gap-1 max-w-[280px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          {typeKeys.map((type, i) => (
            <motion.div
              key={type}
              className="w-6 h-6 rounded-md flex items-center justify-center text-[10px]"
              style={{ background: `${TYPE_INFO[type].color}15` }}
              whileHover={{ scale: 1.4, background: `${TYPE_INFO[type].color}30` }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + i * 0.03, duration: 0.3 }}
              title={type}
            >
              {TYPE_INFO[type].emoji}
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          className="text-slate-700 text-[9px] font-pixel mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          #DigiWarriors
        </motion.p>

        <motion.a
          href="https://orynth.dev/projects/metal-bugg"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          <img
            src="https://orynth.dev/api/badge/metal-bugg?theme=dark&style=default"
            alt="Featured on Orynth"
            width={200}
            height={62}
          />
        </motion.a>
      </motion.div>

      {/* Name prompt overlay for first-time users */}
      <AnimatePresence>
        {showNamePrompt && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass rounded-3xl p-8 w-full max-w-[300px] text-center"
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            >
              <div className="text-4xl mb-3">👋</div>
              <h2 className="font-pixel text-amber-400 text-sm mb-2">WELCOME, TAMER!</h2>
              <p className="text-slate-400 font-body text-xs mb-4">
                Enter your name to join the leaderboard and start battling!
              </p>
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                placeholder="Your name..."
                maxLength={16}
                className="w-full bg-slate-800/80 border border-amber-400/30 rounded-xl px-4 py-3 text-sm font-body text-white placeholder-slate-500 outline-none focus:border-amber-400/60 text-center mb-3"
              />
              <motion.button
                onClick={handleSaveName}
                className="w-full bg-gradient-to-b from-amber-400 to-amber-500 text-gray-900 font-pixel text-[10px] py-3 rounded-xl shadow-lg shadow-amber-500/20"
                whileTap={{ scale: 0.97 }}
                disabled={!nameInput.trim()}
              >
                START BATTLE →
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
