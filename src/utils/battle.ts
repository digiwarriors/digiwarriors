import { Digimon, DigimonType, Move, StatusEffect, getTypeEffectiveness } from '../data/digimon';

export type LogType = 'info' | 'damage' | 'critical' | 'miss' | 'heal' | 'win' | 'lose' | 'status' | 'digivolve';

export interface DamageResult {
  damage: number;
  missed: boolean;
  isCritical: boolean;
  effectiveness: number;
  logs: { text: string; type: LogType }[];
  statusApplied?: StatusEffect;
  selfBuff?: 'atkUp' | 'defUp' | 'spdUp';
}

export interface BattleStatus {
  player: StatusEffect;
  foe: StatusEffect;
  playerBuffs: Set<'atkUp' | 'defUp' | 'spdUp'>;
  foeBuffs: Set<'atkUp' | 'defUp' | 'spdUp'>;
}

export function createBattleStatus(): BattleStatus {
  return {
    player: null,
    foe: null,
    playerBuffs: new Set(),
    foeBuffs: new Set(),
  };
}

function randomRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function calculateDamage(
  attacker: Digimon,
  defender: Digimon,
  move: Move,
  attackerStatus: StatusEffect,
  attackerBuffs: Set<'atkUp' | 'defUp' | 'spdUp'>,
  defenderBuffs: Set<'atkUp' | 'defUp' | 'spdUp'>,
): DamageResult {
  const logs: { text: string; type: LogType }[] = [];

  // Paralyze: 25% chance to skip turn
  if (attackerStatus === 'paralyze' && Math.random() < 0.25) {
    return { damage: 0, missed: true, isCritical: false, effectiveness: 1, logs: [{ text: `${attacker.name} is paralyzed and can't move!`, type: 'status' }] };
  }

  // Freeze: can't move (thaw 20% chance)
  if (attackerStatus === 'freeze') {
    if (Math.random() < 0.2) {
      logs.push({ text: `${attacker.name} thawed out!`, type: 'status' });
      // Return with 0 damage but mark we should clear freeze
      return { damage: 0, missed: true, isCritical: false, effectiveness: 1, logs, statusApplied: null };
    }
    return { damage: 0, missed: true, isCritical: false, effectiveness: 1, logs: [{ text: `${attacker.name} is frozen solid!`, type: 'status' }] };
  }

  // Accuracy check
  const accuracyRoll = Math.random() * 100;
  if (accuracyRoll > move.accuracy) {
    return { damage: 0, missed: true, isCritical: false, effectiveness: 1, logs: [{ text: 'The attack missed!', type: 'miss' }] };
  }

  // Healing move
  if (move.heal && move.heal > 0) {
    const healAmount = Math.floor(attacker.maxHp * move.heal);
    logs.push({ text: `${attacker.name} restored ${healAmount} HP!`, type: 'heal' });
    const result: DamageResult = { damage: -healAmount, missed: false, isCritical: false, effectiveness: 1, logs };
    // Self buff on heal moves
    if (move.selfStatus) result.selfBuff = move.selfStatus;
    // Apply status from heal moves too (unlikely but support it)
    if (move.statusEffect && move.statusChance && Math.random() < move.statusChance) {
      result.statusApplied = move.statusEffect;
    }
    return result;
  }

  // Zero power non-heal move (shouldn't happen, but safety)
  if (move.power === 0) {
    const result: DamageResult = { damage: 0, missed: false, isCritical: false, effectiveness: 1, logs };
    if (move.selfStatus) result.selfBuff = move.selfStatus;
    return result;
  }

  // Type effectiveness
  const effectiveness = getTypeEffectiveness(move.type, defender.types);
  if (effectiveness >= 2) {
    logs.push({ text: "It's super effective!", type: 'critical' });
  } else if (effectiveness > 0 && effectiveness < 1) {
    logs.push({ text: "It's not very effective...", type: 'damage' });
  } else if (effectiveness === 0) {
    logs.push({ text: "It had no effect!", type: 'miss' });
    return { damage: 0, missed: false, isCritical: false, effectiveness: 0, logs };
  }

  // STAB
  const stab = attacker.types.includes(move.type) ? 1.3 : 1;

  // Critical hit (8% chance)
  const isCritical = Math.random() < 0.08;
  const critMultiplier = isCritical ? 1.5 : 1;
  if (isCritical) logs.push({ text: 'A critical hit!', type: 'critical' });

  // Buff modifiers
  let atkMod = attackerBuffs.has('atkUp') ? 1.3 : 1;
  let defMod = defenderBuffs.has('defUp') ? 1.3 : 1;

  // Burn halves attack
  if (attackerStatus === 'burn') {
    atkMod *= 0.65;
  }

  // Damage formula
  const level = 50;
  const baseDamage = ((2 * level / 5 + 2) * move.power * (attacker.attack * atkMod) / (defender.defense * defMod)) / 50 + 2;
  const randomFactor = randomRange(85, 100) / 100;
  const finalDamage = Math.max(1, Math.floor(baseDamage * stab * effectiveness * critMultiplier * randomFactor));

  const result: DamageResult = { damage: finalDamage, missed: false, isCritical, effectiveness, logs };

  // Status effect application
  if (move.statusEffect && move.statusChance && Math.random() < move.statusChance) {
    result.statusApplied = move.statusEffect;
  }

  // Self buff
  if (move.selfStatus) {
    result.selfBuff = move.selfStatus;
  }

  return result;
}

