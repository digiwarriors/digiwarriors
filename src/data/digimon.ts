export type DigimonType =
  | 'fire' | 'water' | 'electric' | 'plant' | 'ice'
  | 'dark' | 'light' | 'earth' | 'wind' | 'steel'
  | 'bug' | 'ghost' | 'dragon' | 'fighting' | 'holy' | 'virus' | 'machine';

export type StatusEffect = 'burn' | 'freeze' | 'poison' | 'paralyze' | null;

export interface Move {
  name: string;
  type: DigimonType;
  power: number;
  pp: number;
  maxPp: number;
  accuracy: number;
  statusEffect?: StatusEffect;
  statusChance?: number; // 0-1
  isSpecial?: boolean; // charge-up move
  heal?: number; // percent of maxHp to heal (0-1)
  selfStatus?: 'atkUp' | 'defUp' | 'spdUp' | null;
}

export interface Digimon {
  id: number;
  name: string;
  types: DigimonType[];
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  moves: Move[];
  sprite: string;
  level: string;
  evolvesTo?: number; // id of evolution
  evolveCondition?: 'lowHp' | 'turn3' | 'always'; // when digivolution is available
}

export const TYPE_INFO: Record<DigimonType, { color: string; emoji: string; glow: string }> = {
  fire: { color: '#ff6b35', emoji: '🔥', glow: 'rgba(255,107,53,0.8)' },
  water: { color: '#4a90d9', emoji: '💧', glow: 'rgba(74,144,217,0.8)' },
  electric: { color: '#f7e44b', emoji: '⚡', glow: 'rgba(247,228,75,0.9)' },
  plant: { color: '#5d9c59', emoji: '🌿', glow: 'rgba(93,156,89,0.8)' },
  ice: { color: '#96d9d6', emoji: '❄️', glow: 'rgba(150,217,214,0.8)' },
  dark: { color: '#705746', emoji: '🌑', glow: 'rgba(112,87,70,0.8)' },
  light: { color: '#f5d442', emoji: '✨', glow: 'rgba(245,212,66,0.8)' },
  earth: { color: '#e2bf65', emoji: '🌍', glow: 'rgba(226,191,101,0.8)' },
  wind: { color: '#89aadb', emoji: '🌪️', glow: 'rgba(137,170,219,0.8)' },
  steel: { color: '#b7b7ce', emoji: '⚙️', glow: 'rgba(183,183,206,0.7)' },
  bug: { color: '#a6b91a', emoji: '🐛', glow: 'rgba(166,185,26,0.8)' },
  ghost: { color: '#735797', emoji: '👻', glow: 'rgba(115,87,151,0.8)' },
  dragon: { color: '#6f35fc', emoji: '🐉', glow: 'rgba(111,53,252,0.8)' },
  fighting: { color: '#c22e28', emoji: '👊', glow: 'rgba(194,46,40,0.8)' },
  holy: { color: '#d685ad', emoji: '💫', glow: 'rgba(214,133,173,0.8)' },
  virus: { color: '#a33ea1', emoji: '☠️', glow: 'rgba(163,62,161,0.8)' },
  machine: { color: '#8899aa', emoji: '🤖', glow: 'rgba(136,153,170,0.8)' },
};

export const STATUS_INFO: Record<string, { color: string; emoji: string; label: string }> = {
  burn: { color: '#f97316', emoji: '🔥', label: 'BRN' },
  freeze: { color: '#67e8f9', emoji: '❄️', label: 'FRZ' },
  poison: { color: '#a855f7', emoji: '☠️', label: 'PSN' },
  paralyze: { color: '#facc15', emoji: '⚡', label: 'PAR' },
  atkUp: { color: '#f87171', emoji: '⚔️', label: 'ATK+' },
  defUp: { color: '#60a5fa', emoji: '🛡️', label: 'DEF+' },
  spdUp: { color: '#fbbf24', emoji: '💨', label: 'SPD+' },
};

