import { useState, useEffect, useRef } from 'react';
import { X, Play, Download, Loader2, AlertCircle, Sparkles, Film, Sliders } from 'lucide-react';
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

  // Clean font embed CSS without format constraint, allowing TTF, OTF, WOFF, WOFF2
  const fontEmbedCSS = fontBase64 ? `
    @font-face {
      font-family: '${fontFamily}';
      src: url('${fontBase64}');
      font-display: swap;
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

  // Redesigned perfect bilingual presentation translations
  const translations = {
    ar: {
      title: "تصدير حركة الخط المتغير (فيديو)",
      subtitle: "صمّم وحمّل فيديو احترافي للمحاور المتغيرة وهي تتمدد وتتحرك بسلاسة.",
      duration: "السرعة والمدة",
      fps: "سلاسة الإطارات",
      quality: "دقة وجودة الفيديو",
      qualityLow: "دقة عادية (480p) - خفيف وسريع",
      qualityMedium: "دقة عالية (720p) - متوازن ومناسب",
      qualityHigh: "دقة فائقة (1080p) - جودة سينمائية كاملة",
      startVal: "قيمة البداية",
      endVal: "قيمة النهاية",
      staticVal: "القيمة الثابتة",
      animateAxis: "تفعيل حركة المحور",
      generate: "تصدير وحفظ الفيديو",
      exporting: "جاري التقاط الإطارات ومعالجة الحركة...",
      finished: "تم تصدير الفيديو بنجاح!",
      downloadVideo: "تحميل الفيديو الآن",
      cancel: "إلغاء",
      noAxes: "هذا الخط لا يحتوي على محاور متغيرة لتحريكها.",
      error: "حدث خطأ أثناء تصدير الفيديو",
      engineWebCodecs: "محرك سريع فائق الجودة (MP4)",
      engineMediaRecorder: "محرك التوافقية العالية (WebM)",
      aspectRatio: "أبعاد الفيديو واقتصاص الإطار",
      livePreview: "المعاينة الحية للحركة المتغيرة",
      axisMotionHeader: "إعدادات حركة محاور الخط",
      secLabel: "ثواني"
    },
    en: {
      title: "Export Variable Font Animation",
      subtitle: "Design and download a smooth motion video of your variable axes animating.",
      duration: "Duration",
      fps: "Framerate",
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
      engineWebCodecs: "Ultra High Quality Engine (MP4)",
      engineMediaRecorder: "High Compatibility Engine (WebM)",
      aspectRatio: "Video Dimensions & Aspect Ratio",
      livePreview: "Live Variable Motion Preview",
      axisMotionHeader: "Configure Font Axis Animation",
      secLabel: "seconds"
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

  // Generate standardized, validated CSS font-feature-settings string
  const getFeaturesString = () => {
    if (Object.keys(openTypeFeatures).length === 0) return 'normal';
    const parts: string[] = [];
    Object.entries(openTypeFeatures).forEach(([tag, enabled]) => {
      if (enabled !== undefined && /^[A-Za-z0-9]{4}$/.test(tag)) {
        parts.push(`"${tag}" ${enabled ? 1 : 0}`);
      }
    });
    return parts.length > 0 ? parts.join(', ') : 'normal';
  };

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

  // Exact preview dimensions in UI
  const getPreviewDimensions = () => {
    if (aspectRatio === '1:1') return { width: 260, height: 260, className: 'w-[260px] h-[260px] aspect-square' };
    if (aspectRatio === '16:9') return { width: 320, height: 180, className: 'w-[320px] h-[180px] aspect-video' };
    return { width: 180, height: 320, className: 'w-[180px] h-[320px] aspect-[9/16]' };
  };

  const { width: previewWidth, className: previewClass } = getPreviewDimensions();

  // Scale fonts perfectly to prevent wrap mismatches between live preview and render canvas
  const previewFontSize = fontSize * (previewWidth / 800);

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
    
    // Warm up font cache
    await htmlToImage.toCanvas(element, { width, height, fontEmbedCSS: fontEmbedCSS || undefined, cacheBust: true });

    for (let i = 0; i < totalFrames; i++) {
      const tFactor = totalFrames > 1 ? i / (totalFrames - 1) : 0;
      const fvsString = getFVS(tFactor);
      
      // Update element and child font settings dynamically using robust setProperty
      element.style.setProperty('font-variation-settings', fvsString);
      if (textRef.current) {
        textRef.current.style.setProperty('font-variation-settings', fvsString);
      }

      // Force layout calculation/reflow to guarantee style recalculations before paint
      element.offsetHeight;
      if (textRef.current) textRef.current.offsetHeight;

      // Wait a rendering tick to let browser engine execute repaint
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => setTimeout(resolve, 20));

      const canvas = await htmlToImage.toCanvas(element, {
        width,
        height,
        backgroundColor: bgColor,
        style: { transform: 'none', margin: '0' },
        fontEmbedCSS: fontEmbedCSS || undefined,
        cacheBust: true // Force fresh snapshot rendering bypass cache
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
      const fvsString = getFVS(tFactor);
      
      // Update font settings dynamically with robust property setter
      element.style.setProperty('font-variation-settings', fvsString);
      if (textRef.current) {
        textRef.current.style.setProperty('font-variation-settings', fvsString);
      }

      // Force synchronous reflow layout cycle
      element.offsetHeight;
      if (textRef.current) textRef.current.offsetHeight;

      // Allow browser engine layout tick 
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => setTimeout(resolve, 20));

      const tempCanvas = await htmlToImage.toCanvas(element, {
        width,
        height,
        backgroundColor: bgColor,
        style: { transform: 'none', margin: '0' },
        fontEmbedCSS: fontEmbedCSS || undefined,
        cacheBust: true
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
  const scaledFontSize = fontSize * (exportWidth / 800);

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg overflow-y-auto" 
      style={{ direction: isAr ? 'rtl' : 'ltr', fontFamily: "'Thmanyah Sans', sans-serif" }}
    >
      <style dangerouslySetInnerHTML={{ __html: fontEmbedCSS }} />

      <div className="bg-[#0c0c0e] border border-white/10 rounded-3xl w-full max-w-5xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.15)] flex flex-col my-8">
        
        {/* Simplified Modern Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#111115]/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
              <Film className="text-cyan-400 w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>{t('title')}</h2>
              <p className="text-[10px] text-white/40 mt-1" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>{t('subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Highly Simplified Content Grid */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {axes.length === 0 ? (
            <div className="col-span-12 text-center py-12 text-white/50 text-sm border border-dashed border-white/10 rounded-xl" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>
              {t('noAxes')}
            </div>
          ) : (
            <>
              {/* Left Column: Live Visual Preview and Aspect Ratio selectors */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>
                    <Sparkles size={12} />
                    {t('livePreview')}
                  </h3>
                </div>

                {/* Animated Preview Canvas Screen matching Customize & Zoom perfectly */}
                <div 
                  className="flex flex-col items-center justify-center bg-[#070709] p-8 rounded-2xl border border-white/5 w-full min-h-[340px] relative overflow-hidden"
                >
                  <div 
                    className={`relative flex items-center justify-center overflow-hidden rounded-2xl transition-all duration-300 border border-white/10 shadow-2xl ${previewClass}`}
                    style={{ backgroundColor: bgColor }}
                  >
                    <div
                      style={{
                        fontFamily: fontFamily ? `"${fontFamily}"` : 'inherit',
                        fontFeatureSettings: getFeaturesString(),
                        fontVariationSettings: getFVS(previewT),
                        fontSize: `${previewFontSize}px`,
                        lineHeight: lineHeight === '' ? 1.4 : lineHeight,
                        color: textColor,
                        textAlign: 'center',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        direction: 'rtl',
                        maxWidth: '90%',
                        padding: '16px',
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
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
                      <Loader2 size={36} className="text-cyan-400 animate-spin mb-4" />
                      <span className="text-xs text-white/80 font-medium" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>{t('exporting')}</span>
                      <span className="text-2xl text-cyan-400 font-bold font-mono mt-1">{Math.round(progress * 100)}%</span>
                      <div className="w-52 h-1.5 bg-white/5 rounded-full overflow-hidden mt-4 border border-white/10">
                        <div 
                          className="h-full bg-cyan-400 rounded-full transition-all duration-150" 
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Complete Action overlay */}
                  {isFinished && videoUrl && (
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
                      <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-4">
                        <Sparkles className="text-green-400 w-7 h-7 animate-pulse" />
                      </div>
                      <span className="text-sm font-bold text-white" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>{t('finished')}</span>
                      <button 
                        onClick={handleDownload}
                        className="mt-5 px-6 py-3 rounded-xl text-xs font-bold bg-green-500 hover:bg-green-400 text-black flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] active:scale-95 cursor-pointer"
                        style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}
                      >
                        <Download size={14} />
                        {t('downloadVideo')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Aspect Ratio Configuration */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>{t('aspectRatio')}</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '1:1', label: isAr ? '1:1 مربع' : '1:1 Square', desc: isAr ? 'منشور تغذية' : 'Feed Post' },
                      { id: '16:9', label: isAr ? '16:9 شاشة' : '16:9 Widescreen', desc: isAr ? 'يوتيوب / عرض' : 'Landscape' },
                      { id: '9:16', label: isAr ? '9:16 طولي' : '9:16 Portrait', desc: isAr ? 'قصص / تيك توك' : 'Stories/Reels' }
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          resetExport();
                          setAspectRatio(item.id as AspectRatioType);
                        }}
                        disabled={isExporting}
                        className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${aspectRatio === item.id ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'bg-[#121216] border-white/5 text-white/50 hover:border-white/10 hover:text-white'}`}
                      >
                        <span className="text-[11px] font-bold" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>{item.label}</span>
                        <span className="text-[9px] opacity-50 font-medium" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Setting parameters & Axes sliders */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* Simplified Parameter Configuration Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#111115]/80 p-4 rounded-2xl border border-white/5">
                  {/* Duration */}
                  <div className="flex flex-col gap-2 p-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>{t('duration')}</span>
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
                      <span className="text-[11px] font-mono text-cyan-400 font-bold bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-800/20 whitespace-nowrap">{duration} {isAr ? t('secLabel') : 's'}</span>
                    </div>
                  </div>

                  {/* FPS Selection */}
                  <div className="flex flex-col gap-2 p-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>{t('fps')}</span>
                    <select 
                      value={fps} 
                      onChange={(e) => handleFpsChange(Number(e.target.value))}
                      disabled={isExporting}
                      className="bg-[#15151b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                      style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}
                    >
                      <option value="24" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>24 FPS</option>
                      <option value="30" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>30 FPS</option>
                      <option value="60" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>60 FPS</option>
                    </select>
                  </div>

                  {/* Quality Selector */}
                  <div className="flex flex-col gap-2 p-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>{t('quality')}</span>
                    <select 
                      value={quality} 
                      onChange={(e) => handleQualityChange(e.target.value as QualityType)}
                      disabled={isExporting}
                      className="bg-[#15151b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                      style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}
                    >
                      <option value="low" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>{t('qualityLow')}</option>
                      <option value="medium" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>{t('qualityMedium')}</option>
                      <option value="high" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>{t('qualityHigh')}</option>
                    </select>
                  </div>
                </div>

                {/* Section 2: Axis Sliders */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>
                    <Sliders size={12} />
                    {t('axisMotionHeader')}
                  </h3>
                  
                  <div className="grid gap-3.5 bg-[#111115]/80 p-4 rounded-2xl border border-white/5 max-h-[280px] overflow-y-auto custom-scrollbar">
                    {axes.map(axis => {
                      const cfg = axesConfig[axis.tag] || { start: axis.minValue, end: axis.maxValue, staticVal: axis.defaultValue, animated: false };
                      
                      return (
                        <div key={axis.tag} className="flex flex-col gap-3 p-3.5 bg-[#14141a]/60 border border-white/5 rounded-xl transition-all hover:border-white/10">
                          {/* Title & Animation Toggle */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>{axis.name || axis.tag}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/40 text-cyan-300 font-mono font-bold">{axis.tag}</span>
                            </div>
                            
                            <div className="flex items-center gap-2.5">
                              <span className="text-[10px] text-white/50" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>{t('animateAxis')}</span>
                              <div 
                                onClick={() => {
                                  if (!isExporting) {
                                    updateAxisProp(axis.tag, 'animated', !cfg.animated);
                                  }
                                }}
                                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer flex items-center ${cfg.animated ? 'bg-cyan-400' : 'bg-white/10'}`}
                              >
                                <div className={`bg-black w-4 h-4 rounded-full shadow-md transition-all duration-200 ${cfg.animated ? (isAr ? 'translate-x-[-16px]' : 'translate-x-[16px]') : 'translate-x-0'}`} />
                              </div>
                            </div>
                          </div>

                          {/* Simplified Sliders */}
                          {cfg.animated ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                              {/* Start Slider */}
                              <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between text-[9px]">
                                  <span className="text-white/40" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>{t('startVal')}</span>
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
                              <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between text-[9px]">
                                  <span className="text-white/40" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>{t('endVal')}</span>
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
                            <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
                              <div className="flex justify-between text-[9px]">
                                <span className="text-white/40" style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>{t('staticVal')}</span>
                                <span className="text-white/80 font-mono font-bold">{cfg.staticVal.toFixed(1)}</span>
                              </div>
                              <input 
                                type="range" 
                                min={axis.minValue} 
                                max={axis.maxValue} 
                                step="0.1"
                                value={cfg.staticVal}
                                onChange={(e) => updateAxisProp(axis.tag, 'staticVal', Number(e.target.value))}
                                disabled={isExporting}
                                className="w-full accent-white/40 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Redesigned Thmanyah-explicit Help Banner */}
                <div 
                  className="text-[10px] text-white/50 leading-relaxed bg-[#111115]/50 px-4 py-3.5 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}
                >
                  <span style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>
                    💡 {isAr 
                      ? "يقوم النظام آلياً باختيار أفضل وأسرع محرك متوافق مع متصفحك للحصول على أعلى جودة تصدير." 
                      : "The system automatically selects the fastest high-quality engine compatible with your browser."}
                  </span>
                  <span 
                    className="text-[10px] font-bold text-cyan-400 shrink-0 bg-cyan-950/30 border border-cyan-800/30 px-2.5 py-0.5 rounded-lg"
                    style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}
                  >
                    {typeof VideoEncoder !== 'undefined' && window.isSecureContext ? t('engineWebCodecs') : t('engineMediaRecorder')}
                  </span>
                </div>

                {/* Section 4: Progress, error alerts & main action buttons */}
                {error && (
                  <div 
                    className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-red-400 text-xs animate-shake"
                    style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}
                  >
                    <AlertCircle size={15} />
                    <span style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}>{error}</span>
                  </div>
                )}

                {/* Footer Modal Actions */}
                <div className="flex justify-end gap-3 pt-5 border-t border-white/5 mt-auto">
                  <button 
                    onClick={onClose}
                    disabled={isExporting}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-50 transition-all cursor-pointer"
                    style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}
                  >
                    {t('cancel')}
                  </button>
                  
                  {isFinished && videoUrl ? (
                    <button 
                      onClick={handleDownload}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-green-500 hover:bg-green-400 text-black flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(34,197,94,0.35)] active:scale-95 cursor-pointer"
                      style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}
                    >
                      <Download size={14} />
                      {t('downloadVideo')}
                    </button>
                  ) : (
                    <button 
                      onClick={handleExport}
                      disabled={isExporting}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-black flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(34,211,238,0.35)] disabled:opacity-40 disabled:shadow-none active:scale-95 cursor-pointer"
                      style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}
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

      {/* Offscreen rendering container for perfect matching with Customize & Zoom */}
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
              fontFeatureSettings: getFeaturesString(),
              fontVariationSettings: getFVS(0), // default to start
              fontSize: `${scaledFontSize}px`,
              lineHeight: lineHeight === '' ? 1.4 : lineHeight,
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
