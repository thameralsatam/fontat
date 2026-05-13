import React from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Compass, Beaker } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";

export const Home = () => {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();

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
            className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 text-white font-bold flex items-center justify-center gap-2 transition-all text-sm active:scale-95"
          >
            <Upload className="w-4 h-4 opacity-70" />
            {t("home.upload")}
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
              <div className="bg-white/5 w-10 h-10 rounded-xl text-white/40 flex items-center justify-center overflow-hidden shrink-0">
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
            <div className="bg-white/5 w-10 h-10 rounded-xl text-white/40 flex items-center justify-center overflow-hidden shrink-0">
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
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-5xl xl:max-w-6xl mx-auto mt-20 z-20 relative pointer-events-auto"
        dir={dir}
      >
        <div className="flex flex-col items-start text-start mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4 leading-tight">
              {t("home.features_title1")} <br />
              {t("home.features_title2")}
            </h2>
            <p className="text-white/60 text-base md:text-lg font-light leading-relaxed">
              {t("home.features_desc1")}{" "}
              <strong className="font-bold text-white/90">{t("home.features_desc2")}</strong>{" "}
              {t("home.features_desc3")}{" "}
              <strong className="font-bold text-white/90">{t("home.features_desc4")}</strong>{" "}
              {t("home.features_desc5")}{" "}
              <strong className="font-bold text-white/90">{t("home.features_desc6")}</strong>{" "}
              {t("home.features_desc7")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature 1 - Left Panel */}
          <div className="bg-[#111] border border-white/5 rounded-[2rem] p-10 md:p-12 hover:border-white/10 transition-colors flex flex-col justify-between min-h-[400px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-bl from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-8">
                <Beaker className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-2xl mb-4">
                {t("home.feature1_title")}
              </h3>
              <p className="text-white/60 text-base font-light leading-relaxed max-w-sm">
                {t("home.feature1_desc1")} <strong className="font-bold text-white/90">OpenType</strong>{" "}
                {t("home.feature1_desc2")}{" "}
                <strong className="font-bold text-white/90">{t("home.feature1_desc3")}</strong>.
              </p>
            </div>

            {/* Visual element */}
            <div className="relative z-10 mt-12 w-full h-40 border border-white/10 rounded-2xl bg-[#0a0a0a] overflow-hidden flex flex-col p-4 group-hover:border-white/20 transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-4 w-full opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                <div className="flex-1 flex flex-col gap-2">
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[9px] font-mono tracking-widest uppercase text-white/40">
                      Weight
                    </span>
                    <span className="text-[9px] font-mono text-white/40">
                      700
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-[70%] bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[9px] font-mono tracking-widest uppercase text-white/40">
                      Width
                    </span>
                    <span className="text-[9px] font-mono text-white/40">
                      100
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-[40%] bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center mt-2 group-hover:scale-105 transition-transform duration-700">
                <span className="text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40">
                  {t("home.fonts_text")}
                </span>
              </div>
            </div>
          </div>

          {/* Right Panels stacked */}
          <div className="flex flex-col gap-6">
            <div className="bg-[#111] border border-white/5 rounded-[2rem] p-10 md:p-12 hover:border-white/10 transition-colors flex-1 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[50px] group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-2xl mb-3">
                    {t("home.feature2_title")}
                  </h3>
                  <p className="text-white/60 text-base font-light leading-relaxed">
                    {t("home.feature2_desc1")}{" "}
                    <strong className="font-bold text-white/90">{t("home.feature2_desc2")}</strong>{" "}
                    {t("home.feature2_desc3")}{" "}
                    <strong className="font-bold text-white/90">{t("home.feature2_desc4")}</strong>{" "}
                    {t("home.feature2_desc5")}
                  </p>
                </div>

                {/* Visual Element */}
                <div className="relative h-20 mt-8 w-full">
                  <div className="absolute top-4 left-4 right-8 h-12 bg-white/5 border border-white/10 rounded-xl transform -rotate-3 scale-95 opacity-40 transition-all duration-500 group-hover:-rotate-6 group-hover:scale-90 flex items-center px-4">
                    <span className="text-xl font-bold opacity-0">{t("home.preview_char")}</span>
                  </div>
                  <div className="absolute top-2 left-2 right-4 h-12 bg-white/10 border border-white/10 rounded-xl transform rotate-1 scale-100 opacity-60 transition-all duration-500 group-hover:rotate-3 group-hover:scale-95 flex items-center px-4">
                    <span className="text-xl font-bold opacity-0">{t("home.preview_char")}</span>
                  </div>
                  <div className="absolute top-0 left-0 right-0 h-12 bg-white/10 border border-white/20 rounded-xl shadow-lg backdrop-blur-sm transform transition-all duration-500 group-hover:translate-y-[-4px] flex items-center justify-between px-4">
                    <span className="text-xs font-mono text-white/60">
                      MyCustomFont.ttf
                    </span>
                    <span className="text-sm font-bold opacity-80">{t("home.preview_char")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#111] border border-white/5 rounded-[2rem] p-10 md:p-12 hover:border-white/10 transition-colors flex-1 relative overflow-hidden group">
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <Compass className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-2xl mb-3">
                    {t("home.feature3_title")}
                  </h3>
                  <p className="text-white/60 text-base font-light leading-relaxed">
                    {t("home.feature3_desc1")}{" "}
                    <strong className="font-bold text-white/90">{t("home.feature3_desc2")}</strong>{" "}
                    {t("home.feature3_desc3")}{" "}
                    <strong className="font-bold text-white/90">{t("home.feature3_desc4")}</strong>
                    {t("home.feature3_desc5")}
                  </p>
                </div>

                {/* Visual Element */}
                <div className="mt-8 flex flex-col gap-2 opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-white/30 w-8">
                      900
                    </span>
                    <span className="text-2xl font-black text-white/90">
                      {t("home.dummy_text")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-white/30 w-8">
                      700
                    </span>
                    <span className="text-2xl font-bold text-white/70">
                      {t("home.dummy_text")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-white/30 w-8">
                      300
                    </span>
                    <span className="text-2xl font-light text-white/50">
                      {t("home.dummy_text")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

