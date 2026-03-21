import React from 'react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────
// Floating animated decorative icon
// ─────────────────────────────────────────────
export const FloatingIcon = ({ icon: Icon, size, color, top, left, right, bottom, delay = 0, rotate = 0 }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ top, left, right, bottom, color }}
    animate={{ y: [0, -10, 0], rotate: [rotate, rotate + 8, rotate] }}
    transition={{ duration: 3 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
  >
    <Icon size={size} strokeWidth={1.5} />
  </motion.div>
);

// ─────────────────────────────────────────────
// Decorative SVG star burst
// ─────────────────────────────────────────────
export const StarBurst = ({ size = 40, color = '#F9C835', opacity = 0.25, style }) => (
  <svg
    width={size} height={size} viewBox="0 0 40 40"
    fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ position: 'absolute', pointerEvents: 'none', opacity, ...style }}
  >
    <path d="M20 0 L22.5 17.5 L40 20 L22.5 22.5 L20 40 L17.5 22.5 L0 20 L17.5 17.5 Z" fill={color} />
  </svg>
);

// ─────────────────────────────────────────────
// Time util for invitations
// ─────────────────────────────────────────────
export const getExtendedTimeLabel = (horario) => {
  if (!horario?.inicio || !horario?.fin) return null;
  return { from: horario.inicio, to: horario.fin };
};
