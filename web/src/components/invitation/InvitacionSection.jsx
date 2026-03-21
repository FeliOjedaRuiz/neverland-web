import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ChevronDown } from 'lucide-react';
import { formatLongSafeDate } from '../../utils/safeDate';
import { FloatingIcon, StarBurst, getExtendedTimeLabel } from './InvitationUIElements';
import { PirateShipIcon, TreasureMapIcon, FairyDustIcon, TropicalLeafIcon, CompassIcon, PocketWatchIcon, MagicStarIcon } from './NeverlandIcons';

const InvitacionSection = ({ invitation }) => {
  const { cliente, fecha, horario } = invitation;
  const formattedDate = fecha ? formatLongSafeDate(fecha) : '';
  const time = getExtendedTimeLabel(horario);

  const nameRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const [nameSizeAdjusted, setNameSizeAdjusted] = React.useState(false);

  React.useLayoutEffect(() => {
    const adjustSize = () => {
      if (!nameRef.current || !containerRef.current) return;
      
      // Calculate available width with padding
      const containerWidth = containerRef.current.clientWidth - 40; 
      let size = 80; // Starting max size in px
      
      nameRef.current.style.fontSize = `${size}px`;
      
      // Iteratively shrink until it fits
      while (nameRef.current.scrollWidth > containerWidth && size > 24) {
        size -= 1;
        nameRef.current.style.fontSize = `${size}px`;
      }
      
      setNameSizeAdjusted(true);
    };

    // Initial adjustment
    adjustSize();
    
    // Also adjust on resize
    window.addEventListener('resize', adjustSize);
    return () => window.removeEventListener('resize', adjustSize);
  }, [invitation, cliente?.nombreNiño]);

  return (
    <motion.div
      key="invitation"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="relative min-h-dvh w-full flex flex-col items-center justify-center overflow-hidden px-4"
    >
      {/* Background Map with Blur and Motion */}
      <motion.div 
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: 0.5 
        }}
        transition={{ 
          scale: { duration: 30, repeat: Infinity, ease: 'linear' }
        }}
        className="fixed inset-0 z-0"
        style={{ 
          backgroundImage: 'url(/images/map-green-water.png)', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          filter: 'blur(3px)',
          willChange: 'transform'
        }}
      />

      {/* Light Gradient Overlay - Tones the background with a soft green top and orange bottom */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none" 
        style={{ 
          background: 'linear-gradient(to bottom, rgba(36, 99, 90, 0.15), rgba(255, 255, 255, 0.4) 30%, rgba(255, 255, 255, 0.4) 70%, rgba(240, 125, 62, 0.12))'
        }} 
      />
      {/* Background decoration */}
      <StarBurst size={80} color="#F9C835" opacity={0.4} style={{ top: '5%', right: '-2%', transform: 'rotate(20deg)' }} />
      <StarBurst size={60} color="#F07D3E" opacity={0.3} style={{ bottom: '15%', left: '-3%', transform: 'rotate(-10deg)' }} />

      {/* Floating thematic icons */}
      <FloatingIcon icon={PirateShipIcon} size={62} top="5%" left="8%" delay={0.3} rotate={-10} />
      <FloatingIcon icon={MagicStarIcon} size={55} top="8%" right="5%" delay={1.1} rotate={15} />
      <FloatingIcon icon={TreasureMapIcon} size={48} top="35%" right="5%" delay={2} />
      <FloatingIcon icon={FairyDustIcon} size={44} bottom="10%" left="15%" delay={1.5} rotate={-20} />
      <FloatingIcon icon={TropicalLeafIcon} size={50} bottom="12%" right="10%" delay={0.7} rotate={15} />

      {/* Main Content - dvh-based spacing scales with screen height */}
      <div 
        className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center text-center text-[#24635A]"
        style={{ padding: 'clamp(1rem, 3dvh, 2rem) 0', gap: 'clamp(0.6rem, 1.8dvh, 1.2rem)' }}
      >
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 0 15px white) drop-shadow(0 0 5px white) drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
        >
          <p 
            className="font-display font-black tracking-widest uppercase mb-0 text-[#1c544d]"
            style={{ fontSize: 'clamp(1rem, 4.5vw, 1.4rem)' }}
          >
            ¡Hola!
          </p>
          <p className="font-sans font-bold text-[#24635A]" style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.2rem)' }}>Soy</p>
        </motion.div>

        {/* Name - Shadow moved to parent to fix gradient visibility */}
        <motion.div 
          ref={containerRef}
          initial={{ opacity: 0, y: -30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.18, duration: 0.7, ease: 'easeOut' }} 
          className="w-full -mt-2 sm:-mt-3 overflow-hidden"
          style={{ 
            filter: 'drop-shadow(0 4px 12px rgba(36,99,90,0.25))',
            willChange: 'transform'
          }}
        >
          <h1
            ref={nameRef}
            className="font-display font-black leading-[0.9] uppercase px-2 whitespace-nowrap inline-block"
            style={{
              fontSize: '5rem', // Initial large size
              backgroundImage: 'linear-gradient( #45B18D, #24635A)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-1.5px',
              visibility: nameSizeAdjusted ? 'visible' : 'hidden' // Avoid flash of unscaled text
            }}
          >
            {cliente?.nombreNiño}
          </h1>
        </motion.div>

        {/* Age Section - Unified Orange and Same Size */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }} className="flex flex-col items-center"
          style={{ filter: 'drop-shadow(0 0 15px white) drop-shadow(0 0 5px white) drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
        >
          <p className="font-sans font-bold opacity-95 mb-0.5 text-[#A34B1A]" style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.2rem)' }}>y voy a cumplir</p>
          <div 
            className="flex items-center gap-3 font-display font-black leading-none"
            style={{ 
              fontSize: 'clamp(2.5rem, 13vw, 4.5rem)', 
              color: '#F07D3E', 
              textShadow: '0 4px 15px rgba(240,125,62,0.35)' 
            }}
          >
            <span>{cliente?.edadNiño}</span>
            <span className="uppercase tracking-tighter">Años</span>
          </div>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
          className="relative w-full rounded-4xl shadow-2xl border border-white/50 mt-6 sm:mt-10"
          style={{ 
            background: 'rgba(255,255,255,0.4)', 
            backdropFilter: 'blur(8px)',
            boxShadow: '0 15px 35px rgba(36,99,90,0.12)',
            padding: 'clamp(0.8rem, 2.5dvh, 1.5rem) clamp(1rem, 4vw, 1.5rem)',
            willChange: 'transform'
          }}
        >
          <div 
            className="absolute -top-11 left-0 sm:left-2 z-20 transition-transform hover:scale-105 rotate-[-15deg]"
            style={{ filter: 'drop-shadow(0 8px 15px rgba(0,0,0,0.25))' }}
          >
            <PocketWatchIcon size={82} />
          </div>
          <div 
            className="absolute -top-6 right-3 sm:right-6 z-20 transition-transform hover:scale-105 rotate-12"
            style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.2))' }}
          >
            <CompassIcon size={68} />
          </div>

          <p 
            className="font-display font-bold tracking-tight" 
            style={{ 
              color: '#24635A', 
              textShadow: '0 2px 8px rgba(255,255,255,0.8)',
              fontSize: 'clamp(1rem, 4.5vw, 1.4rem)',
              marginBottom: 'clamp(0.3rem, 1dvh, 0.75rem)'
            }}
          >
            ¡Te invito a festejarlo!
          </p>
          
          <div className="flex flex-col" style={{ gap: 'clamp(0.4rem, 1.2dvh, 0.75rem)' }}>
            <div className="flex items-center justify-center gap-2.5">
              <Calendar size={18} color="#F07D3E" strokeWidth={2.5} />
              <span className="font-display font-bold text-[#1A1A1A] capitalize" style={{ fontSize: 'clamp(0.95rem, 4.2vw, 1.3rem)' }}>
                {formattedDate}
              </span>
            </div>
            {time && (
              <div className="flex items-center justify-center gap-2.5">
                <Clock size={18} color="#F9C835" strokeWidth={2.5} />
                <span className="font-display font-bold text-[#1A1A1A]" style={{ fontSize: 'clamp(0.95rem, 4.2vw, 1.3rem)' }}>
                  de {time.from} a {time.to} h
                </span>
              </div>
            )}
            <a 
              href="https://www.google.com/maps/place/Neverland+Granada/@37.1497519,-3.663004,17z"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 hover:scale-105 transition-transform active:scale-95 py-0.5"
            >
              <MapPin size={18} color="#45B18D" strokeWidth={2.5} />
              <span className="font-display font-bold text-[#24635A] decoration-[#24635A]/30 underline-offset-4" style={{ fontSize: 'clamp(0.9rem, 3.8vw, 1.2rem)' }}>
                Neverland · Cúllar Vega
              </span>
            </a>

            {/* Google Calendar CTA - Made Tertiary and Compact */}
            <div className="w-full flex justify-center border-t border-[#24635A]/5" style={{ marginTop: 'clamp(0.5rem, 1.5dvh, 0.8rem)', paddingTop: 'clamp(0.5rem, 1.2dvh, 0.8rem)' }}>
              <a 
                href={(() => {
                  const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
                  const text = `Cumpleaños de ${cliente?.nombreNiño || 'Neverland'}`;
                  const d = fecha ? fecha.split('T')[0].replace(/-/g, '') : '';
                  const s = (horario?.inicio || '17:30').replace(/:/g, '') + '00';
                  const e = (horario?.fin || '20:30').replace(/:/g, '') + '00';
                  const loc = 'Neverland Granada, C. Clara Campoamor, Cúllar Vega';
                  const map = "https://www.google.com/maps/place/Neverland+Granada/@37.1497519,-3.663004,17z";
                  const details = `¡Prepárate para una aventura mágica en Neverland! 🎉\n\n📍 Ubicación: ${map}\n\n🌐 Web: https://neverlandcullarvega.es\n\n¡Te esperamos! ✨`;
                  return `${baseUrl}&text=${encodeURIComponent(text)}&dates=${d}T${s}/${d}T${e}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(loc)}`;
                })()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl font-display font-bold text-[10px] uppercase tracking-wider hover:bg-[#24635A]/5 active:scale-95 transition-all px-4 py-2 border border-[#24635A]/20 text-[#24635A]/70"
              >
                <Calendar size={12} strokeWidth={2.5} />
                Agendar en mi calendario
              </a>
            </div>
          </div>
        </motion.div>

        {/* Footer phrase */}
        <motion.p
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.6 }}
          className="font-display font-bold text-[#24635A] text-center"
          style={{ fontSize: 'clamp(0.95rem, 4vw, 1.3rem)' }}
        >
          ¡Prepárate para la aventura!
        </motion.p>
      </div>

      {/* Scroll Hint */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ y: [0, 4, 0], opacity: [1, 1, 1] }}
        whileInView={{ opacity: 0.6 }}
        transition={{ 
          y: { duration: 2, repeat: Infinity },
          initial: { duration: 0.8, delay: 1.2 }
        }}
        className="absolute flex flex-col items-center gap-0.5 text-[#24635A]/60"
        style={{ bottom: 'clamp(0.5rem, 2dvh, 1.5rem)' }}
      >
        <p className="text-[9px] uppercase tracking-widest font-black">Ver más</p>
        <ChevronDown size={18} />
      </motion.div>
    </motion.div>
  );
};

export default InvitacionSection;
