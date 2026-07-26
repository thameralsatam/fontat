import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';
import { useLanguage } from '../contexts/LanguageContext';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [targetRect, setTargetRect] = useState<{ x: number; y: number; width: number } | null>(null);

  useEffect(() => {
    const computeTarget = () => {
      const desktopLogo = document.getElementById('header-logo-desktop');
      const mobileLogo = document.getElementById('header-logo-mobile');
      
      let targetEl: HTMLElement | null = null;
      if (desktopLogo && desktopLogo.getBoundingClientRect().width > 0) {
        targetEl = desktopLogo;
      } else if (mobileLogo && mobileLogo.getBoundingClientRect().width > 0) {
        targetEl = mobileLogo;
      }

      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        setTargetRect({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          width: rect.width,
        });
      }
    };

    // Trigger target calculation and slide animation at 2.2s
    const outTimer = setTimeout(() => {
      computeTarget();
      setIsAnimatingOut(true);
    }, 2200);

    // Complete splash screen at 3.4s
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3400);

    window.addEventListener('resize', computeTarget);

    return () => {
      clearTimeout(outTimer);
      clearTimeout(completeTimer);
      window.removeEventListener('resize', computeTarget);
    };
  }, [onComplete]);

  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 600;

  const initialX = windowWidth / 2;
  const initialY = windowHeight / 2;
  const initialWidth = 150;

  // Fallback defaults if targetRect is not computed yet
  const isDesktop = windowWidth >= 1024;
  
  const fallbackX = isDesktop ? (isRTL ? windowWidth - 110 : 110) : windowWidth / 2;
  const fallbackY = 40;
  const fallbackWidth = isDesktop ? 125 : 120;

  const targetX = targetRect ? targetRect.x : fallbackX;
  const targetY = targetRect ? targetRect.y : fallbackY;
  const targetWidth = targetRect ? targetRect.width : fallbackWidth;

  return (
    <motion.div 
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Dark background sliding up */}
      <motion.div 
        className="absolute top-0 left-0 right-0 bg-[#080808]"
        initial={{ height: "100vh" }}
        animate={isAnimatingOut ? { height: 80 } : { height: "100vh" }}
        transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
      />

      {/* Animated Logo moving from center to exact header position */}
      <motion.div 
        className="absolute flex items-center justify-center z-[10000]"
        style={{
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ 
          left: initialX, 
          top: initialY, 
          width: initialWidth 
        }}
        animate={isAnimatingOut ? { 
          left: targetX, 
          top: targetY, 
          width: targetWidth 
        } : { 
          left: initialX, 
          top: initialY, 
          width: initialWidth 
        }}
        transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="relative w-full flex items-center justify-center">
          {/* Logo under the cover */}
          <Logo className="w-full h-auto text-white" />
          
          {/* Cover sliding to reveal logo (Right-to-Left for RTL, Left-to-Right for LTR) */}
          <motion.div 
            className={`absolute inset-0 bg-[#080808] ${isRTL ? 'origin-left' : 'origin-right'}`}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ delay: 0.2, duration: 1.7, ease: [0.76, 0, 0.24, 1] }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};
