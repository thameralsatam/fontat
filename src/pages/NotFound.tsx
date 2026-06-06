import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

export const NotFound = () => {
  const { dir } = useLanguage();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 max-w-md"
      >
        <div className="relative">
          <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-white/5 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold bg-black/50 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
              {dir === 'rtl' ? 'الصفحة غير موجودة' : 'Page Not Found'}
            </span>
          </div>
        </div>

        <p className="text-white/60 text-lg">
          {dir === 'rtl' 
            ? 'عذراً، يبدو أن الصفحة التي تبحث عنها غير موجودة أو تم نقلها.' 
            : 'Sorry, it looks like the page you are looking for does not exist or has been moved.'}
        </p>

        <Link 
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:scale-105 transition-transform"
        >
          {dir === 'rtl' ? 'العودة للرئيسية' : 'Back to Home'}
        </Link>
      </motion.div>
    </div>
  );
};
