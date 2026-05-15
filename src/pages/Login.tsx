import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { FadeSection } from '../components/FadeSection';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t, dir } = useLanguage();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Account created! You can now sign in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/account');
      }
    } catch (error: any) {
      alert(error.message || t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FadeSection className="flex flex-col items-center justify-center min-h-[70vh]">
      <div 
        className="w-full max-w-md lg:max-w-lg bg-[#141414] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden"
      >
        {/* Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-white/5 rounded-full blur-[60px] pointer-events-none" />

        <h2 className="text-3xl font-bold text-center mb-8 text-white tracking-tight relative z-10">
          {isSignUp ? t('login.signup') : t('login.title')}
        </h2>
        
        <form onSubmit={handleAuth} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-white opacity-40 uppercase tracking-widest pl-4">Email</label>
            <div className="relative group">
              <div className={`absolute inset-y-0 ${dir === 'rtl' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                <Mail className="h-5 w-5 text-white opacity-40 group-focus-within:text-white transition-colors" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full py-4 rounded-[1.5rem] bg-black/30 border border-white/5 text-white placeholder:text-white opacity-20 focus:ring-2 focus:ring-white/20 focus:border-white/20 outline-none transition-all ${dir === 'rtl' ? 'pr-11 pl-4' : 'pl-11 pr-4'}`}
                placeholder="name@example.com"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs font-bold text-white opacity-40 uppercase tracking-widest pl-4">{t('login.password')}</label>
            <div className="relative group">
              <div className={`absolute inset-y-0 ${dir === 'rtl' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                <Lock className="h-5 w-5 text-white opacity-40 group-focus-within:text-white transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full py-4 rounded-[1.5rem] bg-black/30 border border-white/5 text-white placeholder:text-white opacity-20 focus:ring-2 focus:ring-white/20 focus:border-white/20 outline-none transition-all ${dir === 'rtl' ? 'pl-12 pr-11' : 'pr-12 pl-11'}`}
                placeholder="••••••••"
                required
                minLength={6}
              />
              {password.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-white opacity-50 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 ${dir === 'rtl' ? 'left-4' : 'right-4'}`}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-6 rounded-[1.5rem] font-bold text-lg hover:bg-gray-100 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isSignUp ? t('login.signup') : t('login.button')}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center relative">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-white opacity-40 hover:text-white font-medium transition-colors border-b border-transparent hover:border-white pb-0.5"
          >
            {isSignUp ? t('login.have_account') : t('login.no_account')}
          </button>
        </div>
      </div>
    </FadeSection>
  );
};
