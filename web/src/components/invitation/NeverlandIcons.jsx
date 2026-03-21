import React from 'react';

// Common SVG props to allow sizing and styling
const baseProps = (size, className) => ({
  width: size,
  height: size,
  viewBox: "0 0 100 100",
  xmlns: "http://www.w3.org/2000/svg",
  className
});

export const PirateShipIcon = ({ size = 48, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <g transform="translate(0, 5) scale(0.9)">
      <path d="M48 25 Q 75 45 75 65 L 48 70 Z" fill="#FFFFFF" opacity="0.85" />
      <path d="M48 15 Q 20 35 20 55 L 48 60 Z" fill="#FFF9F0" />
      <path d="M30 40 Q 38 45 42 55" stroke="#F9C835" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="46" y="5" width="4" height="65" fill="#2D5A4C" rx="2" />
      <path d="M46 5 L 20 12 L 32 20 L 20 28 L 46 30 Z" fill="#F07D3E" />
      <path d="M10 65 L 25 90 L 75 90 L 90 65 Z" fill="#F07D3E" />
      <path d="M10 65 L 90 65 L 80 72 L 20 72 Z" fill="#F9C835" />
      <circle cx="35" cy="80" r="3" fill="#FFF9F0" />
      <circle cx="50" cy="80" r="3" fill="#FFF9F0" />
      <circle cx="65" cy="80" r="3" fill="#FFF9F0" />
      <path d="M0 90 Q 15 80 25 90 T 50 90 T 75 90 T 100 90" fill="none" stroke="#45B18D" strokeWidth="4" strokeLinecap="round" />
    </g>
  </svg>
);

export const CompassIcon = ({ size = 48, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <g transform="translate(5, 5) scale(0.9)">
      <circle cx="50" cy="50" r="45" fill="#FFEACB" stroke="#F9C835" strokeWidth="6" />
      <circle cx="50" cy="50" r="35" fill="none" stroke="#45B18D" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(36, 99, 90, 0.1)" strokeWidth="8" />
      <path d="M50 15 L 58 48 L 50 52 L 42 48 Z" fill="#F07D3E" />
      <path d="M50 85 L 58 52 L 50 48 L 42 52 Z" fill="#24635A" />
      <path d="M85 50 L 52 42 L 48 50 L 52 58 Z" fill="#4B8CC8" />
      <path d="M15 50 L 48 42 L 52 50 L 48 58 Z" fill="#F9C835" />
      <circle cx="50" cy="50" r="6" fill="#1A1A1A" />
      <circle cx="50" cy="50" r="2" fill="#FFFFFF" />
    </g>
  </svg>
);

export const TreasureMapIcon = ({ size = 48, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <g transform="translate(5, 5) scale(0.9)">
      <path d="M15 15 C 40 0, 60 30, 85 15 L 85 85 C 60 100, 40 70, 15 85 Z" fill="#FFF2D9" />
      <path d="M40 10 L 40 80" stroke="#F9C835" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
      <path d="M60 20 L 60 90" stroke="#F9C835" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
      <path d="M25 75 Q 40 40 60 30" fill="none" stroke="#24635A" strokeWidth="3" strokeDasharray="6 4" strokeLinecap="round" />
      <g transform="translate(55, 15) scale(0.8)">
        <path d="M0 0 L 20 20 M 20 0 L 0 20" stroke="#F07D3E" strokeWidth="5" strokeLinecap="round" />
      </g>
      <ellipse cx="65" cy="25" rx="18" ry="12" fill="#F07D3E" opacity="0.15" />
      <circle cx="30" cy="70" r="5" fill="#45B18D" opacity="0.5" />
      <circle cx="45" cy="50" r="3" fill="#F9C835" opacity="0.8" />
    </g>
  </svg>
);

export const FairyDustIcon = ({ size = 48, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <g transform="translate(10, 0) scale(0.8)">
      <rect x="25" y="45" width="50" height="45" fill="#F9C835" filter="blur(10px)" opacity="0.3" />
      <path d="M40 30 L 40 15 L 60 15 L 60 30 L 80 50 L 80 95 L 20 95 L 20 50 Z" fill="#FFF9F0" opacity="0.6" stroke="#45B18D" strokeWidth="4" />
      <path d="M30 60 C 50 50, 60 70, 70 55" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
      <path d="M38 5 L 62 5 L 60 15 L 40 15 Z" fill="#F07D3E" />
      <path d="M45 55 L 50 45 L 55 55 L 65 60 L 55 65 L 50 75 L 45 65 L 35 60 Z" fill="#F9C835" />
      <circle cx="35" cy="75" r="4" fill="#FFFFFF" />
      <circle cx="65" cy="80" r="3" fill="#F07D3E" />
      <circle cx="45" cy="85" r="5" fill="#4B8CC8" />
      <circle cx="55" cy="40" r="2" fill="#45B18D" />
    </g>
  </svg>
);

export const TropicalLeafIcon = ({ size = 48, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <g transform="translate(5, 5) scale(0.9)">
      {/* Redesigned Tropical Leaf - more lush and aesthetic */}
      <path 
        d="M50 10 C 20 10, 5 35, 5 60 C 5 85, 30 95, 50 95 C 70 95, 95 85, 95 60 C 95 35, 80 10, 50 10 Z" 
        fill="#45B18D" 
      />
      <path 
        d="M50 10 C 50 10, 95 35, 95 60 C 95 85, 70 95, 50 95 C 50 65, 50 35, 50 10 Z" 
        fill="#24635A" 
      />
      {/* Decorative leaf cut-outs / details */}
      <path d="M30 30 Q 50 35 50 15" stroke="#FFF9F0" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M20 50 Q 50 55 50 40" stroke="#FFF9F0" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M30 75 Q 50 80 50 60" stroke="#FFF9F0" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />
      
      <path d="M70 35 Q 50 40 50 20" stroke="#FFF9F0" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M80 55 Q 50 60 50 45" stroke="#FFF9F0" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M70 80 Q 50 85 50 65" stroke="#FFF9F0" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />
      
      <path d="M50 95 L 50 10" stroke="#F9C835" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
    </g>
  </svg>
);

export const PocketWatchIcon = ({ size = 48, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <g transform="translate(5, 5) scale(0.9)">
      {/* Top ring/chain holder */}
      <circle cx="50" cy="12" r="10" fill="none" stroke="#F07D3E" strokeWidth="5" />
      <rect x="42" y="20" width="16" height="8" fill="#F9C835" rx="3" />
      
      {/* Outer Case / Shadow */}
      <circle cx="50" cy="55" r="40" fill="#F9C835" />
      <circle cx="50" cy="55" r="40" fill="none" stroke="rgba(36, 99, 90, 0.15)" strokeWidth="6" />
      
      {/* Inner metallic rim */}
      <circle cx="50" cy="55" r="34" fill="#F07D3E" />
      
      {/* Watch Face */}
      <circle cx="50" cy="55" r="28" fill="#FFF9F0" />
      
      {/* Inner detail border */}
      <circle cx="50" cy="55" r="24" fill="none" stroke="#FDEBD0" strokeWidth="2" strokeDasharray="3 4" />
      
      {/* Hour markers */}
      <path d="M50 32 L 50 35 M 50 78 L 50 75 M 32 55 L 35 55 M 68 55 L 65 55" stroke="#45B18D" strokeWidth="3" strokeLinecap="round" />
      
      {/* Clock Hands */}
      {/* Hour Hand */}
      <path d="M50 55 L 60 45" stroke="#24635A" strokeWidth="4" strokeLinecap="round" />
      {/* Minute Hand */}
      <path d="M50 55 L 45 35" stroke="#1c544d" strokeWidth="3" strokeLinecap="round" />
      
      {/* Center dot */}
      <circle cx="50" cy="55" r="5" fill="#F07D3E" />
      <circle cx="50" cy="55" r="2" fill="#FFF9F0" />
    </g>
  </svg>
);

export const MagicStarIcon = ({ size = 48, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <g transform="translate(5, 5) scale(0.9)">
      {/* Glow effect */}
      <circle cx="50" cy="40" r="25" fill="#F9C835" filter="blur(12px)" opacity="0.4" />
      
      {/* Star Dust Trail */}
      <circle cx="20" cy="80" r="3" fill="#F9C835" opacity="0.6" />
      <circle cx="35" cy="70" r="2" fill="#FFF9F0" opacity="0.8" />
      <circle cx="15" cy="65" r="4" fill="#F07D3E" opacity="0.4" />
      <circle cx="45" cy="85" r="3" fill="#4B8CC8" opacity="0.5" />
      
      {/* The main star (4 pointed like the ones in the map) */}
      <path 
        d="M50 5 L 58 32 L 85 40 L 58 48 L 50 75 L 42 48 L 15 40 L 42 32 Z" 
        fill="#F9C835"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      
      {/* Inner highlights */}
      <path d="M50 15 L 53 35 L 75 40 L 53 45 L 50 65 L 47 45 L 25 40 L 47 35 Z" fill="#FFF9F0" opacity="0.6" />
      
      {/* Tiny secondary sparkles */}
      <path d="M25 15 L 27 22 L 35 25 L 27 28 L 25 35 L 23 28 L 15 25 L 23 22 Z" fill="#FFFFFF" opacity="0.8" />
    </g>
  </svg>
);

export const MagicEnvelopeIcon = ({ size = 64, className = "" }) => (
  <svg 
    width={size} height={size} viewBox="0 0 100 100" fill="none" 
    xmlns="http://www.w3.org/2000/svg" className={className}
    style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.12))' }}
  >
    {/* Main envelope body (back side view) */}
    <rect x="5" y="25" width="90" height="55" rx="4" fill="#FDF3E1" stroke="#DCA27A" strokeWidth="2" strokeLinejoin="round" />
    
    {/* Bottom flap */}
    <path d="M5 80 L50 45 L95 80" fill="#FFFBF5" stroke="#DCA27A" strokeWidth="1.5" strokeLinejoin="round" />
    
    {/* Left side flap */}
    <path d="M5 25 L40 50 L5 80 Z" fill="#FDF3E1" stroke="#DCA27A" strokeWidth="1.5" strokeLinejoin="round" />
    
    {/* Right side flap */}
    <path d="M95 25 L60 50 L95 80 Z" fill="#FDF3E1" stroke="#DCA27A" strokeWidth="1.5" strokeLinejoin="round" />

    {/* Top flap */}
    <path d="M5 25 L50 60 L95 25 Z" fill="#FFF9ED" stroke="#DCA27A" strokeWidth="2" strokeLinejoin="round" filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.05))" />
    
    {/* Wax Seal - Outer Edge */}
    <circle cx="50" cy="58" r="12" fill="#BA361B" />
    
    {/* Wax Seal - Inner Stamp */}
    <circle cx="50" cy="58" r="9.5" fill="#9B2610" />
    
    {/* Wax Seal Highlight */}
    <path d="M42 54 C 46 50, 54 50, 58 54" stroke="#D34B2D" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    
    {/* N Logo stamped in the seal */}
    <path d="M46 63 L 46 53 L 54 63 L 54 53" stroke="#FDEBD0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
  </svg>
);
