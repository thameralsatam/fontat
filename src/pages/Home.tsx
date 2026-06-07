import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Compass, Camera, Focus, Search, ExternalLink, Check, Copy, Folder } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";

// Import images as native ES modules for bulletproof bundling
import img_elgharibDiscussions from "../assets/telegram-images/elgharib-discussions.webp";
import img_elgharibMain from "../assets/telegram-images/elgharib-main.webp";
import img_elgharibFont4u from "../assets/telegram-images/elgharib-font4u.webp";
import img_quranicFonts from "../assets/telegram-images/quranic-fonts.webp";
import img_elgharibEnglish from "../assets/telegram-images/elgharib-english.webp";
import img_elgharibIcons from "../assets/telegram-images/elgharib-icons.webp";
import img_arabicLibrary from "../assets/telegram-images/arabic-library.webp";
import img_omarHassan from "../assets/telegram-images/omar-hassan.webp";
import img_iwantype from "../assets/telegram-images/iwantype.webp";
import img_medad from "../assets/telegram-images/medad.webp";
import img_tsfonts from "../assets/telegram-images/tsfonts.webp";
import img_mostafaElabasiry from "../assets/telegram-images/mostafa-elabasiry.webp";

const TelegramAvatar = ({ image, nameAr, nameEn, isAr }: { image?: string; nameAr: string; nameEn: string; isAr: boolean }) => {
  const [hasError, setHasError] = useState(!image);

  return (
    <div className="relative shrink-0 select-none w-12 h-12 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden flex items-center justify-center group-hover:border-cyan-500/30 transition-all duration-300 shadow-md">
      {!hasError && image ? (
        <img
          src={image}
          alt={isAr ? nameAr : nameEn}
          className="w-full h-full object-cover transition-opacity duration-300"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-bold text-white/30 group-hover:text-cyan-400/50 transition-colors pointer-events-none uppercase">
          {nameEn.slice(0, 2)}
        </div>
      )}
    </div>
  );
};

