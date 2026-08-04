import React, { useRef, useEffect } from 'react';
import { 
  Printer, 
  ArrowLeft, 
  ExternalLink, 
  Database, 
  Cpu, 
  Layers, 
  FileText, 
  Bell,
  Sparkles,
  Check,
  Server,
  Terminal
} from 'lucide-react';
import { Logo } from '../components/Logo';

// High-fidelity, infinitely scalable vector database schema diagram matching the user's Supabase screenshot
const SupabaseSchemaDiagram: React.FC = () => {
  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent avoid-break">
      <div 
        className="relative w-[800px] h-[640px] bg-[#0A0A0C] border border-white/[0.08] rounded-2xl mx-auto overflow-hidden shadow-2xl select-none print-border print-bg-dark" 
        style={{ 
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', 
          backgroundSize: '16px 16px' 
        }}
      >
        
        {/* SVG Connections Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <marker id="dot-cyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6">
              <circle cx="5" cy="5" r="3" fill="#06B6D4" />
            </marker>
            <marker id="dot-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6">
              <circle cx="5" cy="5" r="3" fill="#3B82F6" />
            </marker>
            <marker id="dot-emerald" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6">
              <circle cx="5" cy="5" r="3" fill="#10B981" />
            </marker>
            <marker id="dot-amber" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6">
              <circle cx="5" cy="5" r="3" fill="#F59E0B" />
            </marker>
          </defs>

          {/* Lines from auth.users to user_id in other tables */}
          <path d="M 400 70 L 400 110 L 340 110 L 340 140 L 220 140" fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeOpacity="0.5" markerEnd="url(#dot-cyan)" />
          <path d="M 400 70 L 400 110 L 340 110 L 340 340 L 220 340" fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeOpacity="0.5" markerEnd="url(#dot-cyan)" />
          <path d="M 400 70 L 400 110 L 460 110 L 460 210 L 580 210" fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeOpacity="0.5" markerEnd="url(#dot-cyan)" />
          <path d="M 400 70 L 400 530 L 280 530" fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeOpacity="0.5" markerEnd="url(#dot-cyan)" />

          {/* Line from groups.id to fonts.group_id */}
          <path d="M 580 185 L 540 185 L 540 555 L 520 555" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeOpacity="0.5" markerEnd="url(#dot-blue)" />

          {/* Line from font_assets.id to fonts.asset_id */}
          <path d="M 580 405 L 550 405 L 550 580 L 520 580" fill="none" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.5" markerEnd="url(#dot-emerald)" />

          {/* Lines from fonts.id to font_weights.parent_font_id & child_font_id */}
          <path d="M 280 505 L 250 505 L 250 365 L 220 365" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity="0.5" markerEnd="url(#dot-amber)" />
          <path d="M 280 505 L 250 505 L 250 390 L 220 390" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity="0.5" markerEnd="url(#dot-amber)" />
        </svg>

        {/* Table Cards */}
        
        {/* Table 1: auth.users */}
        <div className="absolute bg-[#141416] border border-white/[0.08] rounded-xl overflow-hidden shadow-lg z-20 transition-all hover:border-[#06B6D4]/30 print-bg-card print-border" style={{ top: '20px', left: '320px', width: '160px' }}>
          <div className="bg-[#1D1D22] px-3 py-1.5 border-b border-white/[0.06] flex items-center gap-1.5 text-[10px] font-bold text-gray-300 uppercase tracking-wider font-display print-bg-alt print-border">
            <svg className="w-3.5 h-3.5 text-[#06B6D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            <span>auth.users</span>
          </div>
          <div className="p-2 space-y-1 text-[11px] font-mono">
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5">
              <span className="text-white flex items-center gap-1">🔑 id</span>
              <span className="text-gray-500 text-[10px]">uuid</span>
            </div>
          </div>
        </div>

        {/* Table 2: notifications */}
        <div className="absolute bg-[#121214] border border-white/[0.08] rounded-xl overflow-hidden shadow-lg z-20 transition-all hover:border-white/15 print-bg-card print-border" style={{ top: '90px', left: '20px', width: '200px' }}>
          <div className="bg-[#18181C] px-3 py-2 border-b border-white/[0.06] flex items-center justify-between text-xs font-bold text-gray-200 font-display print-bg-alt print-border">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
              <span>notifications</span>
            </div>
            <span className="text-[10px] text-gray-500 font-normal">Table</span>
          </div>
          <div className="p-2 space-y-1 text-[11px] font-mono">
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-amber-400">
              <span className="flex items-center gap-1">🔑 id</span>
              <span className="text-[10px] opacity-70">uuid</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-[#06B6D4]">
              <span className="flex items-center gap-1">🔗 user_id</span>
              <span className="text-[10px] opacity-70">uuid</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-gray-300">
              <span>type</span>
              <span className="text-gray-500 text-[10px]">text</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-gray-300">
              <span>slides</span>
              <span className="text-gray-500 text-[10px]">jsonb</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-gray-300">
              <span>created_at</span>
              <span className="text-gray-500 text-[10px]">timestamptz</span>
            </div>
          </div>
        </div>

        {/* Table 3: groups */}
        <div className="absolute bg-[#121214] border border-white/[0.08] rounded-xl overflow-hidden shadow-lg z-20 transition-all hover:border-white/15 print-bg-card print-border" style={{ top: '160px', left: '580px', width: '200px' }}>
          <div className="bg-[#18181C] px-3 py-2 border-b border-white/[0.06] flex items-center justify-between text-xs font-bold text-gray-200 font-display print-bg-alt print-border">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z"/></svg>
              <span>groups</span>
            </div>
            <span className="text-[10px] text-gray-500 font-normal">Table</span>
          </div>
          <div className="p-2 space-y-1 text-[11px] font-mono">
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-blue-400">
              <span className="flex items-center gap-1">🔑 id</span>
              <span className="text-[10px] opacity-70">uuid</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-[#06B6D4]">
              <span className="flex items-center gap-1">🔗 user_id</span>
              <span className="text-[10px] opacity-70">uuid</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-gray-300">
              <span>name</span>
              <span className="text-gray-500 text-[10px]">text</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-gray-300">
              <span>description</span>
              <span className="text-gray-500 text-[10px]">text</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-gray-300">
              <span>created_at</span>
              <span className="text-gray-500 text-[10px]">timestamptz</span>
            </div>
          </div>
        </div>

        {/* Table 4: font_weights */}
        <div className="absolute bg-[#121214] border border-white/[0.08] rounded-xl overflow-hidden shadow-lg z-20 transition-all hover:border-white/15 print-bg-card print-border" style={{ top: '290px', left: '20px', width: '200px' }}>
          <div className="bg-[#18181C] px-3 py-2 border-b border-white/[0.06] flex items-center justify-between text-xs font-bold text-gray-200 font-display print-bg-alt print-border">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              <span>font_weights</span>
            </div>
            <span className="text-[10px] text-gray-500 font-normal">Table</span>
          </div>
          <div className="p-2 space-y-1 text-[11px] font-mono">
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-gray-300">
              <span className="flex items-center gap-1">🔑 id</span>
              <span className="text-gray-500 text-[10px]">uuid</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-[#06B6D4]">
              <span className="flex items-center gap-1">🔗 user_id</span>
              <span className="text-[10px] opacity-70">uuid</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-amber-500">
              <span className="flex items-center gap-1">🔗 parent_font_id</span>
              <span className="text-[10px] opacity-70">uuid</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-amber-500">
              <span className="flex items-center gap-1">🔗 child_font_id</span>
              <span className="text-[10px] opacity-70">uuid</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-gray-300">
              <span>created_at</span>
              <span className="text-gray-500 text-[10px]">timestamptz</span>
            </div>
          </div>
        </div>

        {/* Table 5: font_assets */}
        <div className="absolute bg-[#121214] border border-white/[0.08] rounded-xl overflow-hidden shadow-lg z-20 transition-all hover:border-white/15 print-bg-card print-border" style={{ top: '380px', left: '580px', width: '200px' }}>
          <div className="bg-[#18181C] px-3 py-2 border-b border-white/[0.06] flex items-center justify-between text-xs font-bold text-gray-200 font-display print-bg-alt print-border">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 114 0v2m-4 0h4m-4 3h8m-8 0a2 2 0 012-2h4a2 2 0 012 2m-8 0v3h8v-3m-8 0h8"/></svg>
              <span>font_assets</span>
            </div>
            <span className="text-[10px] text-gray-500 font-normal">Table</span>
          </div>
          <div className="p-2 space-y-1 text-[11px] font-mono">
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-emerald-400">
              <span className="flex items-center gap-1">🔑 id</span>
              <span className="text-[10px] opacity-70">uuid</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-gray-300">
              <span>hash</span>
              <span className="text-gray-500 text-[10px]">text</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-gray-300">
              <span>storage_path</span>
              <span className="text-gray-500 text-[10px]">text</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-gray-300">
              <span>download_url</span>
              <span className="text-gray-500 text-[10px]">text</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-gray-300">
              <span>size</span>
              <span className="text-gray-500 text-[10px]">int8</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-gray-300">
              <span>created_at</span>
              <span className="text-gray-500 text-[10px]">timestamptz</span>
            </div>
          </div>
        </div>

        {/* Table 6: fonts */}
        <div className="absolute bg-[#121214] border border-white/[0.08] rounded-xl overflow-hidden shadow-lg z-20 transition-all hover:border-white/15 print-bg-card print-border" style={{ top: '480px', left: '280px', width: '240px' }}>
          <div className="bg-[#18181C] px-3 py-2 border-b border-white/[0.06] flex items-center justify-between text-xs font-bold text-gray-200 font-display print-bg-alt print-border">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 114 0v2m-4 0h4m-4 3h8m-8 0a2 2 0 012-2h4a2 2 0 012 2m-8 0v3h8v-3m-8 0h8"/></svg>
              <span>fonts</span>
            </div>
            <span className="text-[10px] text-gray-500 font-normal">Table</span>
          </div>
          <div className="p-2 space-y-1 text-[11px] font-mono">
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-amber-500">
              <span className="flex items-center gap-1">🔑 id</span>
              <span className="text-[10px] opacity-70">uuid</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-[#06B6D4]">
              <span className="flex items-center gap-1">🔗 user_id</span>
              <span className="text-[10px] opacity-70">uuid</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-blue-400">
              <span className="flex items-center gap-1">🔗 group_id</span>
              <span className="text-[10px] opacity-70">uuid</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-emerald-400">
              <span className="flex items-center gap-1">🔗 asset_id</span>
              <span className="text-[10px] opacity-70">uuid</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-gray-300">
              <span>name</span>
              <span className="text-gray-500 text-[10px]">text</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-gray-300">
              <span>metadata</span>
              <span className="text-gray-500 text-[10px]">jsonb</span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-white/5 text-gray-300">
              <span>created_at</span>
              <span className="text-gray-500 text-[10px]">timestamptz</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export const Arbeitsprobe: React.FC = () => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Auto-trigger print if ?print=true parameter is present in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('print') === 'true') {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handlePrint = () => {
    const isIframe = window.self !== window.top;
    if (isIframe) {
      // If we are inside the iframe sandbox, open a clean tab with ?print=true parameter to print automatically
      const cleanUrl = window.location.origin + window.location.pathname + '?print=true';
      window.open(cleanUrl, '_blank');
    } else {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F4F6] font-sans antialiased selection:bg-cyan-500/30 pb-20 print:bg-[#080808] print:text-[#F3F4F6]">
      
      {/* Dynamic CSS Overrides to preserve Fontat Identity in Print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Force exact dark black background and light text in output PDF */
          body, html, #document-wrapper {
            background-color: #080808 !important;
            color: #F3F4F6 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: 'Thmanyah Sans', ui-sans-serif, system-ui, sans-serif !important;
          }

          h1, h2, h3, h4, h5, h6, .font-display {
            font-family: 'Kufam', ui-sans-serif, system-ui, sans-serif !important;
          }
          
          /* Prevent page-break-inside on essential cards */
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Page break class */
          .page-break {
            page-break-before: always !important;
            break-before: page !important;
          }

          /* Enforce exact dark backgrounds & borders for elements */
          .print-bg-dark {
            background-color: #080808 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-bg-card {
            background-color: #121214 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-bg-alt {
            background-color: #18181C !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-border {
            border-color: rgba(255, 255, 255, 0.08) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-text-cyan {
            color: #06B6D4 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-text-white {
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-text-muted {
            color: #9CA3AF !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Sharper text and icon rendering at high DPI export */
          * {
            -webkit-font-smoothing: antialiased !important;
            text-rendering: optimizeLegibility !important;
            image-rendering: -webkit-optimize-contrast !important;
          }

          svg {
            shape-rendering: geometricPrecision !important;
          }

          /* Hide browser defaults */
          @page {
            size: A4;
            margin: 1.6cm 1.4cm;
          }
        }
      `}} />

      {/* Top Action Bar - Hidden on Print */}
      <div className="bg-[#080808]/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <a 
            href="/"
            className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-all bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Zurück zur Website</span>
          </a>
          <span className="text-white/20">|</span>
          <span className="text-xs text-[#06B6D4] font-semibold tracking-wide font-display">Bewerbungsunterlage / Arbeitsprobe</span>
        </div>

        {/* Action Button */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-[0_4px_15px_rgba(6,182,212,0.3)] hover:shadow-[0_6px_20px_rgba(6,182,212,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98] font-display"
        >
          <Printer className="w-4 h-4" />
          <span>Als PDF drucken / speichern</span>
        </button>
      </div>

      {/* Frame / Sandbox Warning Notice - Hidden on Print */}
      <div className="max-w-[850px] mx-auto mt-6 px-4 print:hidden">
        <div className="bg-[#121215] border border-white/10 rounded-2xl p-4 flex gap-3 items-start shadow-lg">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs text-gray-300 leading-relaxed font-sans">
            <span className="font-bold text-white block mb-1 font-display">Tipp für den perfekten Export:</span>
            Klicken Sie oben auf <span className="text-cyan-400 font-semibold font-display">"Als PDF drucken / speichern"</span>. Die Anwendung öffnet automatisch einen unbeschränkten neuen Tab, um die PDF-Datei in erstklassiger Druckqualität mit der vollen dunklen Fontat-Aussagekraft zu generieren.
          </div>
        </div>
      </div>

      {/* Document Container */}
      <div 
        ref={printAreaRef}
        id="document-wrapper"
        className="max-w-[850px] mx-auto my-8 bg-[#0C0C0E] rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden border border-white/[0.08] print:my-0 print:border-none print:shadow-none print:bg-[#080808] print:rounded-none"
      >
        
        {/* Table Structure wraps Content to repeat Header on every printed page */}
        <table className="w-full table-fixed border-collapse">
          
          {/* repeated header segment on each printed sheet */}
          <thead>
            <tr>
              <td className="p-0 border-none">
                <header className="bg-[#080808] h-20 px-8 flex items-center justify-between border-b border-white/10 print-bg-dark print-border">
                  {/* Authentic FONTAT English Logo using the real Logo component */}
                  <div className="flex items-center justify-start">
                    <div className="w-[125px] h-fit flex items-center justify-center text-white print-text-white">
                      <Logo className="w-full h-auto text-white" id="arbeitsprobe-header-logo" />
                    </div>
                  </div>

                  {/* Authentic Notifications/Bell Button on the Right */}
                  <div className="flex items-center justify-end">
                    <div className="relative w-10 h-10 rounded-full border border-white/20 bg-[#080808] flex items-center justify-center text-white shadow-sm print-border print-bg-dark print-text-white">
                      <Bell className="w-4 h-4 stroke-[1.5]" />
                      <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-[#06B6D4] rounded-full print-text-cyan"></span>
                    </div>
                  </div>
                </header>
              </td>
            </tr>
          </thead>

          {/* main contents containing page-splitting body blocks */}
          <tbody>
            <tr>
              <td className="p-0 border-none">
                
                <div className="p-10 sm:p-14 space-y-12">
                  
                  {/* Document Title Block */}
                  <div className="border-b border-white/[0.08] pb-8 print-border">
                    <div className="text-cyan-400 text-xs font-bold tracking-[0.2em] uppercase mb-2.5 print-text-cyan font-display">
                      ARBEITSPROBE / SOFTWARE ENTWICKLUNG
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4 print-text-white font-display">
                      Fontat – Technische Projektdokumentation
                    </h1>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/50 print-text-muted font-mono">
                      <span>Rolle: Projektplanung & Datenbankarchitektur</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Typ: Cloud-Plattform</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Sprache: Deutsch</span>
                    </div>
                  </div>

                  {/* Section 1: Project Overview */}
                  <section className="space-y-4 avoid-break">
                    <div className="flex items-center gap-3 text-white border-b border-white/[0.08] pb-2.5 print-border print-text-white leading-none">
                      <div className="p-1.5 rounded-lg bg-white/5 text-white print-bg-card flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h2 className="text-lg font-bold tracking-tight font-display">1. Projektübersicht & Vision</h2>
                    </div>
                    <div className="text-gray-300 text-sm leading-relaxed space-y-4 print-text-muted font-sans">
                      <p>
                        <strong>Fontat</strong> ist ein modernes, cloudbasiertes System zur interaktiven Verwaltung, Live-Visualisierung und zum Testen von Schriftarten. Die Plattform wurde entwickelt, um Webdesignern und Entwicklern ein nahtloses typografisches Labor direkt im Browser bereitzustellen.
                      </p>
                      <p>
                        Mit dem integrierten <strong>"Typografie-Labor" (Lab)</strong> können Anwender geladene Schriften direkt manipulieren, Glyphen extrahieren und Textmetriken vergleichen. Das System glänzt mit nativer, reibungsloser Unterstützung von <strong>RTL-Schriften (Right-to-Left, z.B. Arabisch)</strong> gekoppelt mit LTR-Schriften in Echtzeit.
                      </p>
                    </div>
                  </section>

                  {/* Section 2: Technology Stack */}
                  <section className="space-y-4 avoid-break">
                    <div className="flex items-center gap-3 text-white border-b border-white/[0.08] pb-2.5 print-border print-text-white leading-none">
                      <div className="p-1.5 rounded-lg bg-white/5 text-white print-bg-card flex items-center justify-center shrink-0">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <h2 className="text-lg font-bold tracking-tight font-display">2. Technologie-Stack & Architektur</h2>
                    </div>
                    
                    <p className="text-xs text-gray-400 print-text-muted leading-relaxed max-w-2xl font-sans">
                      Das System setzt auf hochperformante Webtechnologien mit einer klaren Trennung von Client und serverseitigen Services.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="bg-[#141416]/50 p-5 rounded-2xl border border-white/[0.06] print-bg-card print-border">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1 rounded bg-cyan-500/10 text-cyan-400 print-text-cyan">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <h3 className="text-sm font-bold text-white print-text-white font-display">Frontend-Architektur</h3>
                        </div>
                        <ul className="text-xs text-gray-400 space-y-2 list-none print-text-muted font-sans">
                          <li><strong>React (v18+) & TypeScript:</strong> Typensichere Logik, schnelles Rendering und stabiles State-Management.</li>
                          <li><strong>Tailwind CSS:</strong> Schnelle, responsive UI-Stile basierend auf der einheitlichen, dunklen Fontat-Markenidentität.</li>
                          <li><strong>Framer Motion:</strong> Flüssige Benubzeroberfläche dank nativer Hardware-beschleunigter Mikro-Animationen.</li>
                        </ul>
                      </div>

                      <div className="bg-[#141416]/50 p-5 rounded-2xl border border-white/[0.06] print-bg-card print-border">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1 rounded bg-blue-500/10 text-blue-400">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <h3 className="text-sm font-bold text-white print-text-white font-display">Backend & Cloud-Infrastruktur</h3>
                        </div>
                        <ul className="text-xs text-gray-400 space-y-2 list-none print-text-muted font-sans">
                          <li><strong>Supabase (PostgreSQL):</strong> Relationale, cloud-gestützte Echtzeitdatenbank für reibungslose Datensynchronisation.</li>
                          <li><strong>Row-Level Security (RLS):</strong> Datenintegrität und absolute Isolation der Benutzerdaten direkt im DB-Layer.</li>
                          <li><strong>Cloud-Storage Buckets:</strong> Cloud-Speicher für hochgeladene Schriftdateien mit SHA-256 Validierung.</li>
                        </ul>
                      </div>

                    </div>
                  </section>

                  {/* Hard page break only on printed PDF for professional pagination spacing */}
                  <div className="page-break" />

                  {/* Section 3: Professional Contributions */}
                  <section className="space-y-4 avoid-break">
                    <div className="flex items-center gap-3 text-white border-b border-white/[0.08] pb-2.5 print-border print-text-white leading-none">
                      <div className="p-1.5 rounded-lg bg-white/5 text-white print-bg-card flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <h2 className="text-lg font-bold tracking-tight font-display">3. Meine Kernaufgaben & Implementierungen</h2>
                    </div>
                    
                    <div className="text-gray-300 text-sm leading-relaxed space-y-5 print-text-muted font-sans">
                      <p>
                        Als Projektverantwortlicher habe ich die Architektur konzipiert, die Datenbankstruktur eigenständig aufgebaut und die Umsetzung der Anwendungslogik in Zusammenarbeit mit KI-gestützten Entwicklungswerkzeugen gesteuert. Wichtige technische Highlights sind:
                      </p>
                      
                      <div className="space-y-4 font-sans">
                        
                        <div className="flex items-start gap-3 bg-[#141416]/30 p-4 rounded-xl border border-white/[0.04] print-bg-card print-border">
                          <div className="p-1 rounded bg-cyan-500/10 text-cyan-400 mt-0.5 shrink-0 print-text-cyan">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <strong className="text-white text-xs block mb-1 print-text-white font-display">
                              Intelligente Duplikatsprüfung im Client (SHA-256):
                            </strong>
                            <p className="text-xs text-gray-400 leading-relaxed print-text-muted">
                              Entwicklung eines clientseitigen Krypto-Hashes. Vor dem Upload berechnet die Web-App den SHA-256-Hashwert der Schriftdatei. Die RPC-Funktion <code className="bg-white/5 text-cyan-300 px-1 py-0.5 rounded text-[10px] font-mono print-text-cyan">prepare_font_upload</code> prüft die Existenz des Hashes. Falls existent, entfällt der Upload komplett, was Bandbreite und Cloud-Speicher schont.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 bg-[#141416]/30 p-4 rounded-xl border border-white/[0.04] print-bg-card print-border">
                          <div className="p-1 rounded bg-cyan-500/10 text-cyan-400 mt-0.5 shrink-0 print-text-cyan">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <strong className="text-white text-xs block mb-1 print-text-white font-display">
                              Serverseitige Quoten & Validierung:
                            </strong>
                            <p className="text-xs text-gray-400 leading-relaxed print-text-muted">
                              Sicherung des Systems durch ein hartes Limit von maximal 50 Schriften pro Benutzerkonto. Bei Überschreiten wirft das Backend die Ausnahme <code className="bg-white/5 text-cyan-300 px-1 py-0.5 rounded text-[10px] font-mono print-text-cyan">font_limit_reached</code>, welche das Frontend fängt und in eine freundliche UI-Meldung übersetzt.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 bg-[#141416]/30 p-4 rounded-xl border border-white/[0.04] print-bg-card print-border">
                          <div className="p-1 rounded bg-cyan-500/10 text-cyan-400 mt-0.5 shrink-0 print-text-cyan">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <strong className="text-white text-xs block mb-1 print-text-white font-display">
                              Bedarfsgesteuertes Laden & Rendering (Lazy Loading):
                            </strong>
                            <p className="text-xs text-gray-400 leading-relaxed print-text-muted">
                              Entwicklung eines On-Demand-Fontloaders über die <code className="bg-white/5 text-cyan-300 px-1 py-0.5 rounded text-[10px] font-mono print-text-cyan">FontFace-API</code>. Schriftdateien werden erst dann geladen und im Browser gerendert, wenn sie tatsächlich im Viewport des Benutzers erscheinen, was eine hervorragende Performance garantiert.
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </section>

                  {/* Section 4: Database & Server Services */}
                  <section className="space-y-4 avoid-break">
                    <div className="flex items-center gap-3 text-white border-b border-white/[0.08] pb-2.5 print-border print-text-white leading-none">
                      <div className="p-1.5 rounded-lg bg-white/5 text-white print-bg-card flex items-center justify-center shrink-0">
                        <Database className="w-4 h-4" />
                      </div>
                      <h2 className="text-lg font-bold tracking-tight font-display">4. Relationales Datenbankschema & API-Sicherheit</h2>
                    </div>
                    
                    <p className="text-xs text-gray-400 print-text-muted leading-relaxed max-w-2xl font-sans">
                      Das relationale PostgreSQL-Schema bei Supabase sorgt für maximale Konsistenz, sichert alle Verknüpfungen ab und ist strikt durch Row-Level Security (RLS) geschützt:
                    </p>

                    {/* Integrated Supabase visual schema diagram component representing the exact user database schema */}
                    <SupabaseSchemaDiagram />

                    <div className="bg-[#141416]/30 border border-white/[0.06] rounded-2xl p-5 space-y-4 print-bg-card print-border">
                      <div className="flex items-center gap-2 text-white font-mono text-xs font-semibold print-text-white">
                        <Server className="w-4 h-4 text-cyan-400 print-text-cyan" />
                        <span>Backend Architecture & Security Policies</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px] text-gray-400 print-text-muted">
                        <div className="p-3 bg-[#080808]/50 rounded-xl border border-white/[0.04] print-bg-dark print-border">
                          <div className="font-bold text-white mb-1.5 print-text-white">Benutzer (Auth)</div>
                          <div className="space-y-0.5">
                            <div>• user_id (UUID)</div>
                            <div>• email (Text)</div>
                            <div>• role (User/Admin)</div>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-[#080808]/50 rounded-xl border border-white/[0.04] print-bg-dark print-border">
                          <div className="font-bold text-white mb-1.5 print-text-white">Schriften (Fonts)</div>
                          <div className="space-y-0.5">
                            <div>• id (UUID, PK)</div>
                            <div>• hash (Text, Unique)</div>
                            <div>• group_id (FK)</div>
                          </div>
                        </div>

                        <div className="p-3 bg-[#080808]/50 rounded-xl border border-white/[0.04] print-bg-dark print-border">
                          <div className="font-bold text-white mb-1.5 print-text-white">Gruppen (Groups)</div>
                          <div className="space-y-0.5">
                            <div>• id (UUID, PK)</div>
                            <div>• name (Text)</div>
                            <div>• user_id (FK)</div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/[0.04] flex items-center gap-2 text-[11px] text-gray-400 print-text-muted print-border font-sans">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400 print-text-cyan" />
                        <span>Integrierte PostgreSQL trigger functions garantieren referenzielle Integrität bei Lösch- & Verschiebeaktionen.</span>
                      </div>
                    </div>
                  </section>

                  {/* Section 5: Link */}
                  <section className="bg-gradient-to-r from-cyan-950/20 to-blue-950/20 p-6 rounded-2xl border border-cyan-500/10 flex flex-col sm:flex-row items-center justify-between gap-4 print-bg-card print-border print:p-5">
                    <div className="text-left font-sans">
                      <h3 className="text-white font-bold text-sm mb-1 print-text-white font-display">Live-Demonstration & Website</h3>
                      <p className="text-xs text-gray-400 max-w-md print-text-muted leading-relaxed">
                        Das System ist voll einsatzbereit und weltweit erreichbar. Nutzen Sie die Zugangsdaten im Anschreiben für ein Live-Testing der Plattform.
                      </p>
                    </div>
                    
                    <a 
                      href="https://fontat.pages.dev" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold px-4.5 py-2.5 rounded-full transition-all shrink-0 print-border print-text-white font-display"
                    >
                      <span>fontat.pages.dev</span>
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400 print-text-cyan" />
                    </a>
                  </section>

                </div>
                
              </td>
            </tr>
          </tbody>

        </table>

      </div>
    </div>
  );
};
