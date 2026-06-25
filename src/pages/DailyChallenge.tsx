import { useState } from 'react';
import { motion } from 'framer-motion';
import { ALL_DIGIMON, TYPE_INFO, capitalizeName } from '../data/digimon';
import DigimonSprite from '../components/DigimonSprite';
import {
  getDailyChallenge, loadDailyChallengeState, isDailyAttempted,
  ConstraintType,
} from '../utils/dailyChallenge';

interface DailyChallengeProps {
  onNavigate: (page: string) => void;
  onAccept: (playerDigimonId: number, opponentDigimonId: number, constraintType: ConstraintType) => void;
}

export default function DailyChallenge({ onNavigate, onAccept }: DailyChallengeProps) {
  const challenge = getDailyChallenge();
  const dailyState = loadDailyChallengeState();
  const attempted = isDailyAttempted();

  const playerDigimon = ALL_DIGIMON.find(d => d.id === challenge.playerDigimonId)!;
  const opponentDigimon = ALL_DIGIMON.find(d => d.id === challenge.opponentDigimonId)!;
  const { constraint } = challenge;

  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setAccepted(true);
    setTimeout(() => onAccept(challenge.playerDigimonId, challenge.opponentDigimonId, constraint.type), 300);
  };

  const dateLabel = new Date(challenge.date + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14]">
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b border-slate-800/50 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('/')} className="text-slate-400 hover:text-white transition-colors text-sm font-body">←</button>
          <div className="flex-1">
            <h1 className="font-pixel text-amber-400 text-[10px]">DAILY CHALLENGE</h1>
            <p className="text-slate-500 text-[9px] font-body">{dateLabel}</p>
          </div>
          {dailyState.streak > 0 && (
            <div className="glass rounded-lg px-2 py-1 flex items-center gap-1">
              <span className="text-orange-400 text-[10px]">🔥</span>
              <span className="font-pixel text-orange-400 text-[9px]">{dailyState.streak}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Stats strip */}
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        >
          {[
            { label: 'Completed', value: dailyState.totalCompleted, icon: '✅' },
            { label: 'Streak', value: `${dailyState.streak}🔥`, icon: '' },
            { label: 'Status', value: attempted ? (dailyState.lastResult === 'met' ? '✓ Done' : '✗ Missed') : 'Ready', icon: '' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              className="flex-1 glass rounded-xl p-3 text-center"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            >
              <p className="font-pixel text-amber-400 text-xs">{s.value}</p>
              <p className="text-slate-500 text-[8px] font-body mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Constraint card */}
        <motion.div
          className="glass rounded-2xl p-4"
          style={{ borderColor: `${constraint.color}30`, borderWidth: 1 }}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <p className="font-pixel text-[8px] text-slate-500 mb-2 uppercase tracking-wider">Today's Constraint</p>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: `${constraint.color}18` }}
            >
              {constraint.icon}
            </div>
            <div>
              <p className="font-pixel text-sm" style={{ color: constraint.color }}>{constraint.label}</p>
              <p className="text-slate-400 font-body text-xs mt-0.5">{constraint.description}</p>
            </div>
          </div>
          <div className="mt-3 px-3 py-2 rounded-xl" style={{ background: `${constraint.color}08` }}>
            <p className="text-[9px] font-body" style={{ color: `${constraint.color}cc` }}>
              {constraint.type === 'swift' && 'Plan your attacks carefully — deal heavy damage early to finish in 5 turns.'}
              {constraint.type === 'blitz' && 'You need to KO the opponent by turn 3. Use your strongest moves first!'}
              {constraint.type === 'no_digivolve' && 'Resist the urge to Digivolve — win the battle as a Rookie only.'}
              {constraint.type === 'survive' && 'Your opponent is tougher than usual. Play smart and outlast them!'}
            </p>
          </div>
        </motion.div>

        {/* Matchup */}
        <motion.div
          className="glass rounded-2xl p-4"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        >
          <p className="font-pixel text-[8px] text-slate-500 mb-3 uppercase tracking-wider">Today's Matchup</p>
          <div className="flex items-center gap-2">
            {/* Player Digimon */}
            <div className="flex-1 bg-emerald-400/5 rounded-xl p-3 text-center border border-emerald-400/15">
              <p className="text-[8px] font-pixel text-emerald-400 mb-2">YOUR FIGHTER</p>
              <DigimonSprite
                src={playerDigimon.sprite}
                name={playerDigimon.name}
                types={playerDigimon.types}
                size="lg"
                className="mx-auto"
                idle
              />
              <p className="font-pixel text-[9px] text-slate-200 mt-2">{playerDigimon.name}</p>
              <div className="flex gap-0.5 justify-center mt-1">
                {playerDigimon.types.map(t => (
                  <span key={t} className="text-[8px] rounded px-1 py-0.5 font-body" style={{ background: `${TYPE_INFO[t].color}22`, color: TYPE_INFO[t].color }}>
                    {TYPE_INFO[t].emoji} {capitalizeName(t)}
                  </span>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[8px]">
                <span className="text-red-400 font-body">ATK {playerDigimon.attack}</span>
                <span className="text-blue-400 font-body">DEF {playerDigimon.defense}</span>
                <span className="text-emerald-400 font-body">HP {playerDigimon.maxHp}</span>
                <span className="text-amber-400 font-body">SPD {playerDigimon.speed}</span>
              </div>
            </div>

            <div className="text-center shrink-0">
              <p className="font-pixel text-amber-400 text-sm">VS</p>
            </div>

            {/* Opponent Digimon */}
            <div className="flex-1 bg-red-400/5 rounded-xl p-3 text-center border border-red-400/15">
              <p className="text-[8px] font-pixel text-red-400 mb-2">OPPONENT</p>
              <DigimonSprite
                src={opponentDigimon.sprite}
                name={opponentDigimon.name}
                types={opponentDigimon.types}
                size="lg"
                className="mx-auto"
                idle
              />
              <p className="font-pixel text-[9px] text-slate-200 mt-2">{opponentDigimon.name}</p>
              <div className="flex gap-0.5 justify-center mt-1">
                {opponentDigimon.types.map(t => (
                  <span key={t} className="text-[8px] rounded px-1 py-0.5 font-body" style={{ background: `${TYPE_INFO[t].color}22`, color: TYPE_INFO[t].color }}>
                    {TYPE_INFO[t].emoji} {capitalizeName(t)}
                  </span>
                ))}
              </div>
              <p className="text-[8px] font-body mt-1" style={{ color: opponentDigimon.level === 'Rookie' ? '#4ade80' : opponentDigimon.level === 'Champion' ? '#60a5fa' : opponentDigimon.level === 'Ultimate' ? '#c084fc' : '#fbbf24' }}>
                {opponentDigimon.level}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Reward info */}
        <motion.div
          className="glass rounded-2xl p-4"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <p className="font-pixel text-[8px] text-slate-500 mb-2 uppercase tracking-wider">Rewards</p>
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <div>
                <p className="text-slate-200 font-pixel text-[9px]">+3 BONUS WINS</p>
                <p className="text-slate-500 font-body text-[8px]">Constraint met</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <div>
                <p className="text-slate-200 font-pixel text-[9px]">STREAK KEPT</p>
                <p className="text-slate-500 font-body text-[8px]">Win daily</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Already completed message */}
        {attempted && (
          <motion.div
            className={`rounded-2xl p-4 text-center ${dailyState.lastResult === 'met' ? 'bg-emerald-400/8 border border-emerald-400/20' : 'bg-red-400/8 border border-red-400/20'}`}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-2xl mb-1">{dailyState.lastResult === 'met' ? '🏆' : '💀'}</p>
            <p className={`font-pixel text-sm ${dailyState.lastResult === 'met' ? 'text-emerald-400' : 'text-red-400'}`}>
              {dailyState.lastResult === 'met' ? 'CHALLENGE COMPLETE!' : 'CONSTRAINT MISSED'}
            </p>
            <p className="text-slate-500 font-body text-xs mt-1">Come back tomorrow for a new challenge.</p>
          </motion.div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 px-4 py-4 glass border-t border-slate-800/30">
        {attempted ? (
          <motion.button
            onClick={() => onNavigate('/')}
            className="w-full glass text-slate-300 font-pixel text-xs py-4 rounded-2xl"
            whileTap={{ scale: 0.97 }}
          >
            ← BACK TO HOME
          </motion.button>
        ) : (
          <motion.button
            onClick={handleAccept}
            disabled={accepted}
            className="w-full bg-gradient-to-b from-amber-400 to-amber-500 text-gray-900 font-pixel text-xs py-4 rounded-2xl shadow-lg shadow-amber-500/20 disabled:opacity-60"
            whileTap={{ scale: 0.97 }}
            animate={accepted ? { scale: [1, 1.04, 0.97] } : {}}
          >
            {accepted ? 'LOADING...' : `🎯 ACCEPT CHALLENGE`}
          </motion.button>
        )}
      </div>
    </div>
  );
}
