import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    // Reveal is 1.7s. Wait after is 0.3s. delay is 0.2s
    // Trigger the slide up and shrink animation at 2.2s
    const outTimer = setTimeout(() => {
      setIsAnimatingOut(true);
    }, 2200);

    // Animation takes 1.0s. Wait 200ms before fading out (Total 3.4s)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3400);

    return () => {
      clearTimeout(outTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed top-0 left-0 right-0 z-[9999] bg-[#080808] flex items-center justify-center pointer-events-none overflow-hidden"
      initial={{ height: "100vh" }}
      animate={isAnimatingOut ? { height: 96 } : { height: "100vh" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div 
        className="relative flex items-center justify-center"
        initial={{ width: 180, y: 0 }}
        animate={isAnimatingOut ? { width: 130, y: 0 } : { width: 180, y: 0 }}
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
