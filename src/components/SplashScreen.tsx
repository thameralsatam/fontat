import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';
import { useLanguage } from '../contexts/LanguageContext';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const { dir } = useLanguage();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    // Reveal is 1.7s. Wait after is 0.3s. delay is 0.2s
    // Trigger the slide up and shrink animation at 2.2s
    const outTimer = setTimeout(() => {
      setIsAnimatingOut(true);
    }, 2200);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(outTimer);
    };
  }, []);

  const isLargeScreen = windowWidth >= 1024; // lg breakpoint

  // Horizontal transition value to match the header logo position exactly on desktop
  // Left Container padding px-6 = 24px, logo width = 130px. Logo center = 24 + 65 = 89px.
  // In LTR, logo shifts to the left, (89 - windowWidth/2).
  // In RTL, logo shifts to the right, (windowWidth/2 - 89).
  const finalX = isLargeScreen 
    ? (dir === 'rtl' ? (windowWidth / 2 - 89) : -(windowWidth / 2 - 89)) 
    : 0;

  return (
    <motion.div 
      className="fixed top-0 left-0 right-0 z-[9999] bg-[#080808] flex items-center justify-center pointer-events-none overflow-hidden"
      initial={{ height: "100vh" }}
      animate={isAnimatingOut ? { height: 96 } : { height: "100vh" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
      onAnimationComplete={() => {
        if (isAnimatingOut) {
          onComplete();
        }
      }}
    >
      <motion.div 
        className="relative flex items-center justify-center"
        initial={{ width: 180, marginTop: 0, x: 0, y: 0 }}
        animate={isAnimatingOut ? { width: 130, marginTop: 0, x: finalX, y: -4 } : { width: 180, marginTop: 0, x: 0, y: 0 }}
        transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
      >
        {/* Logo under the cover */}
        <Logo className="w-full h-auto text-white" />
        
        {/* Cover sliding right to left to reveal logo */}
        <motion.div 
          className="absolute inset-0 bg-[#080808] origin-left"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ delay: 0.2, duration: 1.7, ease: [0.76, 0, 0.24, 1] }}
        />
      </motion.div>
    </motion.div>
  );
};