export const TYPE_EFFECTIVENESS: Record<DigimonType, Partial<Record<DigimonType, number>>> = {
  fire: { plant: 2, ice: 2, bug: 2, steel: 2, water: 0.5, earth: 0.5, fire: 0.5, dragon: 0.5 },
  water: { fire: 2, earth: 2, steel: 2, machine: 2, electric: 0.5, plant: 0.5, water: 0.5, dragon: 0.5 },
  electric: { water: 2, wind: 2, machine: 2, earth: 0.5, electric: 0.5, plant: 0.5, dragon: 0.5 },
  plant: { water: 2, earth: 2, electric: 1.5, fire: 0.5, plant: 0.5, bug: 0.5, ghost: 0.5, dragon: 0.5 },
  ice: { plant: 2, wind: 2, dragon: 2, earth: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
  dark: { light: 2, ghost: 2, holy: 2, dark: 0.5, fighting: 0.5, virus: 0.5 },
  light: { dark: 2, ghost: 2, virus: 2, light: 0.5, holy: 0.5, fighting: 0.5 },
  earth: { fire: 2, electric: 2, steel: 2, machine: 2, water: 0.5, plant: 0.5, wind: 0, bug: 0.5 },
  wind: { plant: 2, bug: 2, fighting: 2, earth: 0, steel: 0.5, electric: 0.5, wind: 0.5 },
  steel: { ice: 2, machine: 2, bug: 1.5, steel: 0.5, fire: 0.5, water: 0.5, electric: 0.5 },
  bug: { plant: 2, dark: 2, holy: 2, fire: 0.5, ghost: 0.5, fighting: 0.5, steel: 0.5 },
  ghost: { light: 2, holy: 2, virus: 2, dark: 0.5, ghost: 0.5, bug: 0.5 },
  dragon: { dragon: 2, fighting: 2, holy: 0.5, steel: 0.5, machine: 0.5 },
  fighting: { steel: 2, machine: 2, ice: 2, dark: 2, wind: 0.5, bug: 0.5, holy: 0.5, ghost: 0.5 },
  holy: { dark: 2, virus: 2, ghost: 2, holy: 0.5, light: 0.5, fighting: 0.5 },
  virus: { machine: 2, bug: 2, plant: 2, holy: 0, fire: 0.5, steel: 0.5, virus: 0.5 },
  machine: { steel: 2, fighting: 2, plant: 2, electric: 0.5, water: 0.5, fire: 0.5, earth: 0.5 },
};

export function getTypeEffectiveness(attackType: DigimonType, defenderTypes: DigimonType[]): number {
  let multiplier = 1;
  for (const defType of defenderTypes) {
    const effectiveness = TYPE_EFFECTIVENESS[attackType]?.[defType];
    if (effectiveness !== undefined) multiplier *= effectiveness;
  }
  return multiplier;
}

export function capitalizeName(name: string): string {
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function spriteUrl(name: string): string {
  return `https://digi-api.com/images/digimon/w/${name.replace(/ /g, '_')}.png`;
}

function m(name: string, type: DigimonType, power: number, pp: number, accuracy: number = 95, extra?: Partial<Move>): Move {
  return { name, type, power, pp, maxPp: pp, accuracy, ...extra };
}

export const ALL_DIGIMON: Omit<Digimon, 'hp'>[] = [
  // === ROOKIE ===
  {
    id: 1, name: 'Agumon', types: ['fire', 'dragon'], level: 'Rookie',
    attack: 55, defense: 40, speed: 45, maxHp: 130,
    evolvesTo: 19, evolveCondition: 'turn3',
    moves: [
      m('Baby Flame', 'fire', 45, 20, 95),
      m('Claw Attack', 'fighting', 35, 25, 100),
      m('Spitfire', 'fire', 55, 15, 90, { statusEffect: 'burn', statusChance: 0.2 }),
      m('Sharp Nail', 'steel', 30, 30, 100),
    ],
    sprite: spriteUrl('Agumon'),
  },
  {
    id: 2, name: 'Gabumon', types: ['ice', 'water'], level: 'Rookie',
    attack: 48, defense: 50, speed: 42, maxHp: 135,
    evolvesTo: 20, evolveCondition: 'turn3',
    moves: [
      m('Petit Fire', 'fire', 40, 20),
      m('Horn Attack', 'fighting', 35, 25, 100),
      m('Blue Blaster', 'ice', 50, 15, 92, { statusEffect: 'freeze', statusChance: 0.15 }),
      m('Drill Horn', 'earth', 40, 20, 95),
    ],
    sprite: spriteUrl('Gabumon'),
  },
  {
    id: 3, name: 'Biyomon', types: ['wind', 'fire'], level: 'Rookie',
    attack: 45, defense: 35, speed: 55, maxHp: 120,
    evolvesTo: 13, evolveCondition: 'turn3',
    moves: [
      m('Spiral Twister', 'wind', 45, 20),
      m('Pecking Attack', 'fighting', 30, 30, 100),
      m('Magical Fire', 'fire', 50, 15, 92, { statusEffect: 'burn', statusChance: 0.15 }),
      m('Hard Wing', 'wind', 35, 25, 95, { selfStatus: 'spdUp' }),
    ],
    sprite: spriteUrl('Piyomon'),
  },
  {
    id: 4, name: 'Tentomon', types: ['electric', 'bug'], level: 'Rookie',
    attack: 50, defense: 48, speed: 38, maxHp: 128,
    evolvesTo: 14, evolveCondition: 'turn3',
    moves: [
      m('Super Shocker', 'electric', 45, 20, 95, { statusEffect: 'paralyze', statusChance: 0.2 }),
      m('Talon Attack', 'bug', 35, 25, 100),
      m('Twice Arm', 'fighting', 30, 30, 100),
      m('Rhino Spin', 'bug', 50, 15, 90),
    ],
    sprite: spriteUrl('Tentomon'),
  },
  {
    id: 5, name: 'Palmon', types: ['plant', 'bug'], level: 'Rookie',
    attack: 50, defense: 42, speed: 40, maxHp: 132,
    evolvesTo: 15, evolveCondition: 'turn3',
    moves: [
      m('Poison Ivy', 'plant', 45, 20, 95, { statusEffect: 'poison', statusChance: 0.25 }),
      m('Stinking Attack', 'virus', 30, 25, 85, { statusEffect: 'poison', statusChance: 0.4 }),
      m('Root Breaker', 'plant', 55, 15, 90),
      m('Rasen no Tsuki', 'bug', 35, 25, 95),
    ],
    sprite: spriteUrl('Palmon'),
  },
  {
    id: 6, name: 'Gomamon', types: ['water', 'fighting'], level: 'Rookie',
    attack: 48, defense: 40, speed: 48, maxHp: 130,
    evolvesTo: 16, evolveCondition: 'turn3',
    moves: [
      m('Marching Fishes', 'water', 45, 20),
      m('Sharp Edge', 'fighting', 35, 25, 100, { selfStatus: 'atkUp' }),
      m('Surging Wave', 'water', 55, 15, 90),
      m('Claw Attack', 'fighting', 30, 30, 100),
    ],
    sprite: spriteUrl('Gomamon'),
  },
  {
    id: 7, name: 'Patamon', types: ['light', 'holy'], level: 'Rookie',
    attack: 45, defense: 38, speed: 50, maxHp: 120,
    evolvesTo: 17, evolveCondition: 'turn3',
    moves: [
      m('Air Shot', 'wind', 40, 20),
      m('Boom Bubble', 'light', 45, 20, 95),
      m('Angel Ring', 'holy', 55, 15, 88),
      m('Heal Wind', 'holy', 0, 5, 100, { heal: 0.3 }),
    ],
    sprite: spriteUrl('Patamon'),
  },
  {
    id: 8, name: 'Gatomon', types: ['holy', 'light'], level: 'Rookie',
    attack: 52, defense: 42, speed: 52, maxHp: 128,
    evolvesTo: 24, evolveCondition: 'turn3',
    moves: [
      m('Lightning Paw', 'holy', 45, 20),
      m('Cat\'s Eye', 'light', 40, 20, 90, { statusEffect: 'paralyze', statusChance: 0.2 }),
      m('Neko Punch', 'fighting', 35, 25, 100, { selfStatus: 'atkUp' }),
      m('Divine Tail', 'holy', 55, 15, 90),
    ],
    sprite: spriteUrl('Tailmon'),
  },
  // === CHAMPION ===
  {
    id: 9, name: 'Devimon', types: ['dark', 'ghost'], level: 'Champion',
    attack: 58, defense: 40, speed: 48, maxHp: 150,
    moves: [
      m('Death Claw', 'dark', 55, 15, 95, { statusEffect: 'poison', statusChance: 0.2 }),
      m('Evil Wing', 'ghost', 45, 20),
      m('Dark Ripple', 'dark', 65, 12, 88),
      m('Hell\'s Hand', 'ghost', 50, 15, 92),
    ],
    sprite: spriteUrl('Devimon'),
  },
  {
    id: 10, name: 'Ogremon', types: ['fighting', 'earth'], level: 'Champion',
    attack: 62, defense: 38, speed: 40, maxHp: 155,
    moves: [
      m('Pummel Whack', 'fighting', 55, 15, 95, { selfStatus: 'atkUp' }),
      m('Bone Cudgel', 'earth', 45, 20),
      m('Fist of Fury', 'fighting', 65, 10, 88),
      m('Earthquake Slam', 'earth', 50, 15, 92),
    ],
    sprite: spriteUrl('Orgemon'),
  },
  {
    id: 11, name: 'Leomon', types: ['light', 'fighting'], level: 'Champion',
    attack: 58, defense: 45, speed: 48, maxHp: 160,
    moves: [
      m('Fist of the Beast King', 'fighting', 60, 15),
      m('Beast Sword', 'light', 50, 20, 95),
      m('Lion King Slash', 'fighting', 75, 8, 82, { isSpecial: true }),
      m('Juuouha', 'light', 45, 20, 95),
    ],
    sprite: spriteUrl('Leomon'),
  },
  {
    id: 12, name: 'Garurumon', types: ['ice', 'fighting'], level: 'Champion',
    attack: 58, defense: 42, speed: 52, maxHp: 155,
    evolvesTo: 20, evolveCondition: 'lowHp',
    moves: [
      m('Fox Fire', 'ice', 55, 15),
      m('Ice Fang', 'ice', 50, 20, 92, { statusEffect: 'freeze', statusChance: 0.15 }),
      m('Howling Blaster', 'ice', 65, 12, 88),
      m('Garulu Kick', 'fighting', 40, 25, 100),
    ],
    sprite: spriteUrl('Garurumon'),
  },
  {
    id: 13, name: 'Birdramon', types: ['fire', 'wind'], level: 'Champion',
    attack: 58, defense: 38, speed: 55, maxHp: 148,
    moves: [
      m('Meteor Wing', 'fire', 60, 15, 92, { statusEffect: 'burn', statusChance: 0.2 }),
      m('Fire Flap', 'fire', 50, 20),
      m('Spirit Fire', 'fire', 70, 10, 85, { isSpecial: true }),
      m('Mach Shadow', 'wind', 45, 20, 95),
    ],
    sprite: spriteUrl('Birdramon'),
  },
  {
    id: 14, name: 'Kabuterimon', types: ['bug', 'electric'], level: 'Champion',
    attack: 55, defense: 52, speed: 42, maxHp: 162,
    moves: [
      m('Electro Shocker', 'electric', 55, 15, 92, { statusEffect: 'paralyze', statusChance: 0.2 }),
      m('Beetle Horn Attack', 'bug', 50, 20),
      m('Mega Blaster', 'electric', 70, 10, 85, { isSpecial: true }),
      m('Hard Shell', 'steel', 35, 25, 100, { selfStatus: 'defUp' }),
    ],
    sprite: spriteUrl('Kabuterimon'),
  },
  {
    id: 15, name: 'Togemon', types: ['plant', 'fighting'], level: 'Champion',
    attack: 52, defense: 58, speed: 32, maxHp: 170,
    moves: [
      m('Needle Spray', 'plant', 50, 20, 92, { statusEffect: 'poison', statusChance: 0.2 }),
      m('Coconut Punch', 'fighting', 55, 15),
      m('Chiku Chiku Bang Bang', 'plant', 70, 10, 85, { isSpecial: true }),
      m('Light Speed Jabbing', 'fighting', 60, 12, 90),
    ],
    sprite: spriteUrl('Togemon'),
  },
  {
    id: 16, name: 'Ikkakumon', types: ['water', 'ice'], level: 'Champion',
    attack: 56, defense: 48, speed: 42, maxHp: 165,
    moves: [
      m('Harpoon Torpedo', 'water', 55, 15),
      m('Aurora Beam', 'ice', 50, 20, 90, { statusEffect: 'freeze', statusChance: 0.15 }),
      m('Bolt of Ice', 'ice', 65, 12, 88),
      m('Icicle Coat', 'water', 40, 25, 100, { selfStatus: 'defUp' }),
    ],
    sprite: spriteUrl('Ikkakumon'),
  },
  {
    id: 17, name: 'Angemon', types: ['holy', 'light'], level: 'Champion',
    attack: 58, defense: 45, speed: 50, maxHp: 155,
    moves: [
      m('Hand of Fate', 'holy', 60, 15),
      m('Angel Rod', 'light', 50, 20, 95),
      m('Heaven\'s Gate', 'holy', 75, 8, 82, { isSpecial: true }),
      m('Heal Light', 'holy', 0, 5, 100, { heal: 0.35 }),
    ],
    sprite: spriteUrl('Angemon'),
  },
  {
    id: 18, name: 'Bakemon', types: ['ghost', 'dark'], level: 'Champion',
    attack: 52, defense: 38, speed: 55, maxHp: 140,
    moves: [
      m('Dark Claw', 'ghost', 50, 20, 92, { statusEffect: 'poison', statusChance: 0.15 }),
      m('Death Charm', 'dark', 55, 15, 90),
      m('Ghost Chop', 'ghost', 65, 12, 88),
      m('Hellish Nightmare', 'dark', 70, 10, 82, { isSpecial: true }),
    ],
    sprite: spriteUrl('Bakemon'),
  },
  // === ULTIMATE ===
  {
    id: 19, name: 'MetalGreymon', types: ['machine', 'fire'], level: 'Ultimate',
    attack: 72, defense: 68, speed: 38, maxHp: 220,
    moves: [
      m('Giga Destroyer', 'machine', 80, 10, 90, { isSpecial: true }),
      m('Trident Arm', 'steel', 60, 15, 95),
      m('Mega Flame', 'fire', 65, 12, 92, { statusEffect: 'burn', statusChance: 0.25 }),
      m('Metal Slash', 'machine', 55, 20, 95),
    ],
    sprite: spriteUrl('Metal Greymon'),
  },
  {
    id: 20, name: 'WereGarurumon', types: ['fighting', 'ice'], level: 'Ultimate',
    attack: 70, defense: 52, speed: 62, maxHp: 200,
    moves: [
      m('Wolf Claw', 'fighting', 70, 12, 92),
      m('Ice Bash', 'ice', 60, 15, 90, { statusEffect: 'freeze', statusChance: 0.2 }),
      m('Kaiser Nail', 'fighting', 80, 8, 85, { isSpecial: true }),
      m('Garuru Kick', 'ice', 55, 20, 95, { selfStatus: 'spdUp' }),
    ],
    sprite: spriteUrl('Were Garurumon'),
  },
  {
    id: 21, name: 'SkullGreymon', types: ['dark', 'fire'], level: 'Ultimate',
    attack: 78, defense: 58, speed: 32, maxHp: 230,
    moves: [
      m('Ground Zero', 'dark', 85, 8, 88, { isSpecial: true }),
      m('Bone Darts', 'ghost', 55, 20),
      m('Dark Breath', 'dark', 65, 12, 90),
      m('Skull Destroyer', 'fire', 70, 10, 88, { statusEffect: 'burn', statusChance: 0.2 }),
    ],
    sprite: spriteUrl('Skull Greymon'),
  },
  {
    id: 22, name: 'Myotismon', types: ['dark', 'ghost'], level: 'Ultimate',
    attack: 72, defense: 52, speed: 55, maxHp: 210,
    moves: [
      m('Night Raid', 'dark', 70, 12, 90, { statusEffect: 'poison', statusChance: 0.2 }),
      m('Bloody Stream', 'ghost', 65, 15),
      m('Crimson Nail', 'dark', 80, 8, 85, { isSpecial: true }),
      m('Nightmare Wave', 'ghost', 60, 15, 92),
    ],
    sprite: spriteUrl('Vamdemon'),
  },
  // === MEGA ===
  {
    id: 23, name: 'WarGreymon', types: ['dragon', 'fire'], level: 'Mega',
    attack: 88, defense: 75, speed: 58, maxHp: 270,
    moves: [
      m('Terra Force', 'dragon', 95, 8, 88, { isSpecial: true }),
      m('Great Tornado', 'wind', 70, 12, 92),
      m('Mega Claw', 'dragon', 75, 12, 92, { statusEffect: 'burn', statusChance: 0.15 }),
      m('Brave Shield', 'steel', 40, 20, 100, { selfStatus: 'defUp' }),
    ],
    sprite: spriteUrl('War Greymon'),
  },
  {
    id: 24, name: 'MagnaAngemon', types: ['holy', 'light'], level: 'Ultimate',
    attack: 75, defense: 62, speed: 58, maxHp: 220,
    moves: [
      m('Gate of Destiny', 'holy', 90, 8, 85, { isSpecial: true }),
      m('Excalibur', 'light', 70, 12, 92),
      m('Heaven\'s Heal', 'holy', 0, 5, 100, { heal: 0.4 }),
      m('Angel Slap', 'light', 55, 20, 95),
    ],
    sprite: spriteUrl('Holy Angemon'),
  },
];

export const SELECTABLE_IDS = ALL_DIGIMON.map(d => d.id);

export function createDigimon(id: number): Digimon {
  const data = ALL_DIGIMON.find(d => d.id === id);
  if (!data) throw new Error(`Digimon with id ${id} not found`);
  return { ...data, hp: data.maxHp, moves: data.moves.map(m => ({ ...m })) };
}

export function getDigivolution(id: number): Omit<Digimon, 'hp'> | null {
  const current = ALL_DIGIMON.find(d => d.id === id);
  if (!current?.evolvesTo) return null;
  return ALL_DIGIMON.find(d => d.id === current.evolvesTo) ?? null;
}
