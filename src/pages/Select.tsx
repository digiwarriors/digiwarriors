import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_DIGIMON, Digimon, DigimonType, TYPE_INFO, STATUS_INFO, capitalizeName, createDigimon, getDigivolution } from '../data/digimon';
import DigimonSprite from '../components/DigimonSprite';

interface SelectProps {
  onNavigate: (page: string) => void;
  onSelectDigimon: (digimon: Digimon) => void;
}

function TypeBadge({ type }: { type: DigimonType }) {
  const info = TYPE_INFO[type];
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-md text-white text-[8px] px-1.5 py-0.5 font-body font-medium"
      style={{ background: `${info.color}cc` }}
    >
      {info.emoji} {capitalizeName(type)}
    </span>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="text-slate-500 font-body w-7 text-right">{label}</span>
      <div className="flex-1 h-1 bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-slate-300 font-body w-5 text-right text-[9px]">{value}</span>
    </div>
  );
}

const LEVEL_COLORS: Record<string, string> = {
  Rookie: 'text-emerald-400 bg-emerald-400/10',
  Champion: 'text-blue-400 bg-blue-400/10',
  Ultimate: 'text-purple-400 bg-purple-400/10',
  Mega: 'text-amber-400 bg-amber-400/10',
};

export default function Select({ onNavigate, onSelectDigimon }: SelectProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = selectedId ? ALL_DIGIMON.find(d => d.id === selectedId) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14]">
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b border-slate-800/50 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/')}
            className="text-slate-400 hover:text-white transition-colors text-sm font-body"
          >
            ←
          </button>
          <h1 className="font-pixel text-amber-400 text-[10px]">SELECT DIGIMON</h1>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 pb-40">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {ALL_DIGIMON.map((digimon, i) => {
            const isSelected = selectedId === digimon.id;
            return (
              <motion.button
                key={digimon.id}
                onClick={() => setSelectedId(digimon.id)}
                className={`relative rounded-2xl p-2 text-center transition-all duration-200 ${
                  isSelected
                    ? 'bg-amber-400/10 ring-2 ring-amber-400/50'
                    : 'bg-slate-800/40 hover:bg-slate-800/70'
                }`}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02, duration: 0.3 }}
              >
                {/* Level badge */}
                <span
                  className={`absolute top-1.5 right-1.5 text-[6px] font-pixel px-1 py-0.5 rounded ${LEVEL_COLORS[digimon.level] || 'text-slate-400 bg-slate-400/10'}`}
                >
                  {digimon.level.slice(0, 3).toUpperCase()}
                </span>

                <DigimonSprite
                  src={digimon.sprite}
                  name={digimon.name}
                  types={digimon.types}
                  size="md"
                  className="mx-auto"
                />
                <p className="font-pixel text-[8px] text-slate-200 mt-1.5 truncate">{digimon.name}</p>
                <div className="flex gap-0.5 justify-center mt-1">
                  {digimon.types.map(t => (
                    <span
                      key={t}
                      className="w-3.5 h-3.5 rounded flex items-center justify-center text-[7px]"
                      style={{ background: `${TYPE_INFO[t].color}25` }}
                      title={capitalizeName(t)}
                    >
                      {TYPE_INFO[t].emoji}
                    </span>
                  ))}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto glass border-t border-slate-700/30 px-4 py-4 z-30"
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <DigimonSprite
                  src={selected.sprite}
                  name={selected.name}
                  types={selected.types}
                  size="lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-pixel text-amber-400 text-[10px]">{selected.name}</h3>
                  <span className="text-[8px] font-body text-slate-500">#{String(selected.id).padStart(3, '0')}</span>
                </div>
                <div className="flex gap-1 mb-2.5">
                  {selected.types.map(t => <TypeBadge key={t} type={t} />)}
                </div>
                <div className="space-y-1">
                  <StatBar label="HP" value={selected.maxHp} max={260} color="#4ade80" />
                  <StatBar label="ATK" value={selected.attack} max={90} color="#f87171" />
                  <StatBar label="DEF" value={selected.defense} max={75} color="#60a5fa" />
                  <StatBar label="SPD" value={selected.speed} max={62} color="#fbbf24" />
                </div>
              </div>
            </div>

            {/* Digivolution info */}
            {(() => {
              const evo = getDigivolution(selected.id);
              if (!evo) return null;
              const cond = selected.evolveCondition === 'turn3' ? 'After turn 3' : selected.evolveCondition === 'lowHp' ? 'When HP is low' : 'Anytime';
              return (
                <div className="flex items-center gap-2 mt-3 px-1">
                  <span className="text-[8px] text-amber-400/60 font-body">→</span>
                  <span className="text-[9px] text-amber-400 font-body font-medium">{evo.name}</span>
                  <span className="text-[7px] text-slate-500 font-body">({cond})</span>
                  <div className="flex gap-0.5 ml-auto">
                    {evo.types.map(t => (
                      <span key={t} className="w-3.5 h-3.5 rounded flex items-center justify-center text-[7px]" style={{ background: `${TYPE_INFO[t].color}25` }} title={capitalizeName(t)}>
                        {TYPE_INFO[t].emoji}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Moves preview */}
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {selected.moves.map(move => (
                <div key={move.name} className="flex items-center gap-1.5 bg-slate-800/50 rounded-lg px-2 py-1.5">
                  <span className="w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: TYPE_INFO[move.type].color }} />
                  <span className="text-[9px] text-slate-300 font-body truncate flex-1">{move.name}</span>
                  {move.isSpecial && <span className="text-[7px] text-amber-400 font-pixel">★</span>}
                  {move.heal ? (
                    <span className="text-[8px] text-emerald-400 font-pixel">HEAL</span>
                  ) : move.power > 0 ? (
                    <span className="text-[8px] text-amber-400/70 font-pixel">{move.power}</span>
                  ) : null}
                  {move.statusEffect && <span className="text-[6px] text-purple-300/60">{STATUS_INFO[move.statusEffect]?.label}</span>}
                </div>
              ))}
            </div>

            <motion.button
              onClick={() => onSelectDigimon(createDigimon(selected.id))}
              className="w-full bg-gradient-to-b from-amber-400 to-amber-500 text-gray-900 font-pixel text-[10px] py-3.5 rounded-2xl mt-3 shadow-lg shadow-amber-500/20"
              whileTap={{ scale: 0.97 }}
            >
              ⚔️ BATTLE WITH {selected.name.toUpperCase()}!
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
