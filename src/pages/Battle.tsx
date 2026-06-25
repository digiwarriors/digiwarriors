import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Digimon, DigimonType, StatusEffect, TYPE_INFO, STATUS_INFO, capitalizeName, getTypeEffectiveness, createDigimon, getDigivolution } from '../data/digimon';
import { calculateDamage, chooseAIMove, applyStatusDamage, delay, BattleStatus, createBattleStatus, LogType } from '../utils/battle';
import type { ConstraintType } from '../utils/dailyChallenge';
import DigimonSprite from '../components/DigimonSprite';

interface BattleProps {
  playerDigimon: Digimon;
  onNavigate: (page: string) => void;
  onBattleEnd: (result: 'win' | 'loss', myDigimon: Digimon, opponentDigimon: Digimon, turns: number) => void;
  levelBonus: number;
  playerName?: string;
  forcedFoeId?: number;
  challengeConstraint?: ConstraintType;
  onChallengeResult?: (met: boolean) => void;
}

function HPBar({ current, max }: { current: number; max: number }) {
  const percent = Math.max(0, (current / max) * 100);
  const color = percent > 50 ? '#4ade80' : percent > 20 ? '#fbbf24' : '#ef4444';
  return (
    <div className="h-2 bg-slate-700/40 rounded-full overflow-hidden">
      <motion.div className="h-full rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}66` }} animate={{ width: `${percent}%` }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
    </div>
  );
}

function TypePill({ type }: { type: DigimonType }) {
  const info = TYPE_INFO[type];
  return <span className="inline-flex items-center gap-0.5 rounded-md text-white text-[7px] px-1.5 py-0.5 font-body font-medium" style={{ background: `${info.color}bb` }}>{info.emoji} {capitalizeName(type)}</span>;
}

function StatusBadges({ status, buffs }: { status: StatusEffect; buffs: Set<string> }) {
  const items: { color: string; emoji: string; label: string }[] = [];
  if (status) items.push(STATUS_INFO[status]);
  buffs.forEach(b => { if (STATUS_INFO[b]) items.push(STATUS_INFO[b]); });
  if (items.length === 0) return null;
  return (
    <div className="flex gap-0.5 mt-0.5">
      {items.map((s, i) => (
        <span key={i} className="text-[7px] px-1 py-px rounded font-body font-bold" style={{ background: `${s.color}22`, color: s.color, border: `1px solid ${s.color}44` }}>
          {s.emoji} {s.label}
        </span>
      ))}
    </div>
  );
}

function EffectivenessLabel({ moveType, defenderTypes }: { moveType: DigimonType; defenderTypes: DigimonType[] }) {
  const eff = getTypeEffectiveness(moveType, defenderTypes);
  if (eff === 0) return <span className="text-[8px] font-pixel text-slate-600">0x</span>;
  if (eff >= 2) return <span className="text-[8px] font-pixel text-emerald-400 font-bold">2x</span>;
  if (eff > 1) return <span className="text-[8px] font-pixel text-emerald-300">1.5x</span>;
  if (eff < 1 && eff > 0) return <span className="text-[8px] font-pixel text-red-400/70">½x</span>;
  return null;
}

function SpeedLines({ direction, color }: { direction: 'left' | 'right'; color: string }) {
  return (
    <div className={`absolute top-1/2 -translate-y-1/2 ${direction === 'right' ? 'left-8' : 'right-8'} pointer-events-none z-0`}>
      {[...Array(6)].map((_, i) => (
        <motion.div key={i} className="mb-1 rounded-full" style={{ background: `${color}99`, height: 1.5 }}
          initial={{ width: 0, opacity: 0 }} animate={{ width: 25 + i * 10, opacity: [0, 0.9, 0] }} transition={{ duration: 0.25, delay: i * 0.025, ease: 'easeOut' }} />
      ))}
    </div>
  );
}