export const Home = () => {
  const navigate = useNavigate();
  const { t, dir, language } = useLanguage();

  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [telegramSearch, setTelegramSearch] = useState("");

  useEffect(() => {
    if (window.location.hash === "#telegram-directory") {
      const el = document.getElementById("telegram-directory");
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    }
  }, []);

  const handleCopyLink = (link: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const telegramData = [
    {
      nameAr: "نقاشات خطوط أحمد الغريب",
      nameEn: "AlGharib Fonts Discussions Group",
      link: "https://t.me/ElgharibFonts",
      username: "@ElgharibFonts",
      isDesigner: false,
      image: img_elgharibDiscussions,
      tagsAr: ["جروب", "كشف الخطوط بالصور", "مجاني", "عربي"],
      tagsEn: ["Group", "Detect Fonts via Images", "Free", "Arabic"],
      supportsImageSearch: true
    },
    {
      nameAr: "خطوط أحمد الغريب",
      nameEn: "AlGharib Main Fonts",
      link: "https://t.me/ElgharibFont",
      username: "@ElgharibFont",
      isDesigner: false,
      image: img_elgharibMain,
      tagsAr: ["قناة", "مجاني", "عربي", "مكتبة"],
      tagsEn: ["Channel", "Free", "Arabic", "Library"]
    },
    {
      nameAr: "خطوط الغريب",
      nameEn: "AlGharib Fonts",
      link: "https://t.me/font4u",
      username: "@font4u",
      isDesigner: false,
      image: img_elgharibFont4u,
      tagsAr: ["قناة", "مجاني", "عربي", "مكتبة"],
      tagsEn: ["Channel", "Free", "Arabic", "Library"]
    },
    {
      nameAr: "خطوط قران",
      nameEn: "Quranic Fonts Channel",
      link: "https://t.me/quranfont",
      username: "@quranfont",
      isDesigner: false,
      image: img_quranicFonts,
      tagsAr: ["قناة", "مجاني", "عربي", "إنجليزي", "أيقونات", "قرآني", "مكتبة"],
      tagsEn: ["Channel", "Free", "Arabic", "English", "Icons", "Quranic", "Library"]
    },
    {
      nameAr: "خطوط إنجليزية أحمد الغريب",
      nameEn: "AlGharib English Fonts",
      link: "https://t.me/ElghribFont",
      username: "@ElghribFont",
      isDesigner: false,
      image: img_elgharibEnglish,
      tagsAr: ["قناة", "مجاني", "إنجليزي", "مكتبة"],
      tagsEn: ["Channel", "Free", "English", "Library"]
    },
    {
      nameAr: "خطوط أيقونات أحمد الغريب",
      nameEn: "AlGharib Icon Fonts Channel",
      link: "https://t.me/ElghribFonts",
      username: "@ElghribFonts",
      isDesigner: false,
      image: img_elgharibIcons,
      tagsAr: ["قناة", "مجاني", "عربي", "أيقونات", "مكتبة"],
      tagsEn: ["Channel", "Free", "Arabic", "Icons", "Library"]
    },
    {
      nameAr: "المكتبة العربية للخطوط",
      nameEn: "Arabic Fonts Library",
      link: "https://t.me/arabicllibrary",
      username: "@arabicllibrary",
      isDesigner: false,
      image: img_arabicLibrary,
      tagsAr: ["قناة", "مجاني", "عربي", "مكتبة"],
      tagsEn: ["Channel", "Free", "Arabic", "Library"]
    },
    {
      nameAr: "Omar Hassan Type",
      nameEn: "Omar Hassan Type",
      link: "https://t.me/OmarHassanType",
      username: "@OmarHassanType",
      isDesigner: true,
      image: img_omarHassan,
      tagsAr: ["قناة", "مجاني", "مدفوع", "عربي", "استوديو"],
      tagsEn: ["Channel", "Free", "Paid", "Arabic", "Studio"]
    },
    {
      nameAr: "Iwantype",
      nameEn: "Iwantype",
      link: "https://t.me/iwantype",
      username: "@iwantype",
      isDesigner: true,
      image: img_iwantype,
      tagsAr: ["قناة", "مجاني", "مدفوع", "عربي", "استوديو"],
      tagsEn: ["Channel", "Free", "Paid", "Arabic", "Studio"]
    },
    {
      nameAr: "Medad",
      nameEn: "Medad",
      link: "https://t.me/MedadFonts",
      username: "@MedadFonts",
      isDesigner: true,
      image: img_medad,
      tagsAr: ["قناة", "مجاني", "مدفوع", "عربي", "استوديو", "مكتبة"],
      tagsEn: ["Channel", "Free", "Paid", "Arabic", "Studio", "Library"]
    },
    {
      nameAr: "TSfonts",
      nameEn: "TSfonts",
      link: "https://t.me/tsfont",
      username: "@tsfont",
      isDesigner: true,
      image: img_tsfonts,
      tagsAr: ["قناة", "مجاني", "مدفوع", "عربي", "استوديو"],
      tagsEn: ["Channel", "Free", "Paid", "Arabic", "Studio"]
    },
    {
      nameAr: "Mostafa El Abasiry",
      nameEn: "Mostafa El Abasiry",
      link: "https://t.me/arabictypo",
      username: "@arabictypo",
      isDesigner: true,
      image: img_mostafaElabasiry,
      tagsAr: ["قناة", "مجاني", "مدفوع", "عربي", "استوديو"],
      tagsEn: ["Channel", "Free", "Paid", "Arabic", "Studio"]
    }
  ];

  const filteredTelegram = telegramData.filter(entity => {
    const isAr = language === 'ar';
    const nameMatch = isAr 
      ? entity.nameAr.toLowerCase().includes(telegramSearch.toLowerCase())
      : entity.nameEn.toLowerCase().includes(telegramSearch.toLowerCase());
    
    const usernameMatch = entity.username.toLowerCase().includes(telegramSearch.toLowerCase());
    return nameMatch || usernameMatch;
  });

  const dummyCards = [
    { name: "Cairo", weight: "Regular", ext: ".ttf", preview: t("home.preview_char") },
    { name: "Tajawal", weight: "Bold", ext: ".ttf", preview: t("home.preview_char") },
    { name: "Changa", weight: "Light", ext: ".otf", preview: t("home.preview_char") },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center pt-12 max-lg:landscape:pt-4 px-4 relative overflow-hidden pb-40 max-lg:landscape:pb-16">
      <div className="text-center z-10 w-full max-w-4xl xl:max-w-6xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-2xl sm:text-3xl md:text-5xl font-semibold text-white tracking-tight leading-snug"
        >
          {t("home.hero_title")}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-3xl bg-[#080808] border border-white/5 p-6 md:p-10 flex flex-col justify-between min-h-[350px] md:min-h-[400px] shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-white group-hover:bg-white/10 transition-colors duration-300">
                <Compass className="w-6 h-6" />
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
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
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
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
              </div>

              {/* Text Content */}
              <div className="text-start flex-1 max-w-lg">
                <h3 className="text-lg md:text-xl font-bold text-white opacity-90 mb-1.5 tracking-tight">
                  {language === 'ar' ? 'هل تبحث عن اسم خط بصورة؟' : 'Looking for a font from an image?'}
                </h3>
                <p className="text-white opacity-40 text-xs md:text-sm font-light leading-relaxed group-hover:opacity-60 transition-colors">
                  {language === 'ar' 
                    ? 'أرسل صورة الخط المجهول في جروب النقاشات وسنتعرف عليه ونرسله لك فوراً.' 
                    : 'Send any unknown font image in our discussions group and we will find it for you instantly.'}
                </p>
              </div>
            </div>
             
             {/* CTA Buttons */}
             <div className="shrink-0 w-full md:w-auto mt-2 md:mt-0 flex justify-end items-center">
                <a 
                  href="#telegram-directory" 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('telegram-directory')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="w-full sm:w-auto flex flex-row items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-gray-100 text-black font-bold text-xs tracking-wide shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 whitespace-nowrap cursor-pointer"
                >
                   <span>{language === 'ar' ? 'تصفح دليل القنوات والجروبات' : 'Browse Directory'}</span>
                   <div className={`w-4 h-4 rounded-full bg-black/5 flex items-center justify-center ${dir === 'rtl' ? '-ml-1' : '-mr-1'}`}>
                     <svg className={`w-2.5 h-2.5 ${dir === 'rtl' ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                       <path d="M5 12h14M12 5l7 7-7 7" />
                     </svg>
                   </div>
                </a>
             </div>
           </div>
         </div>
      </motion.div>

      {/* Embedded Telegram Directory Section */}
      <div 
        id="telegram-directory" 
         className="w-full max-w-5xl xl:max-w-6xl mx-auto mt-24 mb-10 px-0 relative z-20"
         dir={dir}
       >
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-white/5 pb-6">
           <div>
             <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight">
               {language === 'ar' ? 'دليل قنوات ومجموعات تليجرام' : 'Telegram Channels & Groups Directory'}
             </h2>
             <p className="text-white opacity-50 text-xs md:text-sm mt-1 max-w-xl font-light">
               {language === 'ar' 
                 ? 'تصفح وتابع أفضل قنوات ومجموعات تليجرام المتخصصة بنشر الخطوط العربية وملحقات التصميم.'
                 : 'Browse and follow the best Telegram channels and groups specializing in Arabic fonts and design assets.'}
             </p>
           </div>

           {/* Search Box */}
           <div className="relative w-full md:max-w-xs font-sans">
             <input
               type="text"
               value={telegramSearch}
               onChange={(e) => setTelegramSearch(e.target.value)}
               placeholder={language === 'ar' ? 'ابحث باسم القناة أو المعرف...' : 'Search name or user...'}
               className="w-full pl-9 pr-9 py-2.5 bg-[#0c0c0c] border border-white/10 hover:border-white/20 rounded-xl text-white text-xs outline-none focus:border-[#2AABEE]/40 focus:bg-[#070707] transition-all"
             />
             <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 ${dir === 'rtl' ? 'right-3' : 'left-3'}`} />
           </div>
         </div>

         {/* Channels/Groups Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
           {filteredTelegram.map((entity) => {
              const isAr = language === 'ar';
              const isCopied = copiedLink === entity.link;

              return (
                <div
                  key={entity.link}
                  className="group relative overflow-hidden rounded-[1.5rem] flex flex-col justify-between shadow-[0_4px_30px_rgba(0,0,0,0.4)] transition-all duration-300 hover:translate-y-[-2px] p-5 md:p-6 bg-[#0c0c0c]/80 border border-white/[0.06] hover:border-white/15 hover:bg-[#111111]/90"
                >
                  {/* Gentle hover accent glow */}
                  <div className="absolute inset-0 bg-gradient-to-br transition-opacity duration-300 pointer-events-none from-cyan-400/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100" />

                  <div>
                    {/* Header Row with Logo/Avatar and Username */}
                    <div className="flex items-center gap-3.5 mb-3.5">
                      <TelegramAvatar 
                        image={entity.image} 
                        nameAr={entity.nameAr} 
                        nameEn={entity.nameEn} 
                        isAr={isAr} 
                      />
                      <div className="flex-1 min-w-0">
                        {/* Channel/Group name - Larger and highly visible */}
                        <h3 className="text-sm md:text-[15px] font-bold tracking-tight transition-colors duration-300 leading-relaxed text-white opacity-95 group-hover:text-cyan-300 pt-1.5 pb-1 select-text truncate">
                          {isAr ? entity.nameAr : entity.nameEn}
                        </h3>
                        {/* Telegram Link/username */}
                        <div className="mt-0.5">
                          <a 
                            href={entity.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2abcfe] hover:text-[#2abcfe]/85 transition-colors"
                          >
                            <span className="font-mono">{entity.username}</span>
                            <ExternalLink className="w-3 h-3 opacity-80" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Curated Beautiful Labels/Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                       {(isAr ? entity.tagsAr : entity.tagsEn).map((tag) => {
                        const isGroup = tag === 'جروب' || tag === 'Group';
                        const isChannel = tag === 'قناة' || tag === 'Channel';
                        const isFree = tag === 'مجاني' || tag === 'Free';
                        const isPaid = tag === 'مدفوع' || tag === 'Paid';
                        const isDesigner = tag === 'مصمم خطوط' || tag === 'Font Designer' || tag === 'استوديو' || tag === 'Studio';
                        const isImageSearch = tag === 'تحديد الخط بالصور' || tag === 'Font Identification' || tag === 'كشف الخطوط بالصور' || tag === 'Detect Fonts via Images';

                        return (
                          <span 
                            key={tag} 
                            className={`text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full transition-all duration-300 inline-flex items-center gap-1 ${
                              isGroup ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' :
                              isChannel ? 'bg-[#2AABEE]/10 text-[#2AABEE] border border-[#2AABEE]/15' :
                              isFree ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' :
                              isPaid ? 'bg-rose-500/10 text-rose-400 border border-rose-500/15' :
                              isDesigner ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/15' :
                              isImageSearch ? 'bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/25 animate-pulse shadow-[0_0_8px_rgba(217,70,239,0.25)]' :
                              'bg-white/5 border border-white/5 text-white/55'
                            }`}
                          >
                            {isImageSearch && <Camera className="w-3.5 h-3.5 text-fuchsia-300 shrink-0" />}
                            {isImageSearch ? (isAr ? "كشف الخطوط بالصور" : "Verify Font via Image") : tag}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Aesthetic Action Row - Lifted and compacted */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/[0.04] z-10 w-full mt-1.5">
                    <a 
                      href={entity.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex-1 py-1.5 md:py-2 px-3 md:px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 bg-white hover:bg-gray-100 text-black"
                    >
                      <span>
                        {isAr 
                          ? (entity.tagsAr.includes("جروب") || entity.tagsAr.includes("Group") || entity.nameAr.includes("جروب") ? "الانتقال للجروب" : "الانتقال للقناة") 
                          : (entity.tagsEn.includes("Group") || entity.tagsAr.includes("جروب") ? "Go to Group" : "Go to Channel")}
                      </span>
                    </a>

                    <button 
                      onClick={(e) => handleCopyLink(entity.link, e)}
                      className={`p-2 rounded-xl border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer ${isCopied ? 'border-green-500/20 text-green-400 bg-green-500/5' : ''}`}
                      title={isAr ? 'نسخ الرابط' : 'Copy link'}
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredTelegram.length === 0 && (
             <div className="col-span-full py-16 text-center text-white/30 flex flex-col items-center justify-center">
               <Folder className="w-8 h-8 mb-3 opacity-15" />
               <p className="text-xs font-light">
                 {language === 'ar' ? 'لا توجد نتائج تطابق بحثك حالياً.' : 'No matching results found.'}
               </p>
             </div>
           )}
         </div>
      </div>

    </div>
  );
};

