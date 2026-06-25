import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ALL_DIGIMON, DigimonType, TYPE_INFO, TYPE_EFFECTIVENESS,
  STATUS_INFO, capitalizeName, getDigivolution,
} from '../data/digimon';
import DigimonSprite from '../components/DigimonSprite';

interface EncyclopediaProps {
  onNavigate: (page: string) => void;
}

const LEVEL_COLORS: Record<string, { text: string; bg: string; ring: string }> = {
  Rookie:   { text: 'text-emerald-400', bg: 'bg-emerald-400/10',  ring: 'ring-emerald-400/40' },
  Champion: { text: 'text-blue-400',    bg: 'bg-blue-400/10',     ring: 'ring-blue-400/40' },
  Ultimate: { text: 'text-purple-400',  bg: 'bg-purple-400/10',   ring: 'ring-purple-400/40' },
  Mega:     { text: 'text-amber-400',   bg: 'bg-amber-400/10',    ring: 'ring-amber-400/40' },
};

const ALL_LEVELS = ['Rookie', 'Champion', 'Ultimate', 'Mega'];

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
      <span className="text-slate-500 font-body w-7 text-right shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-slate-300 font-body w-6 text-right text-[9px] shrink-0">{value}</span>
    </div>
  );
}

function EffectivenessChip({ label, mult, color }: { label: string; mult: number; color: string }) {
  const multLabel = mult === 0 ? '0×' : mult < 1 ? `½×` : mult > 1 ? `${mult}×` : '1×';
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[7px] rounded px-1 py-0.5 font-body font-medium"
      style={{ background: `${color}22`, color }}
    >
      {TYPE_INFO[label as DigimonType]?.emoji} {capitalizeName(label)} {multLabel}
    </span>
  );
}

