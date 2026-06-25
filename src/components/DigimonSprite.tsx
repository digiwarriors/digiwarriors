import { useState } from 'react';
import { DigimonType, TYPE_INFO } from '../data/digimon';

interface DigimonSpriteProps {
  src: string;
  name: string;
  types: DigimonType[];
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  style?: React.CSSProperties;
  idle?: boolean;
  fainting?: boolean;
  victorious?: boolean;
}

const SIZE_MAP = {
  sm: { wrapper: 'w-12 h-12', img: 'w-12 h-12', emoji: 'text-2xl', glow: 40 },
  md: { wrapper: 'w-16 h-16', img: 'w-16 h-16', emoji: 'text-3xl', glow: 50 },
  lg: { wrapper: 'w-20 h-20', img: 'w-20 h-20', emoji: 'text-4xl', glow: 60 },
  xl: { wrapper: 'w-36 h-36', img: 'w-36 h-36', emoji: 'text-6xl', glow: 90 },
};

export default function DigimonSprite({
  src, name, types, size = 'md', className = '', style,
  idle = false, fainting = false, victorious = false,
}: DigimonSpriteProps) {
  const [imgError, setImgError] = useState(false);
  const primaryType = types[0] || 'fire';
  const typeInfo = TYPE_INFO[primaryType];
  const sizes = SIZE_MAP[size];

  // Fallback emoji on image error
  if (imgError) {
    return (
      <div
        className={`${sizes.wrapper} flex items-center justify-center rounded-2xl ${className}`}
        style={{
          background: `radial-gradient(circle, ${typeInfo.color}20 0%, ${typeInfo.color}08 70%)`,
          ...style,
        }}
      >
        <span className={sizes.emoji} style={{ filter: `drop-shadow(0 0 10px ${typeInfo.color}88)` }}>
          {typeInfo.emoji}
        </span>
      </div>
    );
  }

  const animClass = fainting ? 'sprite-faint' : victorious ? 'sprite-victory' : idle ? 'sprite-idle' : '';

  return (
    <div className={`relative ${sizes.wrapper} ${className}`} style={style}>
      {/* Outer ambient glow — soft light spill */}
      <div
        className="absolute inset-[-20%] rounded-full"
        style={{
          background: `radial-gradient(circle, ${typeInfo.color}18 0%, transparent 65%)`,
        }}
      />

      {/* Inner bright glow — makes white edges invisible via luminosity */}
      <div
        className="absolute inset-[-5%] rounded-full glow-breathe"
        style={{
          background: `radial-gradient(circle, ${typeInfo.color}40 0%, ${typeInfo.color}15 50%, transparent 75%)`,
        }}
      />

      {/* The sprite image — SVG filter removes white bg */}
      <img
        src={src}
        alt={name}
        className={`relative z-10 ${sizes.img} object-contain ${animClass}`}
        style={{
          filter: `
            url(#remove-bg)
            drop-shadow(0 0 6px ${typeInfo.color}66)
            drop-shadow(0 0 14px ${typeInfo.color}28)
            drop-shadow(0 2px 3px rgba(0,0,0,0.4))
          `,
        }}
        onError={() => setImgError(true)}
      />

      {/* Ground shadow ellipse */}
      <div
        className="absolute bottom-[-4%] left-1/2 -translate-x-1/2 z-0 rounded-full shadow-breathe"
        style={{
          width: sizes.glow,
          height: 8,
          background: `radial-gradient(ellipse, ${typeInfo.color}30 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}
