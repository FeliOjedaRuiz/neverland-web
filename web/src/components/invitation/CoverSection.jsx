import React from 'react';
import { motion } from 'framer-motion';
import { FloatingIcon, StarBurst } from './InvitationUIElements';
import { PirateShipIcon, CompassIcon, TreasureMapIcon, FairyDustIcon, TropicalLeafIcon, MagicEnvelopeIcon } from './NeverlandIcons';

const CoverSection = ({ onOpen }) => (
  <motion.div
    key="cover"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, scale: 1.08 }}
    transition={{ duration: 0.5, ease: 'easeInOut' }}
    className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
  >
    {/* Background Map with motion and blur */}
    <motion.div 
      initial={{ scale: 1.1, opacity: 0 }}
      animate={{ 
        scale: [1.1, 1.15, 1.1],
        rotate: [0, 1, -1, 0],
        opacity: 0.5
      }}
      transition={{ 
        scale: { duration: 20, repeat: Infinity, ease: 'linear' },
        rotate: { duration: 15, repeat: Infinity, ease: 'easeInOut' },
        opacity: { duration: 1 }
      }}
      className="absolute inset-0 z-0 bg-cover bg-center"
      style={{ 
        backgroundImage: 'url(/images/map-green-water.png)',
        filter: 'blur(2px) brightness(1.1)',
        willChange: 'transform'
      }}
    />

    {/* Light Gradient Overlay - Tones the background with a soft green top and orange bottom */}
    <div 
      className="absolute inset-0 z-0 pointer-events-none" 
      style={{ 
        background: 'linear-gradient(to bottom, rgba(36, 99, 90, 0.15), rgba(255, 255, 255, 0.4) 30%, rgba(255, 255, 255, 0.4) 70%, rgba(240, 125, 62, 0.12))'
      }} 
    />

    {/* Background star bursts */}
    <StarBurst size={80} color="#F07D3E" opacity={0.25} style={{ top: '8%', left: '5%' }} />
    <StarBurst size={100} color="#F9C835" opacity={0.2} style={{ bottom: '12%', right: '3%' }} />

    {/* Floating thematic icons - Optimized positions and sizes */}
    <FloatingIcon icon={CompassIcon} size={42} top="12%" left="15%" delay={0.3} rotate={-10} />
    <FloatingIcon icon={FairyDustIcon} size={50} top="18%" right="12%" delay={0.8} rotate={15} />
    <FloatingIcon icon={TropicalLeafIcon} size={45} top="45%" left="8%" delay={1.4} rotate={-20} />
    <FloatingIcon icon={PirateShipIcon} size={55} bottom="28%" right="10%" delay={0.5} />
    <FloatingIcon icon={TreasureMapIcon} size={42} bottom="15%" left="12%" delay={1.2} rotate={10} />

    {/* Main content - uses dvh-based spacing to scale with screen height */}
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
      className="relative z-10 flex flex-col items-center text-center px-8 max-w-sm"
    >
      <h1 
        className="font-display font-black leading-tight text-[#1c544d] uppercase tracking-tight" 
        style={{ 
          fontSize: 'clamp(1.6rem, 7vw, 2.8rem)',
          marginBottom: 'clamp(0.75rem, 2dvh, 1.5rem)',
          textShadow: '0 2px 10px rgba(255,255,255,0.8)' 
        }}
      >
        Recibiste una<br />
        <span className="text-[#F07D3E]" style={{ textShadow: '0 4px 12px rgba(240,125,62,0.2)' }}>
          invitación
        </span>
        <br />muy especial
      </h1>

      <motion.div
        onClick={onOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative z-10 flex flex-col items-center justify-center cursor-pointer group"
        style={{ marginBottom: 'clamp(1.5rem, 5dvh, 3.5rem)' }}
      >
        <motion.div
          animate={{ 
            y: [0, -12, 0], 
            rotate: [-2, 2, -2]
          }}
          transition={{ 
            y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          }}
          style={{ willChange: 'transform' }}
          className="flex flex-col items-center"
        >
          {/* Animated Envelope with Pulse */}
          <motion.div
            animate={{ scale: [1, 1.18, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ 
              width: 'clamp(180px, 25dvh, 230px)', 
              height: 'clamp(125px, 18dvh, 165px)', 
              filter: 'drop-shadow(0 15px 35px rgba(36,99,90,0.25))',
              willChange: 'transform'
            }}
            className="transition-transform duration-300 group-hover:brightness-110"
          >
            <MagicEnvelopeIcon size="100%" />
          </motion.div>
          
          {/* Helper prompt - Now moves WITH the envelope */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1, duration: 1 }}
            className="font-sans font-bold text-[#24635A] uppercase tracking-widest text-[10px] sm:text-xs transition-opacity group-hover:opacity-100 -mt-2 sm:-mt-4"
          >
            (Haz click para abrir)
          </motion.p>
        </motion.div>
      </motion.div>

      <p 
        className="font-sans font-bold text-[#24635A]/90 leading-relaxed max-w-[280px]"
        style={{ 
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          textShadow: '0 2px 4px rgba(255,255,255,0.8)'
        }}
      >
        Alguien quiere celebrar contigo un momento mágico en
      </p>

      {/* Neverland Logo Branding */}
      <motion.img 
        src="/neverland_logo.svg" 
        alt="Neverland Logo"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        style={{ 
          width: 'clamp(110px, 15vw, 140px)',
          marginTop: '1.2rem',
          filter: 'drop-shadow(0 4px 10px rgba(36,99,90,0.15))'
        }}
        className="relative z-10"
      />
    </motion.div>
  </motion.div>
);

export default CoverSection;