function DetailPanel({ id, onClose }: { id: number; onClose: () => void }) {
  const digimon = ALL_DIGIMON.find(d => d.id === id)!;
  const evo = getDigivolution(id);
  const lc = LEVEL_COLORS[digimon.level] ?? LEVEL_COLORS.Rookie;

  const cond = digimon.evolveCondition === 'turn3'
    ? 'After turn 3'
    : digimon.evolveCondition === 'lowHp'
    ? 'When HP is low'
    : 'Anytime';

  const strengths: { type: string; mult: number; color: string }[] = [];
  const weaknesses: { type: string; mult: number; color: string }[] = [];

  (Object.entries(TYPE_EFFECTIVENESS) as [DigimonType, Partial<Record<DigimonType, number>>][]).forEach(
    ([atkType, chart]) => {
      let mult = 1;
      digimon.types.forEach(dt => {
        const e = chart[dt];
        if (e !== undefined) mult *= e;
      });
      if (mult > 1) strengths.push({ type: atkType, mult, color: TYPE_INFO[atkType].color });
      else if (mult < 1) weaknesses.push({ type: atkType, mult, color: TYPE_INFO[atkType].color });
    }
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-[#070b14]"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
    >
      {/* Header */}
      <div className="glass border-b border-slate-800/50 px-4 pt-4 pb-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-sm font-body">←</button>
        <div className="flex-1">
          <h1 className="font-pixel text-amber-400 text-[10px]">{digimon.name.toUpperCase()}</h1>
          <p className="text-slate-500 text-[9px] font-body">#{String(digimon.id).padStart(3, '0')} · {digimon.level}</p>
        </div>
        <span className={`text-[8px] font-pixel px-2 py-1 rounded-full ${lc.text} ${lc.bg}`}>
          {digimon.level.toUpperCase()}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Sprite + base stats */}
        <motion.div
          className="glass rounded-2xl p-4 flex gap-4"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        >
          <div className="shrink-0 flex flex-col items-center justify-center">
            <DigimonSprite src={digimon.sprite} name={digimon.name} types={digimon.types} size="xl" idle />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1 mb-3">
              {digimon.types.map(t => <TypeBadge key={t} type={t} />)}
            </div>
            <div className="space-y-1.5">
              <StatBar label="HP"  value={digimon.maxHp}    max={260} color="#4ade80" />
              <StatBar label="ATK" value={digimon.attack}   max={90}  color="#f87171" />
              <StatBar label="DEF" value={digimon.defense}  max={75}  color="#60a5fa" />
              <StatBar label="SPD" value={digimon.speed}    max={62}  color="#fbbf24" />
            </div>
          </div>
        </motion.div>

        {/* Moves */}
        <motion.div
          className="glass rounded-2xl p-4"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        >
          <p className="font-pixel text-[8px] text-slate-500 mb-3 uppercase tracking-wider">Moves</p>
          <div className="flex flex-col gap-2">
            {digimon.moves.map(move => (
              <div
                key={move.name}
                className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2.5"
              >
                <span
                  className="w-1 h-8 rounded-full shrink-0"
                  style={{ background: TYPE_INFO[move.type].color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] text-slate-200 font-body font-medium truncate">{move.name}</span>
                    {move.isSpecial && (
                      <span className="text-[7px] text-amber-400 font-pixel bg-amber-400/10 px-1 rounded">CHARGE</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[8px] rounded px-1 py-0.5 font-body" style={{ background: `${TYPE_INFO[move.type].color}22`, color: TYPE_INFO[move.type].color }}>
                      {TYPE_INFO[move.type].emoji} {capitalizeName(move.type)}
                    </span>
                    {move.statusEffect && (
                      <span className="text-[7px] text-purple-300/80 font-body">
                        {STATUS_INFO[move.statusEffect]?.emoji} {STATUS_INFO[move.statusEffect]?.label} {move.statusChance ? `${Math.round(move.statusChance * 100)}%` : ''}
                      </span>
                    )}
                    {move.selfStatus && (
                      <span className="text-[7px] font-body" style={{ color: STATUS_INFO[move.selfStatus]?.color }}>
                        {STATUS_INFO[move.selfStatus]?.emoji} {STATUS_INFO[move.selfStatus]?.label}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {move.heal ? (
                    <p className="text-emerald-400 font-pixel text-[9px]">HEAL {Math.round(move.heal * 100)}%</p>
                  ) : move.power > 0 ? (
                    <p className="text-amber-400 font-pixel text-[9px]">PWR {move.power}</p>
                  ) : null}
                  <p className="text-slate-500 font-body text-[8px]">PP {move.maxPp}</p>
                  <p className="text-slate-600 font-body text-[7px]">ACC {move.accuracy}%</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Digivolution */}
        {evo && (
          <motion.div
            className="glass rounded-2xl p-4"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
            <p className="font-pixel text-[8px] text-slate-500 mb-3 uppercase tracking-wider">Digivolution</p>
            <div className="flex items-center gap-4">
              <div className="text-center shrink-0">
                <DigimonSprite src={digimon.sprite} name={digimon.name} types={digimon.types} size="md" />
                <p className="font-pixel text-[8px] text-slate-400 mt-1">{digimon.name}</p>
              </div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-amber-400 text-lg">→</span>
                <span className="text-[8px] text-amber-400/60 font-body text-center">{cond}</span>
              </div>
              <div className="text-center shrink-0">
                <DigimonSprite src={evo.sprite} name={evo.name} types={evo.types} size="md" />
                <p className="font-pixel text-[8px] text-amber-400 mt-1">{evo.name}</p>
                <div className="flex gap-0.5 justify-center mt-1">
                  {evo.types.map(t => (
                    <span key={t} className="text-[9px]" title={capitalizeName(t)}>
                      {TYPE_INFO[t].emoji}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Type matchups */}
        {(strengths.length > 0 || weaknesses.length > 0) && (
          <motion.div
            className="glass rounded-2xl p-4"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          >
            <p className="font-pixel text-[8px] text-slate-500 mb-3 uppercase tracking-wider">Type Matchups (Incoming)</p>
            {weaknesses.length > 0 && (
              <div className="mb-3">
                <p className="text-[8px] text-red-400/70 font-body mb-1.5">Weak against</p>
                <div className="flex flex-wrap gap-1">
                  {weaknesses.sort((a, b) => a.mult - b.mult).map(w => (
                    <EffectivenessChip key={w.type} label={w.type} mult={w.mult} color="#f87171" />
                  ))}
                </div>
              </div>
            )}
            {strengths.length > 0 && (
              <div>
                <p className="text-[8px] text-emerald-400/70 font-body mb-1.5">Resists</p>
                <div className="flex flex-wrap gap-1">
                  {strengths.sort((a, b) => b.mult - a.mult).map(s => (
                    <EffectivenessChip key={s.type} label={s.type} mult={s.mult} color="#4ade80" />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function Encyclopedia({ onNavigate }: EncyclopediaProps) {
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<DigimonType | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  const allTypes = Object.keys(TYPE_INFO) as DigimonType[];

  const filtered = useMemo(() => {
    return ALL_DIGIMON.filter(d => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterLevel && d.level !== filterLevel) return false;
      if (filterType && !d.types.includes(filterType)) return false;
      return true;
    });
  }, [search, filterLevel, filterType]);

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14]">
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b border-slate-800/50 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => onNavigate('/')} className="text-slate-400 hover:text-white transition-colors text-sm font-body">←</button>
          <div className="flex-1">
            <h1 className="font-pixel text-amber-400 text-[10px]">DIGIMON ENCYCLOPEDIA</h1>
            <p className="text-slate-500 text-[9px] font-body">{filtered.length} of {ALL_DIGIMON.length} Digimon</p>
          </div>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 text-sm font-body text-white placeholder-slate-500 outline-none focus:border-amber-400/50 mb-2"
        />

        {/* Level filter */}
        <div className="flex gap-1.5 mb-2 overflow-x-auto no-scrollbar">
          {ALL_LEVELS.map(lvl => {
            const lc = LEVEL_COLORS[lvl];
            const active = filterLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setFilterLevel(active ? null : lvl)}
                className={`shrink-0 text-[8px] font-pixel px-2.5 py-1 rounded-full transition-all ${
                  active ? `${lc.text} ${lc.bg} ring-1 ${lc.ring}` : 'text-slate-500 bg-slate-800/40'
                }`}
              >
                {lvl.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Type filter */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {allTypes.map(type => {
            const active = filterType === type;
            return (
              <button
                key={type}
                onClick={() => setFilterType(active ? null : type)}
                title={capitalizeName(type)}
                className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all ${
                  active ? 'ring-2' : 'opacity-50 hover:opacity-80'
                }`}
                style={{
                  background: `${TYPE_INFO[type].color}${active ? '30' : '15'}`,
                  boxShadow: active ? `0 0 0 2px ${TYPE_INFO[type].color}70` : undefined,
                }}
              >
                {TYPE_INFO[type].emoji}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3 opacity-40">🔍</p>
            <p className="text-slate-500 font-body text-sm">No Digimon found</p>
            <button
              onClick={() => { setSearch(''); setFilterLevel(null); setFilterType(null); }}
              className="mt-3 text-amber-400/70 font-body text-xs underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {filtered.map((digimon, i) => {
              const lc = LEVEL_COLORS[digimon.level] ?? LEVEL_COLORS.Rookie;
              return (
                <motion.button
                  key={digimon.id}
                  onClick={() => setDetailId(digimon.id)}
                  className="relative rounded-2xl p-2 text-center bg-slate-800/40 hover:bg-slate-800/70 transition-all duration-200"
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.3), duration: 0.3 }}
                >
                  <span className={`absolute top-1.5 right-1.5 text-[6px] font-pixel px-1 py-0.5 rounded ${lc.text} ${lc.bg}`}>
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
        )}
      </div>

      {/* Detail slide-in */}
      <AnimatePresence>
        {detailId !== null && (
          <DetailPanel key={detailId} id={detailId} onClose={() => setDetailId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