export function applyStatusDamage(digimon: Digimon, status: StatusEffect): { damage: number; logs: { text: string; type: LogType }[] } {
  if (!status) return { damage: 0, logs: [] };

  if (status === 'burn') {
    const dmg = Math.max(1, Math.floor(digimon.maxHp * 0.06));
    return { damage: dmg, logs: [{ text: `${digimon.name} is burned! (-${dmg} HP)`, type: 'status' }] };
  }
  if (status === 'poison') {
    const dmg = Math.max(1, Math.floor(digimon.maxHp * 0.08));
    return { damage: dmg, logs: [{ text: `${digimon.name} is poisoned! (-${dmg} HP)`, type: 'status' }] };
  }
  return { damage: 0, logs: [] };
}

export function chooseAIMove(ai: Digimon, player: Digimon, aiStatus: StatusEffect): Move {
  const availableMoves = ai.moves.filter(m => m.pp > 0);
  if (availableMoves.length === 0) {
    return { name: 'Struggle', type: 'fighting' as DigimonType, power: 30, pp: 999, maxPp: 999, accuracy: 100 };
  }

  // If frozen, don't bother choosing well
  if (aiStatus === 'freeze') return availableMoves[0];

  // If HP is low, prefer healing
  if (ai.hp / ai.maxHp < 0.25) {
    const healMove = availableMoves.find(m => m.heal && m.heal > 0);
    if (healMove) return healMove;
  }

  // Score each move
  let bestMove = availableMoves[0];
  let bestScore = -Infinity;

  for (const move of availableMoves) {
    let score = 0;

    if (move.heal && move.heal > 0) {
      const healValue = move.heal * ai.maxHp;
      score = ai.hp / ai.maxHp < 0.5 ? healValue * 2 : healValue * 0.3;
    } else if (move.power > 0) {
      const effectiveness = getTypeEffectiveness(move.type, player.types);
      const stab = ai.types.includes(move.type) ? 1.3 : 1;
      score = move.power * effectiveness * stab * (move.accuracy / 100);

      // Bonus for status effects
      if (move.statusEffect && move.statusChance) {
        score += 15 * move.statusChance;
      }
      // Bonus for self buffs
      if (move.selfStatus) score += 10;
      // Bonus for special moves when HP is high enough to survive
      if (move.isSpecial && ai.hp / ai.maxHp > 0.4) score += 8;
      // Penalty for low-accuracy special moves at low HP
      if (move.isSpecial && ai.hp / ai.maxHp < 0.3) score -= 15;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  // 15% random for variety
  if (Math.random() < 0.15 && availableMoves.length > 1) {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  return bestMove;
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
