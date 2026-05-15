import { useNavigate } from "react-router-dom";
import { Upload, Compass, Beaker, Send, Camera, Search, Focus } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";

export const Home = () => {
  const navigate = useNavigate();
  const { t, dir, language } = useLanguage();

  const dummyCards = [
    { name: "Cairo", weight: "Regular", ext: ".ttf", preview: t("home.preview_char") },
    { name: "Tajawal", weight: "Bold", ext: ".ttf", preview: t("home.preview_char") },
    { name: "Changa", weight: "Light", ext: ".otf", preview: t("home.preview_char") },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center pt-12 max-lg:landscape:pt-4 px-4 relative overflow-hidden pb-40 max-lg:landscape:pb-16">
      <div className="text-center z-10 w-full max-w-4xl xl:max-w-6xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-2xl sm:text-3xl md:text-5xl font-semibold text-white tracking-tight leading-snug"
        >
          {t("home.hero_title")}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-row items-center justify-center gap-4 mt-12"
          dir={dir}
        >
          <button
            onClick={() => navigate("/fonts")}
            className="px-6 py-3 rounded-full bg-white text-black hover:bg-gray-200 font-bold flex items-center justify-center gap-2 transition-all text-sm shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95"
          >
            <Compass className="w-4 h-4" />
            {t("home.explore")}
          </button>

          <button
            onClick={() => navigate("/my-fonts")}
            className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 text-white font-bold flex items-center justify-center gap-2 transition-all text-sm active:scale-95 hidden sm:flex"
          >
            <Upload className="w-4 h-4 opacity-70" />
            {t("home.upload")}
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('font-finder-cta');
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="px-6 py-3 rounded-full border border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-300 font-bold flex items-center justify-center gap-2 transition-all text-sm active:scale-95"
          >
            <Camera className="w-4 h-4" />
            {language === 'ar' ? 'البحث بالصورة' : 'Find via Image'}
          </button>
        </motion.div>
      </div>

      {/* Font Cards Decoration */}
      <motion.div
        initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mt-12 md:mt-20 w-full max-w-2xl lg:max-w-4xl mx-auto flex flex-col gap-3 relative pointer-events-none select-none"
        dir={dir}
      >
        {/* Gradient Overlay for the fade-out effect */}
        <div className="absolute -inset-x-10 -bottom-20 top-[20%] bg-gradient-to-b from-transparent via-[#080808]/80 to-[#080808] z-10 pointer-events-none" />

        {dummyCards.map((card, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-[#141414]"
            style={{
              opacity: 1 - idx * 0.25,
              transform: `scale(${1 - idx * 0.03}) translateY(${idx * 4}px)`,
            }}
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/5 w-10 h-10 rounded-xl text-white opacity-40 flex items-center justify-center overflow-hidden shrink-0">
                <span className="text-xl font-light">{card.preview}</span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-white font-light text-[15px] opacity-90">
                  {card.name}
                </h3>
                <div className="h-1.5 w-16 bg-white/10 rounded-full" />
              </div>
            </div>
          </div>
        ))}

        {/* Additional card for the complete fade out */}
        <div
          className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-[#141414]"
          style={{
            opacity: 0.15,
            transform: `scale(0.91) translateY(12px)`,
          }}
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/5 w-10 h-10 rounded-xl text-white opacity-40 flex items-center justify-center overflow-hidden shrink-0">
              <span className="text-xl font-light">{t("home.preview_char")}</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-4 w-24 bg-white/10 rounded" />
              <div className="h-2 w-16 bg-white/5 rounded" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Professional Features Section */}
      <div className="w-full max-w-5xl xl:max-w-6xl mx-auto mt-20 z-20 relative pointer-events-auto" dir={dir}>
        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-start text-start mb-10 md:mb-16 gap-6"
        >
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-semibold text-white opacity-90 mb-4 leading-tight tracking-tight">
              {t("home.features_title1")} <br />
              <span className="text-white opacity-60">{t("home.features_title2")}</span>
            </h2>
            <p className="text-white opacity-40 text-sm md:text-base font-light leading-relaxed">
              {t("home.features_desc1")}{" "}
              <strong className="font-medium text-white opacity-70">{t("home.features_desc2")}</strong>{" "}
              {t("home.features_desc3")}{" "}
              <strong className="font-medium text-white opacity-70">{t("home.features_desc4")}</strong>{" "}
              {t("home.features_desc5")}{" "}
              <strong className="font-medium text-white opacity-70">{t("home.features_desc6")}</strong>{" "}
              {t("home.features_desc7")}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {/* Feature 1 - Left Panel */}
          <motion.div
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-3xl bg-[#080808] border border-white/5 p-6 md:p-10 flex flex-col justify-between min-h-[350px] md:min-h-[400px] shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-b from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-all duration-300">
                <Beaker className="w-5 h-5 text-white opacity-80 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h3 className="text-white opacity-90 font-semibold text-lg md:text-xl mb-3 tracking-tight">
                {t("home.feature1_title")}
              </h3>
              <p className="text-white opacity-40 text-sm font-light leading-relaxed max-w-sm">
                {t("home.feature1_desc1")} <strong className="font-medium text-white opacity-70">OpenType</strong>{" "}
                {t("home.feature1_desc2")}{" "}
                <strong className="font-medium text-white opacity-70">{t("home.feature1_desc3")}</strong>.
              </p>
            </div>

            {/* Visual element */}
            <div className="relative z-10 mt-10 w-full h-32 md:h-40 border border-white/5 rounded-2xl bg-black/50 overflow-hidden flex flex-col p-4 group-hover:border-white/10 transition-all duration-500">
              <div className="flex items-center gap-4 w-full opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                <div className="flex-1 flex flex-col gap-2">
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[10px] uppercase text-white opacity-40">Weight</span>
                    <span className="text-[10px] text-white opacity-40">700</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-[70%] bg-white/60 rounded-full"></div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[10px] uppercase text-white opacity-40">Width</span>
                    <span className="text-[10px] text-white opacity-40">100</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-[40%] bg-white/60 rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center mt-2 group-hover:scale-[1.02] transition-transform duration-700">
                <span className="text-5xl md:text-6xl font-bold tracking-tighter text-white opacity-70">
                  {t("home.fonts_text")}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right Panels stacked */}
          <div className="flex flex-col gap-5 md:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="group relative overflow-hidden rounded-3xl bg-[#080808] border border-white/5 p-6 md:p-8 flex-1 flex flex-col shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center">
                <div className="flex-1">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-b from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-5 group-hover:bg-white/10 transition-all duration-300">
                    <Upload className="w-5 h-5 text-white opacity-80 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <h3 className="text-white opacity-90 font-semibold text-lg md:text-xl mb-2 tracking-tight">
                    {t("home.feature2_title")}
                  </h3>
                  <p className="text-white opacity-40 text-sm font-light leading-relaxed">
                    {t("home.feature2_desc1")}{" "}
                    <strong className="font-medium text-white opacity-70">{t("home.feature2_desc2")}</strong>{" "}
                    {t("home.feature2_desc3")}{" "}
                    <strong className="font-medium text-white opacity-70">{t("home.feature2_desc4")}</strong>{" "}
                    {t("home.feature2_desc5")}
                  </p>
                </div>

                {/* Visual Element */}
                <div className="w-full md:w-40 h-20 relative shrink-0">
                  <div className="absolute top-2 left-4 right-8 h-10 bg-white/5 border border-white/5 rounded-xl transform -rotate-3 scale-95 opacity-40 transition-all duration-500 group-hover:-rotate-6 group-hover:scale-90 flex items-center px-4" />
                  <div className="absolute top-1 left-2 right-4 h-10 bg-white/5 border border-white/10 rounded-xl transform rotate-1 scale-100 opacity-60 transition-all duration-500 group-hover:rotate-3 group-hover:scale-95 flex items-center px-4" />
                  <div className="absolute top-0 left-0 right-0 h-12 bg-white/10 border border-white/10 rounded-xl shadow-lg backdrop-blur-sm transform transition-all duration-500 group-hover:-translate-y-1 flex items-center justify-between px-3">
                    <span className="text-[10px] font-mono text-white opacity-50 truncate pr-2">
                      MyCustomFont.ttf
                    </span>
                    <span className="text-sm font-bold opacity-80 shrink-0">{t("home.preview_char")}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="group relative overflow-hidden rounded-3xl bg-[#080808] border border-white/5 p-6 md:p-8 flex-1 flex flex-col shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-b from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-5 group-hover:bg-white/10 transition-all duration-300">
                    <Compass className="w-5 h-5 text-white opacity-80 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <h3 className="text-white opacity-90 font-semibold text-lg md:text-xl mb-2 tracking-tight">
                    {t("home.feature3_title")}
                  </h3>
                  <p className="text-white opacity-40 text-sm font-light leading-relaxed">
                    {t("home.feature3_desc1")}{" "}
                    <strong className="font-medium text-white opacity-70">{t("home.feature3_desc2")}</strong>{" "}
                    {t("home.feature3_desc3")}{" "}
                    <strong className="font-medium text-white opacity-70">{t("home.feature3_desc4")}</strong>
                    {t("home.feature3_desc5")}
                  </p>
                </div>

                {/* Visual Element */}
                <div className="flex flex-col justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity duration-500 shrink-0 min-w-[80px]">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-white opacity-30 w-6">900</span>
                    <span className="text-xl font-black text-white opacity-90">{t("home.dummy_text")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-white opacity-30 w-6">700</span>
                    <span className="text-xl font-bold text-white opacity-70">{t("home.dummy_text")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-white opacity-30 w-6">300</span>
                    <span className="text-xl font-light text-white opacity-50">{t("home.dummy_text")}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Telegram CTA */}
      <motion.div
        id="font-finder-cta"
        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-3xl xl:max-w-4xl mx-auto mt-6 md:mt-10 z-20 relative pointer-events-auto"
        dir={dir}
      >
        <div className="relative group overflow-hidden rounded-3xl bg-[#080808] border border-white/5 shadow-2xl p-5 md:p-6 lg:p-8">
          {/* Ambient Inner Glows */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-blue-600/5 opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="flex flex-col md:flex-row items-center justify-between relative z-10 w-full transition-all gap-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-5 w-full">
              {/* Icon Container */}
              <div className="relative shrink-0 flex items-center justify-center w-14 h-14 rounded-[1.25rem] bg-gradient-to-b from-white/10 to-transparent border border-white/10 group-hover:bg-white/10 transition-all duration-300">
                <Focus className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform duration-500 relative z-10" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                </div>
                {/* Telegram floating Mini Badge */}
                <div className={`absolute -bottom-1 ${dir === 'rtl' ? '-left-1' : '-right-1'} w-6 h-6 bg-[#2AABEE] rounded-full flex items-center justify-center border-2 border-[#080808] shadow-md group-hover:scale-110 transition-transform duration-500 z-20`}>
                  <Send className={`w-2.5 h-2.5 text-white ${dir === 'rtl' ? 'mr-[-1px]' : 'ml-[-1px]'}`} />
                </div>
              </div>

              {/* Text Content */}
              <div className="text-start flex-1 max-w-lg">
                <h3 className="text-lg md:text-xl font-bold text-white opacity-90 mb-1.5 tracking-tight">
                  {language === 'ar' ? 'هل تبحث عن اسم خط بصورة؟' : 'Looking for a font from an image?'}
                </h3>
                <p className="text-white opacity-40 text-xs md:text-sm font-light leading-relaxed group-hover:opacity-60 transition-colors">
                  {language === 'ar' 
                    ? 'التقط صورة للخط المجهول وأرسلها في جروبنا على تليجرام، وسيقوم فريقنا بالتعرف عليه وإرسال ملف الخط لك.' 
                    : 'Take a picture of the unknown font and send it in our Telegram group. Our team will identify and send it.'}
                </p>
              </div>
            </div>
            
            {/* CTA Button */}
            <div className="shrink-0 w-full md:w-auto mt-2 md:mt-0 flex justify-end">
               <a href="https://t.me/ElgharibFonts" target="_blank" rel="noopener noreferrer" className="flex flex-row items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-black font-bold text-xs tracking-wide shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 whitespace-nowrap">
                  <span>{language === 'ar' ? 'انضم للجروب' : 'Join the Group'}</span>
                  <div className={`w-5 h-5 rounded-full bg-black/5 flex items-center justify-center ${dir === 'rtl' ? '-ml-1' : '-mr-1'}`}>
                    <svg className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
               </a>
            </div>
          </div>
        </div>
      </motion.div>

    </div>
  );
};

