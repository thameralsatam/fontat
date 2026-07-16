import { useState, useEffect, useRef } from 'react';
import { X, Play, Download, Loader2, AlertCircle, Sparkles, Film } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import * as Mp4Muxer from 'mp4-muxer';
import { useLanguage } from '../../contexts/LanguageContext';

interface Axis {
  tag: string;
  name?: string;
  minValue: number;
  maxValue: number;
  defaultValue: number;
}

interface VideoExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  axes: Axis[];
  currentAxisValues: Record<string, number>;
  text: string;
  fontFamily: string;
  openTypeFeatures: Record<string, boolean | undefined>;
  fontSize: number;
  fontBlob: Blob | null;
  textColor: string;
  bgColor: string;
  lineHeight: number | string;
}

type QualityType = 'low' | 'medium' | 'high';
type AspectRatioType = '1:1' | '16:9' | '9:16';

export function VideoExportModal({
  isOpen,
  onClose,
  axes,
  currentAxisValues,
  text,
  fontFamily,
  openTypeFeatures,
  fontSize,
  fontBlob,
  textColor,
  bgColor,
  lineHeight
}: VideoExportModalProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [fontBase64, setFontBase64] = useState<string | null>(null);

  useEffect(() => {
    if (!fontBlob) {
      setFontBase64(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setFontBase64(e.target?.result as string);
    };
    reader.readAsDataURL(fontBlob);
  }, [fontBlob]);

  const fontEmbedCSS = fontBase64 ? `
    @font-face {
      font-family: '${fontFamily}';
      src: url('${fontBase64}') format('truetype');
    }
  ` : '';

  // State for all axes start/end/animated configuration
  const [axesConfig, setAxesConfig] = useState<Record<string, { start: number; end: number; staticVal: number; animated: boolean }>>({});
  const [duration, setDuration] = useState<number>(3);
  const [fps, setFps] = useState<number>(30);
  const [quality, setQuality] = useState<QualityType>('medium');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('1:1');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoMimeType, setVideoMimeType] = useState<string>('video/mp4');

  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const resetExport = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
    setIsFinished(false);
    setProgress(0);
    setError(null);
  };

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const handleDurationChange = (val: number) => {
    resetExport();
    setDuration(val);
  };

  const handleFpsChange = (val: number) => {
    resetExport();
    setFps(val);
  };

  const handleQualityChange = (val: QualityType) => {
    resetExport();
    setQuality(val);
  };

  // Translation mapping directly inside the component for perfect bilingual presentation
  const translations = {
    ar: {
      title: "تصدير حركة الخط المتغير (فيديو)",
      subtitle: "صمّم وحمّل فيديو احترافي للمحاور المتغيرة وهي تتمدد وتتحرك بسلاسة.",
      duration: "السرعة والمدة (بالثواني)",
      fps: "سلاسة الحركة (إطار/ثانية)",
      quality: "دقة وجودة الفيديو",
      qualityLow: "دقة متوسطة (480p) - خفيف سريع",
      qualityMedium: "دقة عالية (720p) - متوازن",
      qualityHigh: "دقة فائقة (1080p) - جودة سينمائية",
      startVal: "البداية (من)",
      endVal: "النهاية (إلى)",
      staticVal: "القيمة الثابتة",
      animateAxis: "تحريك هذا المحور",
      generate: "تصدير وحفظ الفيديو",
      exporting: "جاري التقاط الإطارات ومعالجة الحركة...",
      finished: "اكتمل التصدير بنجاح!",
      downloadVideo: "تحميل ملف الفيديو (MP4/WebM)",
      cancel: "إلغاء",
      noAxes: "هذا الخط لا يحتوي على محاور متغيرة لتحريكها.",
      error: "حدث خطأ أثناء تصدير الفيديو",
      engineWebCodecs: "محرك سريع فائق الجودة",
      engineMediaRecorder: "محرك التوافقية العالية",
      aspectRatio: "حجم إطار الفيديو",
      livePreview: "معاينة الحركة الحية"
    },
    en: {
      title: "Export Variable Font Animation",
      subtitle: "Design and download a smooth motion video of your variable axes animating.",
      duration: "Duration (seconds)",
      fps: "Framerate (FPS)",
      quality: "Video Quality & Resolution",
      qualityLow: "Standard (480p) - Fast",
      qualityMedium: "High Def (720p) - Balanced",
      qualityHigh: "Full HD (1080p) - Cinematic",
      startVal: "Start Value",
      endVal: "End Value",
      staticVal: "Static Value",
      animateAxis: "Animate this axis",
      generate: "Export Animation Video",
      exporting: "Rendering frames and encoding motion...",
      finished: "Video rendered successfully!",
      downloadVideo: "Download Video",
      cancel: "Cancel",
      noAxes: "This font doesn't have variable axes to animate.",
      error: "Error exporting video",
      engineWebCodecs: "Ultra High Quality Engine",
      engineMediaRecorder: "High Compatibility Fallback Engine",
      aspectRatio: "Video Aspect Ratio",
      livePreview: "Live Motion Preview"
    }
  };

  const t = (key: keyof typeof translations['en']) => {
    return translations[isAr ? 'ar' : 'en'][key];
  };

  // Populate default settings when axes are available
  useEffect(() => {
    if (axes && axes.length > 0) {
      const initialConfig: typeof axesConfig = {};
      axes.forEach(axis => {
        const currentVal = currentAxisValues[axis.tag] !== undefined ? currentAxisValues[axis.tag] : axis.defaultValue;
        initialConfig[axis.tag] = {
          start: axis.minValue,
          end: axis.maxValue,
          staticVal: currentVal,
          animated: axis.tag === 'wght' || axis.tag === 'wdth' || axis.tag === 'opsz' || axes.length === 1
        };
      });
      setAxesConfig(initialConfig);
    }
  }, [axes, currentAxisValues]);

  // Generate CSS Feature string
  const activeFeatures = Object.entries(openTypeFeatures)
    .filter(([_, enabled]) => enabled)
    .map(([tag]) => `"${tag}" 1`)
    .join(', ');

  // Get font variation settings for a given factor t (0 to 1)
  const getFVS = (tFactor: number) => {
    return Object.entries(axesConfig)
      .map(([tag, cfg]) => {
         const val = cfg.animated 
           ? cfg.start + (cfg.end - cfg.start) * tFactor
           : cfg.staticVal;
         return `"${tag}" ${val}`;
      })
      .join(', ');
  };

  // Update a configuration property of an axis
  const updateAxisProp = (tag: string, prop: 'start' | 'end' | 'staticVal' | 'animated', val: any) => {
    resetExport();
    setAxesConfig(prev => ({
      ...prev,
      [tag]: {
        ...prev[tag],
        [prop]: val
      }
    }));
  };

  // Dynamic live preview animation oscillation
  const [previewT, setPreviewT] = useState(0);

  useEffect(() => {
    if (!isOpen || isExporting || isFinished) return;

    let animId: number;
    const startTime = performance.now();

    const loop = (time: number) => {
      const elapsed = time - startTime;
      const period = duration * 1000;
      const cycle = (elapsed % period) / period;
      const tVal = 0.5 + 0.5 * Math.sin(cycle * Math.PI * 2 - Math.PI / 2);
      setPreviewT(tVal);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, isExporting, isFinished, duration]);

  // Determine export dimensions and bitrate
  const getExportDimensions = () => {
    let width = 1280;
    let height = 720;
    let bitrate = 4_000_000;

    if (aspectRatio === '1:1') {
      if (quality === 'low') {
        width = 600;
        height = 600;
        bitrate = 1_500_000;
      } else if (quality === 'medium') {
        width = 800;
        height = 800;
        bitrate = 3_500_000;
      } else {
        width = 1080;
        height = 1080;
        bitrate = 7_000_000;
      }
    } else if (aspectRatio === '16:9') {
      if (quality === 'low') {
        width = 854;
        height = 480;
        bitrate = 1_500_000;
      } else if (quality === 'medium') {
        width = 1280;
        height = 720;
        bitrate = 4_000_000;
      } else {
        width = 1920;
        height = 1080;
        bitrate = 8_000_000;
      }
    } else if (aspectRatio === '9:16') {
      if (quality === 'low') {
        width = 480;
        height = 854;
        bitrate = 1_500_000;
      } else if (quality === 'medium') {
        width = 720;
        height = 1280;
        bitrate = 4_000_000;
      } else {
        width = 1080;
        height = 1920;
        bitrate = 8_000_000;
      }
    }

    return { width, height, bitrate };
  };

  const getPreviewAspectRatioClass = () => {
    if (aspectRatio === '1:1') return 'aspect-square max-h-[220px] max-w-[220px]';
    if (aspectRatio === '16:9') return 'aspect-video max-h-[200px] max-w-[320px]';
    return 'aspect-[9/16] h-[260px] max-w-[150px]';
  };

  // Main Export Router (WebCodecs -> fallbacks to MediaRecorder)
  const handleExport = async () => {
    if (!containerRef.current) return;

    setIsExporting(true);
    setProgress(0);
    setError(null);
    setIsFinished(false);
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }

    const { width, height, bitrate } = getExportDimensions();
    const totalFrames = duration * fps;

    // Check if WebCodecs is available and we are in a Secure Context
    const isWebCodecsSupported = typeof VideoEncoder !== 'undefined' && window.isSecureContext;

    if (isWebCodecsSupported) {
      try {
        console.log("Using WebCodecs (MP4) video generator...");
        await exportWithWebCodecs(width, height, bitrate, totalFrames);
      } catch (err: any) {
        console.warn("WebCodecs export failed. Falling back to MediaRecorder...", err);
        try {
          await exportWithMediaRecorder(width, height, totalFrames);
        } catch (fbErr: any) {
          console.error("All export engines failed:", fbErr);
          setError(fbErr.message || t('error'));
          setIsExporting(false);
        }
      }
    } else {
      try {
        console.log("WebCodecs unsupported/unsecure. Falling back to MediaRecorder (WebM)...");
        await exportWithMediaRecorder(width, height, totalFrames);
      } catch (err: any) {
        console.error("MediaRecorder export failed:", err);
        setError(err.message || t('error'));
        setIsExporting(false);
      }
    }
  };

  // ENGINE 1: WebCodecs + MP4 Muxer (Super high fidelity, exact timings)
  const exportWithWebCodecs = async (width: number, height: number, bitrate: number, totalFrames: number) => {
    const muxer = new Mp4Muxer.Muxer({
      target: new Mp4Muxer.ArrayBufferTarget(),
      video: {
        codec: 'avc',
        width,
        height,
      },
      fastStart: 'in-memory',
    });

    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => {
        throw new Error(e.message);
      },
    });

    videoEncoder.configure({
      codec: 'avc1.4d002a', // Main profile, Level 4.2
      width,
      height,
      bitrate,
      framerate: fps,
    });

    const element = containerRef.current!;
    
    // Warm up/ensure font caches are loaded
    await htmlToImage.toCanvas(element, { width, height, fontEmbedCSS: fontEmbedCSS || undefined });

    for (let i = 0; i < totalFrames; i++) {
      const tFactor = totalFrames > 1 ? i / (totalFrames - 1) : 0;
      
      // Update element font settings dynamically
      element.style.fontVariationSettings = getFVS(tFactor);
      if (textRef.current) {
        textRef.current.style.fontVariationSettings = getFVS(tFactor);
      }

      const canvas = await htmlToImage.toCanvas(element, {
        width,
        height,
        backgroundColor: bgColor,
        style: { transform: 'none', margin: '0' },
        fontEmbedCSS: fontEmbedCSS || undefined
      });

      const timestamp = (i * 1_000_000) / fps; // in microseconds
      const frame = new VideoFrame(canvas, { timestamp });

      videoEncoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();

      setProgress((i + 1) / totalFrames);
    }

    await videoEncoder.flush();
    muxer.finalize();

    const { buffer } = muxer.target;
    const blob = new Blob([buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    
    setVideoUrl(url);
    setVideoMimeType('video/mp4');
    setIsFinished(true);
    setIsExporting(false);
  };

  // ENGINE 2: MediaRecorder with Canvas Stream Fallback (Universally supported, works anywhere)
  const exportWithMediaRecorder = async (width: number, height: number, totalFrames: number) => {
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = width;
    captureCanvas.height = height;
    const ctx = captureCanvas.getContext('2d');
    if (!ctx) throw new Error("Could not initialize 2D canvas context");

    const stream = captureCanvas.captureStream(fps);
    
    // Select best supported MIME Type for video capture
    const mimeTypesToTry = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    let selectedMime = 'video/webm';
    for (const mime of mimeTypesToTry) {
      if (MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        break;
      }
    }

    const chunks: BlobPart[] = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMime });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    const recordPromise = new Promise<Blob>((resolve, reject) => {
      mediaRecorder.onstop = () => {
        resolve(new Blob(chunks, { type: selectedMime }));
      };
      mediaRecorder.onerror = (e) => reject(e);
    });

    mediaRecorder.start();

    const element = containerRef.current!;
    const frameDelay = Math.max(16, 1000 / fps);

    for (let i = 0; i < totalFrames; i++) {
      const tFactor = totalFrames > 1 ? i / (totalFrames - 1) : 0;
      
      // Update font settings
      element.style.fontVariationSettings = getFVS(tFactor);
      if (textRef.current) {
        textRef.current.style.fontVariationSettings = getFVS(tFactor);
      }

      const tempCanvas = await htmlToImage.toCanvas(element, {
        width,
        height,
        backgroundColor: bgColor,
        style: { transform: 'none', margin: '0' },
        fontEmbedCSS: fontEmbedCSS || undefined
      });

      // Render onto recorder canvas
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(tempCanvas, 0, 0);

      // Give MediaRecorder a moment to capture the frame properly
      await new Promise(resolve => setTimeout(resolve, frameDelay));
      setProgress((i + 1) / totalFrames);
    }

    mediaRecorder.stop();
    const finalBlob = await recordPromise;
    const url = URL.createObjectURL(finalBlob);

    setVideoUrl(url);
    setVideoMimeType(selectedMime);
    setIsFinished(true);
    setIsExporting(false);
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const isWebm = videoMimeType.includes('webm');
    const extension = isWebm ? 'webm' : 'mp4';
    
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `font-motion-${Date.now()}.${extension}`;
    a.click();
  };

  if (!isOpen) return null;

  const { width: exportWidth, height: exportHeight } = getExportDimensions();

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto" 
      style={{ direction: isAr ? 'rtl' : 'ltr', fontFamily: "'Thmanyah Sans', sans-serif" }}
    >
      <style dangerouslySetInnerHTML={{ __html: fontEmbedCSS }} />

      <div className="bg-[#0b0b0b] border border-white/10 rounded-2xl w-full max-w-5xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.15)] flex flex-col my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#111111]/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/50 border border-cyan-500/30">
              <Film className="text-cyan-400 w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-sans">{t('title')}</h2>
              <p className="text-[10px] text-white/50 mt-0.5">{t('subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Two-Column Responsive Content Area */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto max-h-[70vh]">
          {axes.length === 0 ? (
            <div className="col-span-12 text-center py-12 text-white/50 text-sm border border-dashed border-white/10 rounded-xl">
              {t('noAxes')}
            </div>
          ) : (
            <>
              {/* Left Column: Live Visual Preview and Aspect Ratio selectors */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                <h3 className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
                  <Sparkles size={12} />
                  {t('livePreview')}
                </h3>

                {/* Animated Preview Canvas Screen */}
                <div 
                  className="flex flex-col items-center justify-center bg-[#111] p-6 rounded-xl border border-white/5 w-full min-h-[300px] relative overflow-hidden"
                >
                  <div 
                    className={`w-full relative flex items-center justify-center overflow-hidden rounded-xl transition-all duration-300 border border-white/10 shadow-2xl ${getPreviewAspectRatioClass()}`}
                    style={{ backgroundColor: bgColor }}
                  >
                    <div
                      style={{
                        fontFamily: fontFamily ? `"${fontFamily}"` : 'inherit',
                        fontFeatureSettings: activeFeatures,
                        fontVariationSettings: getFVS(previewT),
                        fontSize: aspectRatio === '9:16' ? `${fontSize * 0.4}px` : `${fontSize * 0.55}px`,
                        lineHeight: lineHeight,
                        color: textColor,
                        textAlign: 'center',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        direction: 'rtl',
                        maxWidth: '90%',
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {text}
                    </div>
                  </div>

                  {/* Rendering Progress Indicator overlay */}
                  {isExporting && (
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
                      <Loader2 size={32} className="text-cyan-400 animate-spin mb-3" />
                      <span className="text-xs text-white/80 font-medium">{t('exporting')}</span>
                      <span className="text-xl text-cyan-400 font-bold font-mono mt-1">{Math.round(progress * 100)}%</span>
                      <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden mt-3 border border-white/10">
                        <div 
                          className="h-full bg-cyan-400 rounded-full transition-all duration-150" 
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Complete Action overlay */}
                  {isFinished && videoUrl && (
                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-10">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-3">
                        <Sparkles className="text-green-400 w-6 h-6 animate-pulse" />
                      </div>
                      <span className="text-sm font-bold text-white">{t('finished')}</span>
                      <button 
                        onClick={handleDownload}
                        className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold bg-green-500 hover:bg-green-400 text-black flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] active:scale-95"
                      >
                        <Download size={13} />
                        {t('downloadVideo')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Aspect Ratio Configuration */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">{t('aspectRatio')}</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '1:1', label: isAr ? '1:1 مربع' : '1:1 Square', desc: isAr ? 'شبكات التواصل' : 'Feed Post' },
                      { id: '16:9', label: isAr ? '16:9 أفقي' : '16:9 Widescreen', desc: isAr ? 'يوتيوب / عرض' : 'Landscape' },
                      { id: '9:16', label: isAr ? '9:16 ستوري' : '9:16 Portrait', desc: isAr ? 'تيك توك / قصص' : 'Stories/Reels' }
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          resetExport();
                          setAspectRatio(item.id as AspectRatioType);
                        }}
                        disabled={isExporting}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${aspectRatio === item.id ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300' : 'bg-[#121212] border-white/5 text-white/60 hover:border-white/10 hover:text-white'}`}
                      >
                        <span className="text-[11px] font-bold">{item.label}</span>
                        <span className="text-[9px] opacity-60 font-medium">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Setting parameters & Axes sliders */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* Section 1: Video Config (Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#111] p-4 rounded-xl border border-white/5">
                  {/* Duration */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">{t('duration')}</span>
                    <div className="flex items-center gap-2.5">
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={duration} 
                        onChange={(e) => handleDurationChange(Number(e.target.value))}
                        disabled={isExporting}
                        className="w-full accent-cyan-400 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-800/20 whitespace-nowrap">{duration}s</span>
                    </div>
                  </div>

                  {/* FPS Selection */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">{t('fps')}</span>
                    <select 
                      value={fps} 
                      onChange={(e) => handleFpsChange(Number(e.target.value))}
                      disabled={isExporting}
                      className="bg-[#151515] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50 font-sans"
                    >
                      <option value="24">24 FPS (Cinema)</option>
                      <option value="30">30 FPS (Standard)</option>
                      <option value="60">60 FPS (Ultra Smooth)</option>
                    </select>
                  </div>

                  {/* Quality Selector */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">{t('quality')}</span>
                    <select 
                      value={quality} 
                      onChange={(e) => handleQualityChange(e.target.value as QualityType)}
                      disabled={isExporting}
                      className="bg-[#151515] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50 font-sans"
                    >
                      <option value="low">{t('qualityLow')}</option>
                      <option value="medium">{t('qualityMedium')}</option>
                      <option value="high">{t('qualityHigh')}</option>
                    </select>
                  </div>
                </div>

                {/* Section 2: Axis Sliders */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
                    <Sparkles size={12} />
                    {isAr ? 'تخصيص حركة المحاور المتغيرة' : 'Configure Axis Motion'}
                  </h3>
                  
                  <div className="grid gap-3.5 bg-[#111] p-4 rounded-xl border border-white/5 max-h-[260px] overflow-y-auto">
                    {axes.map(axis => {
                      const cfg = axesConfig[axis.tag] || { start: axis.minValue, end: axis.maxValue, staticVal: axis.defaultValue, animated: false };
                      
                      return (
                        <div key={axis.tag} className="flex flex-col gap-2.5 p-3 bg-[#151515] border border-white/5 rounded-lg transition-all hover:border-white/10">
                          {/* Title & Animation Toggle */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white">{axis.name || axis.tag}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/40 text-cyan-300 font-mono">{axis.tag}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-white/60">{t('animateAxis')}</span>
                              <div 
                                onClick={() => {
                                  if (!isExporting) {
                                    updateAxisProp(axis.tag, 'animated', !cfg.animated);
                                  }
                                }}
                                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer flex items-center ${cfg.animated ? 'bg-cyan-400' : 'bg-white/15'}`}
                              >
                                <div className={`bg-black w-4 h-4 rounded-full shadow-md transition-all duration-200 ${cfg.animated ? (isAr ? 'translate-x-[-16px]' : 'translate-x-[16px]') : 'translate-x-0'}`} />
                              </div>
                            </div>
                          </div>

                          {/* Sliders Container */}
                          {cfg.animated ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1.5 border-t border-white/5">
                              {/* Start Slider */}
                              <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[9px]">
                                  <span className="text-white/50">{t('startVal')}</span>
                                  <span className="text-cyan-400 font-mono font-bold">{cfg.start.toFixed(1)}</span>
                                </div>
                                <input 
                                  type="range" 
                                  min={axis.minValue} 
                                  max={axis.maxValue} 
                                  step="0.1"
                                  value={cfg.start}
                                  onChange={(e) => updateAxisProp(axis.tag, 'start', Number(e.target.value))}
                                  disabled={isExporting}
                                  className="w-full accent-cyan-400 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>

                              {/* End Slider */}
                              <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[9px]">
                                  <span className="text-white/50">{t('endVal')}</span>
                                  <span className="text-cyan-400 font-mono font-bold">{cfg.end.toFixed(1)}</span>
                                </div>
                                <input 
                                  type="range" 
                                  min={axis.minValue} 
                                  max={axis.maxValue} 
                                  step="0.1"
                                  value={cfg.end}
                                  onChange={(e) => updateAxisProp(axis.tag, 'end', Number(e.target.value))}
                                  disabled={isExporting}
                                  className="w-full accent-cyan-400 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>
                            </div>
                          ) : (
                            /* Static Slider */
                            <div className="flex flex-col gap-1 pt-1.5 border-t border-white/5">
                              <div className="flex justify-between text-[9px]">
                                <span className="text-white/50">{t('staticVal')}</span>
                                <span className="text-white/90 font-mono">{cfg.staticVal.toFixed(1)}</span>
                              </div>
                              <input 
                                type="range" 
                                min={axis.minValue} 
                                max={axis.maxValue} 
                                step="0.1"
                                value={cfg.staticVal}
                                onChange={(e) => updateAxisProp(axis.tag, 'staticVal', Number(e.target.value))}
                                disabled={isExporting}
                                className="w-full accent-white/50 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Engine Description & Help */}
                <div className="text-[10px] text-white/60 leading-relaxed bg-[#111] px-4 py-3 rounded-lg border border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 font-sans">
                  <span>
                    💡 {isAr 
                      ? "يقوم النظام آلياً باختيار أفضل وأسرع محرك متوافق مع متصفحك للحصول على أعلى جودة تصدير." 
                      : "The system automatically selects the fastest high-quality engine compatible with your browser."}
                  </span>
                  <span className="text-[10px] font-sans font-bold text-cyan-400 shrink-0">
                    {typeof VideoEncoder !== 'undefined' && window.isSecureContext ? t('engineWebCodecs') : t('engineMediaRecorder')}
                  </span>
                </div>

                {/* Section 4: Progress, error alerts & main action buttons */}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-red-400 text-xs animate-shake font-sans">
                    <AlertCircle size={15} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Footer Modal Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-auto">
                  <button 
                    onClick={onClose}
                    disabled={isExporting}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 disabled:opacity-50 transition-all font-sans"
                  >
                    {t('cancel')}
                  </button>
                  
                  {isFinished && videoUrl ? (
                    <button 
                      onClick={handleDownload}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-green-500 hover:bg-green-400 text-black flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(34,197,94,0.35)] font-sans active:scale-95"
                    >
                      <Download size={14} />
                      {t('downloadVideo')}
                    </button>
                  ) : (
                    <button 
                      onClick={handleExport}
                      disabled={isExporting}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-black flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(34,211,238,0.35)] disabled:opacity-40 disabled:shadow-none font-sans active:scale-95"
                    >
                      {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                      {isExporting ? t('exporting') : t('generate')}
                    </button>
                  )}
                </div>

              </div>
            </>
          )}
        </div>
      </div>

      {/* Offscreen rendering container kept visible to browser rendering queue but clipped away from user viewport */}
      <div className="fixed top-[-9999px] left-[-9999px] pointer-events-none opacity-0 select-none overflow-hidden">
        <div 
          ref={containerRef}
          style={{
            width: `${exportWidth}px`,
            height: `${exportHeight}px`,
            backgroundColor: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: aspectRatio === '9:16' ? '120px 60px' : '60px',
            boxSizing: 'border-box'
          }}
        >
          <div
            ref={textRef}
            style={{
              fontFamily: fontFamily ? `"${fontFamily}"` : 'inherit',
              fontFeatureSettings: activeFeatures,
              fontVariationSettings: getFVS(0), // default to start
              fontSize: aspectRatio === '9:16' 
                ? (quality === 'low' ? `${fontSize * 0.5}px` : quality === 'high' ? `${fontSize * 1.1}px` : `${fontSize * 0.8}px`)
                : (quality === 'low' ? `${fontSize * 0.7}px` : quality === 'high' ? `${fontSize * 1.5}px` : `${fontSize}px`),
              lineHeight: lineHeight,
              color: textColor,
              textAlign: 'center',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              direction: 'rtl',
              maxWidth: '90%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}
