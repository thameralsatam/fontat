import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Notification } from '../../types';

export const AppNotificationModal = ({ 
  notification, 
  isOpen, 
  onClose,
  dir
}: { 
  notification: Notification | null, 
  isOpen: boolean, 
  onClose: () => void,
  dir: 'rtl' | 'ltr'
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Reset slide when notification changes
  React.useEffect(() => {
    if (isOpen) setCurrentSlide(0);
  }, [isOpen, notification]);

  if (!isOpen || !notification || notification.slides.length === 0) return null;

  const slides = notification.slides;
  const slide = slides[currentSlide];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4" dir={dir}>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose} 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        />
        
        <motion.div 
          initial={{ y: "100%" }} 
          animate={{ y: 0 }} 
          exit={{ y: "100%" }} 
          transition={{ type: "spring", damping: 25, stiffness: 300 }} 
          className="bg-[#111111] border border-white/10 w-full sm:max-w-md mx-auto sm:rounded-3xl rounded-t-3xl pt-2 sm:pt-4 relative z-10 shadow-2xl flex flex-col mt-auto overflow-hidden min-h-[50vh] sm:min-h-0 sm:max-h-[85vh]"
        >
          {/* Mobile Handle */}
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-2 sm:hidden" />
          
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
               <Bell className="w-4 h-4 text-white/50" />
               <span className="text-xs font-medium text-white/50 uppercase tracking-widest">{notification.type}</span>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col">
              <AnimatePresence mode="wait">
                  <motion.div 
                     key={currentSlide}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="flex flex-col flex-1"
                  >
                     {slide.image_url && (
                        <div className="w-full h-48 sm:h-64 bg-black/40 border-b border-white/5 relative">
                           <img src={slide.image_url} alt={slide.title} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent pointer-events-none" />
                        </div>
                     )}
                     
                     <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center">
                        <h2 className="text-2xl font-bold text-white mb-4 leading-tight">{slide.title}</h2>
                        <p className="text-white/60 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">{slide.description}</p>
                     </div>
                  </motion.div>
              </AnimatePresence>
          </div>

          {/* Navigation & Controls */}
          {slides.length > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-black/20">
                  <div className="flex gap-1.5 opacity-50">
                     {slides.map((_, i) => (
                         <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-4 bg-white' : 'w-1.5 bg-white/30'}`} />
                     ))}
                  </div>
                  
                  <div className="flex gap-2">
                     <button 
                       onClick={handlePrev} 
                       disabled={currentSlide === 0}
                       className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                     >
                        {dir === 'rtl' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                     </button>
                     <button 
                       onClick={handleNext} 
                       disabled={currentSlide === slides.length - 1}
                       className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black disabled:opacity-30 focus:outline-none hover:bg-gray-200 transition-colors"
                     >
                        {dir === 'rtl' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                     </button>
                  </div>
              </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
