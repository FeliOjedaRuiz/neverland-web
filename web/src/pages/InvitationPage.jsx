import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getInvitationDetails } from '../services/api';
import { Loader2 } from 'lucide-react';
import { PocketWatchIcon } from '../components/invitation/NeverlandIcons';
import { StarBurst } from '../components/invitation/InvitationUIElements';

// Components
import CoverSection from '../components/invitation/CoverSection';
import InvitacionSection from '../components/invitation/InvitacionSection';
import EncarteSection from '../components/invitation/EncarteSection';

const InvitationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    getInvitationDetails(id)
      .then(res => setInvitation(res.data))
      .catch(err => {
        const msg = err.response?.data?.message || 'No pudimos encontrar esta invitación, o ya no está disponible.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!invitation) return;
    
    const title = `¡Invitación de ${invitation.cliente.nombreNiño}!`;
    document.title = title;
    
    // Best-effort dynamic O-G update
    const updateMeta = (property, content) => {
      let element = document.querySelector(`meta[property="${property}"]`) || 
                    document.querySelector(`meta[name="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const ogImage = `${window.location.origin}/images/invitacion_og_share.png`;
    updateMeta('og:title', title);
    updateMeta('og:image', ogImage);
    updateMeta('og:description', `¡Estás invitado al cumple de ${invitation.cliente.nombreNiño} en Neverland!`);
    updateMeta('twitter:image', ogImage);
    
    return () => {
      document.title = "Neverland - Parque Infantil y Celebraciones";
    };
  }, [invitation]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#FDEBD0]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
          <Loader2 size={36} color="#24635A" />
        </motion.div>
        <p className="font-display font-bold text-[#24635A]/60 uppercase tracking-widest text-[10px] mt-4">Cargando la magia...</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#FDF3E1] overflow-hidden">
        {/* Background Decorative Bursts */}
        <StarBurst size={120} color="#F9C835" opacity={0.15} style={{ top: '10%', right: '5%' }} />
        <StarBurst size={80} color="#F07D3E" opacity={0.1} style={{ bottom: '15%', left: '10%' }} />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 flex flex-col items-center"
        >
          {/* Animated Icon Container */}
          <div className="mb-10 p-8 bg-white/40 backdrop-blur-sm rounded-[48px] shadow-xl shadow-neverland-green/5 border border-white/60 relative">
            <motion.div
               animate={{ rotate: [0, 8, -8, 0] }}
               transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <PocketWatchIcon size={80} />
            </motion.div>
          </div>
          
          <h2 className="text-3xl font-display font-black text-[#1c544d] uppercase tracking-tight mb-4 leading-tight">
            ¡Oh! La magia está <br/>
            <span className="text-[#F07D3E]">descansando...</span>
          </h2>
          
          <div className="max-w-[300px] mx-auto space-y-3 mb-10">
             <p className="text-[#24635A] font-sans font-bold text-lg leading-snug">
               Esta invitación no está disponible en este momento.
             </p>
             <p className="text-[#24635A]/60 font-sans font-medium text-sm">
               {error}
             </p>
          </div>
          
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 font-display font-black text-white px-10 py-5 rounded-3xl shadow-lg transition-all hover:scale-105 active:scale-95 bg-[#24635A] uppercase tracking-widest text-xs"
          >
            Volver al inicio
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="font-sans overflow-x-hidden" style={{ fontFamily: 'Nunito, sans-serif' }}>
      <AnimatePresence>
        {!isOpen && (
          <CoverSection onOpen={() => setIsOpen(true)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="opened-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <InvitacionSection invitation={invitation} />
            <EncarteSection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvitationPage;
