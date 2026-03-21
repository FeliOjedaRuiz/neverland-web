import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EncarteSection = () => {
  const [activeIdx, setActiveIdx] = React.useState(null);

  const gridItems = [
    { id: 'sala-juegos-completa-panoramica', size: 'col-span-2 row-span-2', title: 'Sala de Juegos' },
    { id: 'arbol-magico-toboganes-colores', size: 'col-span-1 row-span-1', title: 'Árbol Mágico' },
    { id: 'piscina-bolas-tobogan-amarillo', size: 'col-span-1 row-span-1', title: 'Piscina de Bolas' },
    { id: 'zona-princess-castillo-rosa', size: 'col-span-1 row-span-1', title: 'Zona Princess' },
    { id: 'cafeteria-panoramica-barra-sillas-rojas', size: 'col-span-2 row-span-1', title: 'Cafetería' },
  ];

  const hiddenGallery = [
    { id: 'salon-fiestas-planta-superior', title: 'Salón de Fiestas' },
    { id: 'toboganes-tubo-colores-piso-superior', title: 'Toboganes de Tubo' },
    { id: 'piscina-bolas-vista-ventana', title: 'Vista de Juegos' },
    { id: 'salon-principal-mesas-sillas-lamparas', title: 'Salón Principal' },
    { id: 'entrada-hall-mural-neverland', title: 'Bienvenida' },
  ];

  const fullGallery = [...gridItems, ...hiddenGallery];

  const getUrl = (id, width = 600) => {
    const duplicatedIds = [
      'entrada-hall-mural-neverland',
      'sala-juegos-parque-infantil-mesas',
      'cafeteria-mesas-rojas-barra',
      'piscina-bolas-tobogan-amarillo',
      'zona-princess-castillo-rosa',
      'cafeteria-panoramica-barra-sillas-rojas',
      'salon-principal-mesas-sillas-lamparas',
    ];
    const path = duplicatedIds.includes(id)
      ? `neverland/instalaciones/neverland/instalaciones/${id}`
      : `neverland/instalaciones/${id}`;
    return `https://res.cloudinary.com/dhdd7a5pr/image/upload/f_auto,q_auto,w_${width}/${path}.jpg`;
  };

  return (
    <div
      className="relative z-20 w-full py-16 px-5 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]"
      style={{ background: 'linear-gradient(180deg, #FFF9F0 0%, #FDEBD0 100%)' }}
    >
      <div className="max-w-sm mx-auto">
        {/* Title */}
        <div className="text-center mb-10">
          <motion.img 
            src="/neverland_logo.svg" 
            alt="Neverland Logo"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ 
              width: 'clamp(140px, 20vw, 180px)',
              margin: '0 auto 1.5rem',
              filter: 'drop-shadow(0 4px 10px rgba(36,99,90,0.15))'
            }}
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="font-sans text-[#2D5A4C] text-sm mt-3 leading-relaxed"
          >
            Un espacio único en Granada donde cada cumpleaños se convierte en una historia que los niños recordarán siempre.
          </motion.p>
        </div>

        {/* Image Gallery Grid */}
        <div className="grid grid-cols-3 gap-2 mb-10 auto-rows-[100px]">
          {gridItems.map((img, i) => (
            <motion.div
              key={i}
              onClick={() => setActiveIdx(i)}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`${img.size} relative rounded-xl overflow-hidden shadow-sm bg-gray-100/50 border border-white/20 cursor-pointer group`}
            >
              <img 
                src={getUrl(img.id, img.size.includes('col-span-2') ? 1000 : 500)} 
                alt={img.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* "Ver más" overlay for the last grid item */}
              {i === gridItems.length - 1 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] group-hover:bg-transparent transition-all">
                  <span className="bg-white/90 text-[#24635A] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                    Ver más fotos
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center"
        >
          <a
            href="https://neverlandcullarvega.es"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-display font-bold text-white rounded-full px-8 py-4 shadow-lg transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #24635A, #45B18D)', boxShadow: '0 8px 28px rgba(36,99,90,0.25)' }}
          >
            <span>Conoce Neverland</span> →
          </a>
          <a 
            href="https://neverlandcullarvega.es"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-[#24635A]/50 mt-4 font-sans tracking-tight hover:text-[#24635A] transition-colors"
          >
            www.neverlandcullarvega.es
          </a>
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {activeIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl"
            onClick={() => setActiveIdx(null)}
          >
            <button
              onClick={() => setActiveIdx(null)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-110"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative max-w-full max-h-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={getUrl(fullGallery[activeIdx].id, 1200)}
                alt={fullGallery[activeIdx].title}
                className="max-w-[95vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />
              <p className="text-white mt-6 font-display text-xl font-bold tracking-wide italic text-center">
                {fullGallery[activeIdx].title}
              </p>
              
              {/* Controls */}
              <div className="flex items-center gap-8 mt-8">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIdx(p => (p === 0 ? fullGallery.length - 1 : p - 1));
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all active:scale-95"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                
                <span className="text-white/40 font-sans text-sm tracking-widest tabular-nums font-bold">
                  {activeIdx + 1} / {fullGallery.length}
                </span>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIdx(p => (p === fullGallery.length - 1 ? 0 : p + 1));
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all active:scale-95"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EncarteSection;