function HitFlash({ visible, target }: { visible: boolean; target: 'player' | 'foe' }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div className="absolute pointer-events-none z-20 rounded-lg"
          style={{ top: target === 'foe' ? '8%' : '55%', left: target === 'foe' ? '55%' : '5%', width: 130, height: 130 }}
          initial={{ opacity: 0 }} animate={{ opacity: [0, 0.7, 0, 0.4, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
          <div className="w-full h-full bg-white/80 rounded-lg" style={{ mixBlendMode: 'overlay' }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface LogEntry { text: string; type: LogType }
type Phase = 'intro' | 'choose-move' | 'player-attack' | 'ai-turn' | 'digivolve' | 'result';

export default function Battle({ playerDigimon, onNavigate, onBattleEnd, levelBonus, playerName, forcedFoeId, challengeConstraint, onChallengeResult }: BattleProps) {
  const [player, setPlayer] = useState<Digimon>({ ...playerDigimon, moves: playerDigimon.moves.map(m => ({ ...m })) });
  const [foe, setFoe] = useState<Digimon | null>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [turn, setTurn] = useState(0);
  const [combo, setCombo] = useState(0);
  const [battleStatus, setBattleStatus] = useState<BattleStatus>(createBattleStatus());
  const [showHitFlash, setShowHitFlash] = useState<{ player: boolean; foe: boolean }>({ player: false, foe: false });
  const [showSpeedLines, setShowSpeedLines] = useState<{ direction: 'left' | 'right'; color: string } | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [spritesReady, setSpritesReady] = useState(false);
  const [fainting, setFainting] = useState<{ player: boolean; foe: boolean }>({ player: false, foe: false });
  const [victorious, setVictorious] = useState<{ player: boolean; foe: boolean }>({ player: false, foe: false });
  const [digivolving, setDigivolving] = useState<{ player: boolean; foe: boolean }>({ player: false, foe: false });
  const [digivolveReady, setDigivolveReady] = useState(false);
  const [result, setResult] = useState<'win' | 'loss' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [challengeResult, setChallengeResult] = useState<'met' | 'missed' | null>(null);
  const digivolvedRef = useRef(false);
  const challengeConstraintRef = useRef(challengeConstraint);
  const onChallengeResultRef = useRef(onChallengeResult);
  useEffect(() => { challengeConstraintRef.current = challengeConstraint; }, [challengeConstraint]);
  useEffect(() => { onChallengeResultRef.current = onChallengeResult; }, [onChallengeResult]);
  const [effectTarget, setEffectTarget] = useState<{ type: DigimonType; target: 'player' | 'foe'; visible: boolean }>({ type: 'fire', target: 'foe', visible: false });
  const [dmgDisplay, setDmgDisplay] = useState<{ damage: number; isCritical: boolean; target: 'player' | 'foe'; visible: boolean }>({ damage: 0, isCritical: false, target: 'foe', visible: false });

  const logRef = useRef<HTMLDivElement>(null);
  const playerAnim = useAnimation();
  const foeAnim = useAnimation();

  // Generate opponent
  useEffect(() => {
    const allIds = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];
    const otherIds = allIds.filter(id => id !== playerDigimon.id);
    const randomId = (forcedFoeId && otherIds.includes(forcedFoeId)) ? forcedFoeId : otherIds[Math.floor(Math.random() * otherIds.length)];
    const opponent = createDigimon(randomId);
    setFoe(opponent);
    addLog({ text: `A wild ${opponent.name} appeared!`, type: 'info' });
    addLog({ text: `Go, ${playerDigimon.name}!`, type: 'info' });
    setTimeout(() => setSpritesReady(true), 300);
    setTimeout(() => setPhase('choose-move'), 1400);
  }, []);

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }); }, [logs]);

  // Check digivolve availability
  useEffect(() => {
    if (!playerDigimon.evolvesTo) return;
    const cond = playerDigimon.evolveCondition;
    if (cond === 'turn3' && turn >= 3) setDigivolveReady(true);
    if (cond === 'lowHp' && player.hp > 0 && player.hp / player.maxHp <= 0.35) setDigivolveReady(true);
    if (cond === 'always') setDigivolveReady(true);
  }, [turn, player.hp, player.maxHp]);

  const addLog = useCallback((entry: LogEntry) => { setLogs(prev => [...prev.slice(-25), entry]); }, []);

  const showTypeEffect = useCallback((type: DigimonType, target: 'player' | 'foe') => {
    setEffectTarget({ type, target, visible: true });
    setTimeout(() => setEffectTarget(prev => ({ ...prev, visible: false })), 700);
  }, []);

  const showDamage = useCallback((damage: number, isCritical: boolean, target: 'player' | 'foe') => {
    setDmgDisplay({ damage, isCritical, target, visible: true });
    setTimeout(() => setDmgDisplay(prev => ({ ...prev, visible: false })), 1100);
  }, []);

  const flashHit = useCallback((target: 'player' | 'foe') => {
    setShowHitFlash(prev => ({ ...prev, [target]: true }));
    setTimeout(() => setShowHitFlash(prev => ({ ...prev, [target]: false })), 400);
  }, []);

  const shakeScreen = useCallback(() => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 400);
  }, []);

  // Digivolve handler
  const handleDigivolve = useCallback(async () => {
    if (!digivolveReady || !playerDigimon.evolvesTo || phase !== 'choose-move') return;
    setPhase('digivolve');
    setDigivolving(prev => ({ ...prev, player: true }));
    digivolvedRef.current = true;
    addLog({ text: `${player.name} is DIGIVOLVING!`, type: 'digivolve' });
    shakeScreen();

    await delay(1200);

    const evoData = getDigivolution(player.id);
    if (evoData) {
      const hpPercent = player.hp / player.maxHp;
      const evolved = createDigimon(evoData.id);
      evolved.hp = Math.max(1, Math.floor(evolved.maxHp * hpPercent));
      setPlayer(evolved);
      addLog({ text: `${player.name} digivolved to ${evolved.name}!`, type: 'digivolve' });
      setBattleStatus(prev => ({ ...prev, player: null, playerBuffs: new Set() }));
    }

    setDigivolving(prev => ({ ...prev, player: false }));
    setDigivolveReady(false);
    await delay(600);
    setPhase('choose-move');
  }, [digivolveReady, playerDigimon, phase, player, addLog, shakeScreen]);

  // Process status effects at start of turn
  const processStatusTick = useCallback(async (who: 'player' | 'foe', digimon: Digimon, status: StatusEffect): Promise<Digimon> => {
    if (!status) return digimon;
    const { damage, logs: statusLogs } = applyStatusDamage(digimon, status);
    for (const log of statusLogs) addLog(log);
    if (damage > 0) {
      const updated = { ...digimon, hp: Math.max(0, digimon.hp - damage) };
      if (who === 'player') setPlayer(updated);
      else setFoe(updated);
      return updated;
    }
    return digimon;
  }, [addLog]);

  const handlePlayerMove = useCallback(async (moveIndex: number) => {
    if (phase !== 'choose-move' || !foe) return;
    const move = player.moves[moveIndex];
    if (move.pp <= 0) return;

    setPhase('player-attack');
    const updatedPlayer = { ...player, moves: player.moves.map((m, i) => i === moveIndex ? { ...m, pp: m.pp - 1 } : m) };
    setPlayer(updatedPlayer);
    addLog({ text: `${player.name} used ${move.name}!`, type: 'info' });

    // Process player status tick
    let currentPlayer = await processStatusTick('player', updatedPlayer, battleStatus.player);

    // If burned/poisoned and fainted
    if (currentPlayer.hp <= 0) {
      addLog({ text: `${currentPlayer.name} was defeated!`, type: 'lose' });
      setFainting(prev => ({ ...prev, player: true }));
      setResult('loss'); setPhase('result');
      onBattleEnd('loss', currentPlayer, foe, turn + 1);
      setTimeout(() => setShowResult(true), 1200);
      return;
    }

    // Attack animation
    setShowSpeedLines({ direction: 'right', color: TYPE_INFO[move.type].color });

    // Special move: charge up first
    if (move.isSpecial) {
      addLog({ text: `${player.name} is charging power...`, type: 'status' });
      await delay(500);
    }

    await playerAnim.start({
      x: [0, 55, -8, 0], y: [0, -25, 4, 0], scale: [1, 1.18, 0.96, 1], rotate: [0, -4, 2, 0],
      transition: { duration: 0.45, ease: [0.2, 0.8, 0.3, 1] },
    });
    setShowSpeedLines(null);

    const result = calculateDamage(currentPlayer, foe, move, battleStatus.player, battleStatus.playerBuffs, battleStatus.foeBuffs);
    const levelMultiplier = 1 + levelBonus / 100;
    const adjustedDamage = result.damage > 0 ? Math.floor(result.damage * levelMultiplier * (1 + combo * 0.05)) : result.damage;

    for (const log of result.logs) addLog(log);

    // Apply status effect
    if (result.statusApplied !== undefined) {
      if (result.statusApplied === null) {
        // Thawed out
        setBattleStatus(prev => ({ ...prev, foe: null }));
        addLog({ text: `${foe.name} thawed out!`, type: 'status' });
      } else if (result.statusApplied && !battleStatus.foe) {
        setBattleStatus(prev => ({ ...prev, foe: result.statusApplied! }));
        addLog({ text: `${foe.name} got ${result.statusApplied}!`, type: 'status' });
      }
    }

    // Apply self buff
    if (result.selfBuff) {
      setBattleStatus(prev => {
        const newBuffs = new Set(prev.playerBuffs);
        newBuffs.add(result.selfBuff!);
        return { ...prev, playerBuffs: newBuffs };
      });
      addLog({ text: `${player.name}'s ${result.selfBuff === 'atkUp' ? 'attack' : result.selfBuff === 'defUp' ? 'defense' : 'speed'} rose!`, type: 'status' });
    }

    let updatedFoe = { ...foe };
    if (!result.missed) {
      if (adjustedDamage < 0) {
        const newHp = Math.min(currentPlayer.maxHp, currentPlayer.hp - adjustedDamage);
        currentPlayer = { ...currentPlayer, hp: newHp };
        setPlayer(currentPlayer);
        showTypeEffect(move.type, 'player');
      } else if (adjustedDamage > 0) {
        showTypeEffect(move.type, 'foe');
        showDamage(adjustedDamage, result.isCritical, 'foe');
        flashHit('foe');
        if (result.isCritical || result.effectiveness >= 2) shakeScreen();

        foeAnim.start({
          x: [0, -18, 14, -10, 6, -3, 0], y: [0, 8, -6, 4, -2, 1, 0], scale: [1, 0.88, 1.06, 0.94, 1.02, 1],
          transition: { duration: 0.5, ease: 'easeOut' },
        });

        updatedFoe = { ...foe, hp: Math.max(0, foe.hp - adjustedDamage) };
        setFoe(updatedFoe);
        setCombo(prev => prev + 1);
      }
    } else {
      setCombo(0);
    }

    await delay(600);

    // Check foe faint
    if (updatedFoe.hp <= 0) {
      addLog({ text: `${updatedFoe.name} was defeated!`, type: 'win' });
      setFainting(prev => ({ ...prev, foe: true }));
      setResult('win'); setPhase('result');
      setVictorious(prev => ({ ...prev, player: true }));
      onBattleEnd('win', currentPlayer, updatedFoe, turn + 1);
      if (challengeConstraintRef.current) {
        const t = turn + 1;
        const c = challengeConstraintRef.current;
        const met = c === 'swift' ? t <= 5 : c === 'blitz' ? t <= 3 : c === 'no_digivolve' ? !digivolvedRef.current : true;
        setChallengeResult(met ? 'met' : 'missed');
        onChallengeResultRef.current?.(met);
      }
      setTimeout(() => setShowResult(true), 1200);
      return;
    }

    // === AI TURN ===
    setPhase('ai-turn');
    await delay(500);

    // Process foe status tick
    let currentFoe = await processStatusTick('foe', updatedFoe, battleStatus.foe);
    if (currentFoe.hp <= 0) {
      addLog({ text: `${currentFoe.name} was defeated!`, type: 'win' });
      setFainting(prev => ({ ...prev, foe: true }));
      setResult('win'); setPhase('result');
      setVictorious(prev => ({ ...prev, player: true }));
      onBattleEnd('win', currentPlayer, currentFoe, turn + 1);
      if (challengeConstraintRef.current) {
        const t = turn + 1;
        const c = challengeConstraintRef.current;
        const met = c === 'swift' ? t <= 5 : c === 'blitz' ? t <= 3 : c === 'no_digivolve' ? !digivolvedRef.current : true;
        setChallengeResult(met ? 'met' : 'missed');
        onChallengeResultRef.current?.(met);
      }
      setTimeout(() => setShowResult(true), 1200);
      return;
    }

    const aiMove = chooseAIMove(currentFoe, currentPlayer, battleStatus.foe);
    addLog({ text: `${currentFoe.name} used ${aiMove.name}!`, type: 'info' });

    // AI charge
    if (aiMove.isSpecial) {
      addLog({ text: `${currentFoe.name} is charging power...`, type: 'status' });
      await delay(400);
    }

    setShowSpeedLines({ direction: 'left', color: TYPE_INFO[aiMove.type].color });
    await foeAnim.start({
      x: [0, -55, 8, 0], y: [0, 25, -4, 0], scale: [1, 1.18, 0.96, 1], rotate: [0, 4, -2, 0],
      transition: { duration: 0.45, ease: [0.2, 0.8, 0.3, 1] },
    });
    setShowSpeedLines(null);

    const aiResult = calculateDamage(currentFoe, currentPlayer, aiMove, battleStatus.foe, battleStatus.foeBuffs, battleStatus.playerBuffs);
    for (const log of aiResult.logs) addLog(log);

    currentFoe = { ...currentFoe, moves: currentFoe.moves.map(m => m.name === aiMove.name ? { ...m, pp: m.pp - 1 } : m) };
    setFoe(currentFoe);

    // Apply AI status
    if (aiResult.statusApplied === null) {
      setBattleStatus(prev => ({ ...prev, player: null }));
    } else if (aiResult.statusApplied && !battleStatus.player) {
      setBattleStatus(prev => ({ ...prev, player: aiResult.statusApplied! }));
      addLog({ text: `${player.name} got ${aiResult.statusApplied}!`, type: 'status' });
    }

    if (aiResult.selfBuff) {
      setBattleStatus(prev => {
        const newBuffs = new Set(prev.foeBuffs);
        newBuffs.add(aiResult.selfBuff!);
        return { ...prev, foeBuffs: newBuffs };
      });
    }

    let updatedPlayer2 = { ...currentPlayer };
    if (!aiResult.missed) {
      if (aiResult.damage < 0) {
        const newHp = Math.min(currentFoe.maxHp, currentFoe.hp - aiResult.damage);
        setFoe(prev => prev ? { ...prev, hp: newHp } : prev);
      } else if (aiResult.damage > 0) {
        showTypeEffect(aiMove.type, 'player');
        showDamage(aiResult.damage, aiResult.isCritical, 'player');
        flashHit('player');
        if (aiResult.isCritical || aiResult.effectiveness >= 2) shakeScreen();

        playerAnim.start({
          x: [0, 18, -14, 10, -6, 3, 0], y: [0, -8, 6, -4, 2, -1, 0], scale: [1, 0.88, 1.06, 0.94, 1.02, 1],
          transition: { duration: 0.5, ease: 'easeOut' },
        });

        updatedPlayer2 = { ...currentPlayer, hp: Math.max(0, currentPlayer.hp - aiResult.damage) };
        setPlayer(updatedPlayer2);
      }
    }

    await delay(600);

    if (updatedPlayer2.hp <= 0) {
      addLog({ text: `${updatedPlayer2.name} was defeated!`, type: 'lose' });
      setFainting(prev => ({ ...prev, player: true }));
      setResult('loss'); setPhase('result');
      onBattleEnd('loss', updatedPlayer2, currentFoe, turn + 1);
      setTimeout(() => setShowResult(true), 1200);
      return;
    }

    setTurn(prev => prev + 1);
    setPhase('choose-move');
  }, [phase, player, foe, turn, combo, levelBonus, battleStatus, addLog, processStatusTick, showTypeEffect, showDamage, flashHit, shakeScreen, onBattleEnd, playerAnim, foeAnim]);

  if (!foe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b14]">
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}><span className="text-5xl block">🥚</span></motion.div>
          <p className="font-pixel text-amber-400/80 text-[10px] mt-4">LOADING ARENA...</p>
        </motion.div>
      </div>
    );
  }

  const canAct = phase === 'choose-move';
  const evoData = playerDigimon.evolvesTo ? getDigivolution(player.id) : null;

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-b from-[#070b14] via-[#0d0a1a] to-[#070b14] select-none ${screenShake ? 'screen-shake' : ''}`}>
      {/* Top bar */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <button onClick={() => onNavigate('/select')} className="text-slate-500 hover:text-slate-300 transition-colors text-sm font-body">← Flee</button>
        <div className="flex items-center gap-2">
          {playerName && <span className="text-slate-500 text-[9px] font-body">{playerName}</span>}
          {combo > 1 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="font-pixel text-[8px] text-amber-400">🔥 x{combo}</motion.span>}
          <span className="font-pixel text-amber-400/60 text-[9px]">TURN {turn + 1}</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Foe info */}
      <div className="px-4 pt-1 pb-1">
        <div className="glass rounded-2xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-pixel text-slate-100 text-[10px]">{foe.name}</p>
                <span className="text-[7px] px-1 py-px rounded font-body font-medium bg-slate-700/50 text-slate-400">{foe.level}</span>
              </div>
              <div className="flex gap-1 mt-1">{foe.types.map(t => <TypePill key={t} type={t} />)}</div>
              <StatusBadges status={battleStatus.foe} buffs={battleStatus.foeBuffs} />
            </div>
            <div className="text-right">
              <span className="text-slate-600 text-[8px] font-body">#{String(foe.id).padStart(3, '0')}</span>
              <p className="text-amber-400/50 text-[9px] font-pixel mt-0.5">SPD {foe.speed}</p>
            </div>
          </div>
          <HPBar current={foe.hp} max={foe.maxHp} />
          <p className="text-slate-500 text-[9px] font-body mt-0.5">{foe.hp}/{foe.maxHp} HP</p>
        </div>
      </div>

      {/* Battle field */}
      <div className="relative flex-1 min-h-[200px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/8 via-transparent to-indigo-950/8 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#070b14]/90 to-transparent pointer-events-none" />

        {/* Animated background particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <motion.div key={i} className="absolute w-1 h-1 rounded-full bg-amber-400/20"
              style={{ left: `${20 + i * 30}%`, top: `${30 + i * 15}%` }}
              animate={{ y: [0, -40, 0], opacity: [0, 0.5, 0] }}
              transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.7, ease: 'easeInOut' }}
            />
          ))}
        </div>

        <AnimatePresence>{showSpeedLines && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}><SpeedLines direction={showSpeedLines.direction} color={showSpeedLines.color} /></motion.div>}</AnimatePresence>

        {/* Foe sprite */}
        <motion.div className="absolute right-4 top-2 z-10" animate={foeAnim}>
          <motion.div initial={{ x: 80, opacity: 0, scale: 0.8 }} animate={spritesReady ? { x: 0, opacity: 1, scale: 1 } : {}} transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}>
            <DigimonSprite src={foe.sprite} name={foe.name} types={foe.types} size="xl" idle={!fainting.foe && !victorious.foe && !digivolving.foe} fainting={fainting.foe} victorious={victorious.foe} />
          </motion.div>
        </motion.div>

        {/* Player sprite */}
        <motion.div className="absolute left-2 bottom-2 z-10" animate={playerAnim}>
          <motion.div initial={{ x: -80, opacity: 0, scale: 0.8 }} animate={spritesReady ? { x: 0, opacity: 1, scale: 1 } : {}} transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}>
            <DigimonSprite src={player.sprite} name={player.name} types={player.types} size="xl" idle={!fainting.player && !victorious.player && !digivolving.player} fainting={fainting.player} victorious={victorious.player} />
          </motion.div>
        </motion.div>

        <HitFlash visible={showHitFlash.foe} target="foe" />
        <HitFlash visible={showHitFlash.player} target="player" />

        {/* Digivolve overlay */}
        <AnimatePresence>
          {digivolving.player && (
            <motion.div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="absolute inset-0 bg-amber-400/20" animate={{ opacity: [0, 0.4, 0.2, 0.5, 0] }} transition={{ duration: 1.2 }} />
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="absolute rounded-full border-2 border-amber-400"
                  style={{ top: '60%', left: '25%', transform: 'translate(-50%, -50%)' }}
                  animate={{ width: [10, 200 + i * 60], height: [10, 200 + i * 60], opacity: [0.9, 0], borderWidth: [2, 0.5] }}
                  transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }}
                />
              ))}
              <motion.div className="absolute font-pixel text-amber-300 text-sm" style={{ top: '45%', left: '50%', transform: 'translate(-50%,-50%)', textShadow: '0 0 20px rgba(251,191,36,0.8)' }}
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: [0.5, 1.3, 1], opacity: [0, 1, 1] }} transition={{ duration: 0.6 }}>
                DIGIVOLVE!
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Type effect overlay */}
        <AnimatePresence>
          {effectTarget.visible && (
            <motion.div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="absolute rounded-full"
                  style={{ border: `2px solid ${TYPE_INFO[effectTarget.type].color}99`, top: effectTarget.target === 'foe' ? '25%' : '60%', left: effectTarget.target === 'foe' ? '60%' : '25%', transform: 'translate(-50%, -50%)' }}
                  animate={{ width: [12, 80 + i * 30], height: [12, 80 + i * 30], opacity: [0.9, 0] }} transition={{ duration: 0.55, delay: i * 0.07, ease: 'easeOut' }}
                />
              ))}
              <motion.div className="absolute rounded-full"
                style={{ background: `radial-gradient(circle, ${TYPE_INFO[effectTarget.type].color}ee 0%, ${TYPE_INFO[effectTarget.type].color}88 30%, transparent 70%)`, width: 80, height: 80, top: effectTarget.target === 'foe' ? '25%' : '60%', left: effectTarget.target === 'foe' ? '60%' : '25%', transform: 'translate(-50%, -50%)', boxShadow: `0 0 30px 10px ${TYPE_INFO[effectTarget.type].glow}` }}
                animate={{ scale: [0.2, 1.8, 0], opacity: [1, 0.7, 0] }} transition={{ duration: 0.45, ease: 'easeOut' }}
              />
              {[...Array(6)].map((_, i) => {
                const angle = (i / 6) * 360; const dist = 35 + Math.random() * 30;
                const dx = Math.cos(angle * Math.PI / 180) * dist; const dy = Math.sin(angle * Math.PI / 180) * dist;
                return <motion.span key={i} className="absolute text-sm select-none"
                  style={{ top: effectTarget.target === 'foe' ? '25%' : '60%', left: effectTarget.target === 'foe' ? '60%' : '25%', transform: 'translate(-50%,-50%)', filter: `drop-shadow(0 0 6px ${TYPE_INFO[effectTarget.type].color})` }}
                  animate={{ x: [0, dx * 1.5], y: [0, dy * 1.5], opacity: [1, 0], scale: [0.8, 1.3, 0.3], rotate: [0, angle > 180 ? 90 : -90] }}
                  transition={{ duration: 0.55, delay: i * 0.035, ease: 'easeOut' }}>{TYPE_INFO[effectTarget.type].emoji}</motion.span>;
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Damage number */}
        <AnimatePresence>
          {dmgDisplay.visible && dmgDisplay.damage > 0 && (
            <motion.div className="absolute pointer-events-none z-30 font-pixel select-none"
              style={{ top: dmgDisplay.target === 'foe' ? '15%' : '55%', left: dmgDisplay.target === 'foe' ? '55%' : '30%', fontSize: dmgDisplay.isCritical ? '24px' : '16px', color: dmgDisplay.isCritical ? '#fbbf24' : '#f87171',
                textShadow: dmgDisplay.isCritical ? '0 0 16px rgba(251,191,36,0.9), 0 0 30px rgba(251,191,36,0.4), 0 2px 4px rgba(0,0,0,0.9)' : '0 0 10px rgba(248,113,113,0.7), 0 2px 4px rgba(0,0,0,0.9)' }}
              initial={{ y: 0, opacity: 1, scale: 0.3 }} animate={{ y: -55, opacity: 0, scale: 1.2 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }}>
              {dmgDisplay.isCritical && <motion.span className="block text-[9px] text-amber-300 mb-0.5" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.3 }}>CRITICAL!</motion.span>}
              -{dmgDisplay.damage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI turn / Digivolving indicator */}
        <AnimatePresence>
          {phase === 'ai-turn' && (
            <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ type: 'spring', stiffness: 400 }}>
              <div className="bg-red-500/15 backdrop-blur-sm border border-red-400/20 rounded-full px-5 py-2"><span className="font-pixel text-red-400 text-[9px]">FOE ATTACKS!</span></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Player info */}
      <div className="px-4 pb-1">
        <div className="glass rounded-2xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-pixel text-slate-100 text-[10px]">{player.name}</p>
                <span className="text-[7px] px-1 py-px rounded font-body font-medium bg-slate-700/50 text-slate-400">{player.level}</span>
              </div>
              <div className="flex gap-1 mt-1">{player.types.map(t => <TypePill key={t} type={t} />)}</div>
              <StatusBadges status={battleStatus.player} buffs={battleStatus.playerBuffs} />
            </div>
            <div className="text-right">
              <span className="text-slate-600 text-[8px] font-body">#{String(player.id).padStart(3, '0')}</span>
              <p className="text-amber-400/50 text-[9px] font-pixel mt-0.5">SPD {player.speed}</p>
            </div>
          </div>
          <HPBar current={player.hp} max={player.maxHp} />
          <p className="text-slate-500 text-[9px] font-body mt-0.5">{player.hp}/{player.maxHp} HP</p>
        </div>
      </div>

      {/* Battle log */}
      <div className="px-4 pb-1">
        <div className="glass-light rounded-xl p-2.5 h-12 overflow-hidden">
          <div ref={logRef} className="overflow-y-auto h-full no-scrollbar">
            {logs.slice(-2).map((log, i) => (
              <motion.p key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className={`text-[11px] font-body leading-snug ${log.type === 'win' ? 'text-emerald-400 font-semibold' : log.type === 'lose' ? 'text-red-400 font-semibold' : log.type === 'critical' ? 'text-amber-400 font-semibold' : log.type === 'digivolve' ? 'text-amber-300 font-bold' : log.type === 'status' ? 'text-purple-300' : log.type === 'damage' ? 'text-orange-400/80' : log.type === 'miss' ? 'text-slate-500 italic' : log.type === 'heal' ? 'text-emerald-300' : 'text-slate-300/70'}`}>
                {log.text}
              </motion.p>
            ))}
          </div>
        </div>
      </div>

      {/* Move buttons + Digivolve */}
      <div className="px-4 pb-5 pt-1">
        <div className={`transition-opacity duration-200 ${canAct ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-pixel text-[8px] text-slate-500 flex items-center gap-1">⚡ {canAct ? 'CHOOSE YOUR MOVE' : '...'}</p>
            {combo > 1 && <span className="font-pixel text-[8px] text-amber-400/60">COMBO x{combo}</span>}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {player.moves.map((move, i) => {
              const noPP = move.pp <= 0;
              const eff = foe ? getTypeEffectiveness(move.type, foe.types) : 1;
              const isSuper = eff >= 2;
              const isWeak = eff > 0 && eff < 1;
              const isStab = player.types.includes(move.type);
              return (
                <motion.button key={move.name} onClick={() => handlePlayerMove(i)} disabled={!canAct || noPP}
                  className={`relative rounded-xl p-2.5 text-left transition-all duration-150 overflow-hidden ${noPP ? 'bg-slate-800/30 opacity-30 cursor-not-allowed' : isSuper ? 'bg-emerald-400/8 ring-1 ring-emerald-400/30 hover:ring-emerald-400/50' : isWeak ? 'bg-slate-800/40 opacity-50' : 'bg-slate-800/50 hover:bg-slate-700/50'}`}
                  whileTap={noPP ? {} : { scale: 0.95 }} whileHover={noPP ? {} : { scale: 1.02 }}>
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl" style={{ background: TYPE_INFO[move.type].color }} />
                  <div className="pl-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-body font-semibold text-slate-200 text-[11px] capitalize truncate">{move.name}</p>
                      <div className="flex items-center gap-0.5">
                        {move.isSpecial && <span className="text-[7px] text-amber-400 font-pixel">★</span>}
                        <EffectivenessLabel moveType={move.type} defenderTypes={foe.types} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[7px] px-1.5 py-px rounded font-body font-medium text-white" style={{ background: `${TYPE_INFO[move.type].color}bb` }}>{capitalizeName(move.type)}</span>
                      {move.power > 0 ? <span className="text-[8px] text-amber-400/70 font-pixel">{move.power}</span> : move.heal ? <span className="text-[8px] text-emerald-400 font-pixel">HEAL</span> : null}
                      {move.statusEffect && <span className="text-[7px] text-purple-300/60 font-body">{STATUS_INFO[move.statusEffect]?.label}</span>}
                      {isStab && move.power > 0 && <span className="text-[7px] text-amber-400/40 font-body">STAB</span>}
                      <span className="text-[7px] text-slate-500 font-body ml-auto">{move.pp}/{move.maxPp}</span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Digivolve button */}
          {digivolveReady && evoData && (
            <motion.button onClick={handleDigivolve} disabled={!canAct}
              className="w-full mt-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 text-amber-300 font-pixel text-[9px] py-3 rounded-xl flex items-center justify-center gap-2 hover:border-amber-400/60 transition-all"
              whileTap={{ scale: 0.97 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>⭐</motion.span>
              DIGIVOLVE TO {evoData.name.toUpperCase()}!
            </motion.button>
          )}
        </div>
      </div>

      {/* Result overlay */}
      <AnimatePresence>
        {showResult && result && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass rounded-3xl p-8 w-full max-w-[300px] text-center" initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 22 }}>
              <motion.div className="text-5xl mb-3" animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 0.6, repeat: 1 }}>{result === 'win' ? '🏆' : '💀'}</motion.div>
              <h2 className="font-pixel text-lg mb-2" style={{ color: result === 'win' ? '#4ade80' : '#f87171', textShadow: result === 'win' ? '0 0 20px rgba(74,222,128,0.5), 0 0 40px rgba(74,222,128,0.2)' : '0 0 20px rgba(248,113,113,0.5)' }}>
                {result === 'win' ? 'VICTORY!' : 'DEFEATED'}
              </h2>
              <p className="text-slate-400 font-body text-sm mb-1">{player.name} vs {foe.name}</p>
              <p className="text-slate-500 font-body text-xs mb-1">{turn + 1} turns</p>
              {combo > 2 && <p className="text-amber-400/60 font-body text-xs mb-4">Max combo: x{combo}</p>}
              {challengeResult && (
                <motion.div
                  className={`rounded-xl p-3 mb-4 ${challengeResult === 'met' ? 'bg-amber-400/10 border border-amber-400/30' : 'bg-slate-700/30 border border-slate-600/30'}`}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                >
                  <p className={`font-pixel text-[10px] ${challengeResult === 'met' ? 'text-amber-400' : 'text-slate-500'}`}>
                    {challengeResult === 'met' ? '🎯 CHALLENGE MET! +3 WINS' : '🎯 CONSTRAINT MISSED'}
                  </p>
                </motion.div>
              )}
              <div className="flex gap-2">
                <motion.button onClick={() => onNavigate('/select')} className="flex-1 glass text-slate-300 font-pixel text-[9px] py-3 rounded-xl" whileTap={{ scale: 0.97 }}>CHANGE</motion.button>
                <motion.button onClick={() => onNavigate('/select')} className="flex-1 bg-gradient-to-b from-amber-400 to-amber-500 text-gray-900 font-pixel text-[9px] py-3 rounded-xl shadow-lg shadow-amber-500/20" whileTap={{ scale: 0.97 }}>⚔️ AGAIN</motion.button>
              </div>
              <button onClick={() => onNavigate('/')} className="text-slate-500 text-xs font-body py-2 mt-3 hover:text-slate-300 transition-colors">Home</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
