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

// Database Table Row Interface
interface TableRow {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
}

// Database Table Configuration Interface
interface TableConfig {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rows: TableRow[];
}

// Pure SVG, fully responsive, and infinitely scalable database schema diagram matching the user's Supabase schema
const SupabaseSchemaDiagram: React.FC = () => {
  // Highly accurate tables matching the Fontat Supabase schema
  const tables: TableConfig[] = [
    {
      name: 'auth.users',
      x: 320,
      y: 20,
      width: 200,
      height: 70,
      rows: [
        { name: 'id', type: 'uuid', isPrimaryKey: true }
      ]
    },
    {
      name: 'notifications',
      x: 20,
      y: 120,
      width: 240,
      height: 175,
      rows: [
        { name: 'id', type: 'uuid', isPrimaryKey: true },
        { name: 'user_id', type: 'uuid', isForeignKey: true },
        { name: 'type', type: 'text' },
        { name: 'slides', type: 'jsonb' },
        { name: 'created_at', type: 'timestamptz' }
      ]
    },
    {
      name: 'groups',
      x: 580,
      y: 120,
      width: 240,
      height: 175,
      rows: [
        { name: 'id', type: 'uuid', isPrimaryKey: true },
        { name: 'user_id', type: 'uuid', isForeignKey: true },
        { name: 'name', type: 'text' },
        { name: 'description', type: 'text' },
        { name: 'created_at', type: 'timestamptz' }
      ]
    },
    {
      name: 'font_weights',
      x: 20,
      y: 330,
      width: 240,
      height: 175,
      rows: [
        { name: 'id', type: 'uuid', isPrimaryKey: true },
        { name: 'user_id', type: 'uuid', isForeignKey: true },
        { name: 'parent_font_id', type: 'uuid', isForeignKey: true },
        { name: 'child_font_id', type: 'uuid', isForeignKey: true },
        { name: 'created_at', type: 'timestamptz' }
      ]
    },
    {
      name: 'font_assets',
      x: 580,
      y: 330,
      width: 240,
      height: 200,
      rows: [
        { name: 'id', type: 'uuid', isPrimaryKey: true },
        { name: 'hash', type: 'text' },
        { name: 'storage_path', type: 'text' },
        { name: 'download_url', type: 'text' },
        { name: 'size', type: 'int8' },
        { name: 'created_at', type: 'timestamptz' }
      ]
    },
    {
      name: 'fonts',
      x: 280,
      y: 490,
      width: 280,
      height: 225,
      rows: [
        { name: 'id', type: 'uuid', isPrimaryKey: true },
        { name: 'user_id', type: 'uuid', isForeignKey: true },
        { name: 'group_id', type: 'uuid', isForeignKey: true },
        { name: 'asset_id', type: 'uuid', isForeignKey: true },
        { name: 'name', type: 'text' },
        { name: 'metadata', type: 'jsonb' },
        { name: 'created_at', type: 'timestamptz' }
      ]
    }
  ];

  return (
    <div className="w-full overflow-hidden border border-white/10 rounded-2xl bg-[#0A0A0C] shadow-2xl p-3 sm:p-5 print-border print-bg-dark avoid-break">
      {/* 
        Responsive viewBox container allows the diagram to scale down dynamically to fit portrait A4 print page perfectly.
      */}
      <svg 
        viewBox="0 0 840 735" 
        className="w-full h-auto select-none"
        style={{ 
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', 
          backgroundSize: '18px 18px' 
        }}
      >
        <defs>
          {/* Uniform subtle target marker */}
          <marker id="dot-target" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6">
            <circle cx="5" cy="5" r="3.5" fill="#06B6D4" opacity="0.9" />
          </marker>
        </defs>

        {/* Ultra-precise, pixel-perfect database relation lines */}
        <g stroke="rgba(6, 182, 212, 0.45)" strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round">
          
          {/* 1. Connections from auth.users.id (X: 320 / 520, Y: 71) */}
          {/* To notifications.user_id (X: 260, Y: 197) */}
          <path d="M 320 71 L 290 71 L 290 197 L 260 197" markerEnd="url(#dot-target)" />
          
          {/* To font_weights.user_id (X: 260, Y: 407) */}
          <path d="M 320 71 L 275 71 L 275 407 L 260 407" markerEnd="url(#dot-target)" />
          
          {/* To groups.user_id (X: 580, Y: 197) */}
          <path d="M 520 71 L 550 71 L 550 197 L 580 197" markerEnd="url(#dot-target)" />
          
          {/* To fonts.user_id (X: 560, Y: 567) */}
          <path d="M 520 71 L 565 71 L 565 567 L 560 567" markerEnd="url(#dot-target)" />

          {/* 2. Connection from groups.id (X: 580, Y: 171) to fonts.group_id (X: 560, Y: 593) */}
          <path d="M 580 171 L 570 171 L 570 593 L 560 593" markerEnd="url(#dot-target)" />

          {/* 3. Connection from font_assets.id (X: 580, Y: 381) to fonts.asset_id (X: 560, Y: 619) */}
          <path d="M 580 381 L 572 381 L 572 619 L 560 619" markerEnd="url(#dot-target)" />

          {/* 4. Connections from fonts.id (X: 280, Y: 541) */}
          {/* To font_weights.parent_font_id (X: 260, Y: 433) */}
          <path d="M 280 541 L 270 541 L 270 433 L 260 433" markerEnd="url(#dot-target)" />
          
          {/* To font_weights.child_font_id (X: 260, Y: 459) */}
          <path d="M 280 541 L 268 541 L 268 459 L 260 459" markerEnd="url(#dot-target)" />
        </g>

        {/* Dynamic rendering of Database Table Cards */}
        {tables.map((table) => (
          <g key={table.name}>
            {/* Table Container Card Background */}
            <rect 
              x={table.x} 
              y={table.y} 
              width={table.width} 
              height={table.height} 
              rx="10" 
              ry="10" 
              fill="#121216" 
              stroke="rgba(255, 255, 255, 0.12)" 
              strokeWidth="1" 
            />

            {/* Table Header Background */}
            <rect 
              x={table.x} 
              y={table.y} 
              width={table.width} 
              height="38" 
              rx="10" 
              ry="10" 
              fill="#1C1C24" 
            />
            <rect 
              x={table.x} 
              y={table.y + 20} 
              width={table.width} 
              height="18" 
              fill="#1C1C24" 
            />
            
            {/* Header bottom separator line */}
            <line 
              x1={table.x} 
              y1={table.y + 38} 
              x2={table.x + table.width} 
              y2={table.y + 38} 
              stroke="rgba(255, 255, 255, 0.1)" 
              strokeWidth="1" 
            />

            {/* Table Name Title */}
            <text 
              x={table.x + 14} 
              y={table.y + 24} 
              fill="#FFFFFF" 
              fontSize="12" 
              fontWeight="bold" 
              fontFamily="sans-serif"
              letterSpacing="0.02em"
            >
              {table.name}
            </text>

            {/* Rows list */}
            {table.rows.map((row, idx) => {
              const rowY = table.y + 38 + idx * 26;
              
              const fieldColor = row.isPrimaryKey 
                ? '#FFFFFF' 
                : row.isForeignKey 
                  ? '#CBD5E1' 
                  : '#94A3B8';

              return (
                <g key={row.name}>
                  {/* Row background separator */}
                  {idx < table.rows.length - 1 && (
                    <line 
                      x1={table.x} 
                      y1={rowY + 26} 
                      x2={table.x + table.width} 
                      y2={rowY + 26} 
                      stroke="rgba(255, 255, 255, 0.04)" 
                      strokeWidth="1" 
                    />
                  )}
                  
                  {/* Key Badge: PK or FK (No Emojis!) */}
                  {row.isPrimaryKey && (
                    <g>
                      <rect 
                        x={table.x + 12} 
                        y={rowY + 6} 
                        width={22} 
                        height={14} 
                        rx="3" 
                        fill="rgba(6, 182, 212, 0.2)" 
                        stroke="rgba(6, 182, 212, 0.5)"
                        strokeWidth="0.75"
                      />
                      <text 
                        x={table.x + 23} 
                        y={rowY + 16} 
                        fill="#06B6D4" 
                        fontSize="9" 
                        fontWeight="bold" 
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        PK
                      </text>
                    </g>
                  )}

                  {row.isForeignKey && (
                    <g>
                      <rect 
                        x={table.x + 12} 
                        y={rowY + 6} 
                        width={22} 
                        height={14} 
                        rx="3" 
                        fill="rgba(129, 140, 248, 0.2)" 
                        stroke="rgba(129, 140, 248, 0.5)"
                        strokeWidth="0.75"
                      />
                      <text 
                        x={table.x + 23} 
                        y={rowY + 16} 
                        fill="#818CF8" 
                        fontSize="9" 
                        fontWeight="bold" 
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        FK
                      </text>
                    </g>
                  )}

                  {/* Field name */}
                  <text 
                    x={table.x + (row.isPrimaryKey || row.isForeignKey ? 40 : 14)} 
                    y={rowY + 17} 
                    fill={fieldColor} 
                    fontSize="11" 
                    fontFamily="monospace"
                    fontWeight={row.isPrimaryKey ? 'bold' : 'normal'}
                  >
                    {row.name}
                  </text>

                  {/* DataType */}
                  <text 
                    x={table.x + table.width - 14} 
                    y={rowY + 17} 
                    fill="#64748B" 
                    fontSize="10" 
                    fontFamily="monospace" 
                    textAnchor="end"
                  >
                    {row.type}
                  </text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
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
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handlePrint = () => {
    const isIframe = window.self !== window.top;
    if (isIframe) {
      const cleanUrl = window.location.origin + window.location.pathname + '?print=true';
      window.open(cleanUrl, '_blank');
    } else {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F4F6] font-sans antialiased selection:bg-cyan-500/30 pb-20 print:bg-[#080808] print:text-[#F3F4F6] print:pb-0">
      
      {/* Dynamic CSS Overrides for Crisp Print Output */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body, html, #document-wrapper {
            background-color: #080808 !important;
            color: #F3F4F6 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Prevent awkward page splits inside key cards & sections */
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .print-bg-dark {
            background-color: #080808 !important;
            -webkit-print-color-adjust: exact !important;
          }
          .print-bg-card {
            background-color: #121215 !important;
            -webkit-print-color-adjust: exact !important;
          }
          .print-border {
            border-color: rgba(255, 255, 255, 0.1) !important;
            -webkit-print-color-adjust: exact !important;
          }
          .print-text-cyan {
            color: #06B6D4 !important;
            -webkit-print-color-adjust: exact !important;
          }

          @page {
            size: A4;
            margin: 1.2cm 1.2cm;
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

      {/* Frame / Sandbox Notice - Hidden on Print */}
      <div className="max-w-[880px] mx-auto mt-6 px-4 print:hidden">
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

      {/* Main Document Container */}
      <div 
        ref={printAreaRef}
        id="document-wrapper"
        className="max-w-[880px] mx-auto my-8 bg-[#0C0C0E] rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden border border-white/10 print:my-0 print:border-none print:shadow-none print:bg-[#080808] print:rounded-none"
      >
        {/* Document Header */}
        <header className="bg-[#080808] h-20 px-8 flex items-center justify-between border-b border-white/10 print-bg-dark print-border">
          <div className="flex items-center justify-start">
            <div className="w-[130px] h-fit flex items-center justify-center text-white">
              <Logo className="w-full h-auto text-white" id="arbeitsprobe-header-logo" />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="relative w-10 h-10 rounded-full border border-white/20 bg-[#080808] flex items-center justify-center text-white shadow-sm print-border print-bg-dark">
              <Bell className="w-4 h-4 stroke-[1.5]" />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-[#06B6D4] rounded-full"></span>
            </div>
          </div>
        </header>

        {/* Content Body - Smooth Flow without Forced Page Break gaps */}
        <div className="p-8 sm:p-12 space-y-10">
          
          {/* Document Title Block */}
          <div className="border-b border-white/10 pb-8 print-border avoid-break">
            <div className="text-cyan-400 text-xs font-bold tracking-[0.2em] uppercase mb-2.5 print-text-cyan font-display">
              ARBEITSPROBE / SOFTWARE ENTWICKLUNG
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4 font-display">
              Fontat – Technische Projektdokumentation
            </h1>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-400 font-mono">
              <span>Rolle: Projektplanung & Datenbankarchitektur</span>
              <span className="hidden sm:inline text-white/20">•</span>
              <span>Typ: Cloud-Plattform</span>
              <span className="hidden sm:inline text-white/20">•</span>
              <span>Sprache: Deutsch</span>
            </div>
          </div>

          {/* Section 1: Project Overview */}
          <section className="space-y-4 avoid-break">
            <div className="flex items-center gap-3 text-white border-b border-white/10 pb-3 print-border leading-none">
              <div className="p-2 rounded-xl bg-white/5 text-white print-bg-card flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold tracking-tight font-display">1. Projektübersicht & Vision</h2>
            </div>
            <div className="text-gray-300 text-sm sm:text-base leading-relaxed space-y-4 font-sans">
              <p>
                <strong className="text-white">Fontat</strong> ist ein modernes, cloudbasiertes System zur interaktiven Verwaltung, Live-Visualisierung und zum Testen von Schriftarten. Die Plattform wurde entwickelt, um Webdesignern und Entwicklern ein nahtloses typografisches Labor direkt im Browser bereitzustellen.
              </p>
              <p>
                Mit dem integrierten <strong className="text-white">"Typografie-Labor" (Lab)</strong> können Anwender geladene Schriften direkt manipulieren, Glyphen extrahieren und Textmetriken vergleichen. Das System glänzt mit nativer, reibungsloser Unterstützung von <strong className="text-white">RTL-Schriften (Right-to-Left, z.B. Arabisch)</strong> gekoppelt mit LTR-Schriften in Echtzeit.
              </p>
            </div>
          </section>

          {/* Section 2: Technology Stack */}
          <section className="space-y-4 avoid-break">
            <div className="flex items-center gap-3 text-white border-b border-white/10 pb-3 print-border leading-none">
              <div className="p-2 rounded-xl bg-white/5 text-white print-bg-card flex items-center justify-center shrink-0">
                <Cpu className="w-4.5 h-4.5 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold tracking-tight font-display">2. Technologie-Stack & Architektur</h2>
            </div>
            
            <p className="text-sm text-gray-400 leading-relaxed font-sans">
              Das System setzt auf hochperformante Webtechnologien mit einer klaren Trennung von Client und serverseitigen Services.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-[#121215] p-6 rounded-2xl border border-white/10 print-bg-card print-border">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white font-display">Frontend-Architektur</h3>
                </div>
                <ul className="text-sm text-gray-300 space-y-3 list-none font-sans">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong className="text-white">React (v18+) & TypeScript:</strong> Typensichere Logik, schnelles Rendering und stabiles State-Management.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong className="text-white">Tailwind CSS:</strong> Schnelle, responsive UI-Stile basierend auf der einheitlichen, dunklen Fontat-Markenidentität.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong className="text-white">Framer Motion:</strong> Flüssige Benutzeroberfläche dank nativer Hardware-beschleunigter Mikro-Animationen.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#121215] p-6 rounded-2xl border border-white/10 print-bg-card print-border">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white font-display">Backend & Cloud-Infrastruktur</h3>
                </div>
                <ul className="text-sm text-gray-300 space-y-3 list-none font-sans">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong className="text-white">Supabase (PostgreSQL):</strong> Relationale, cloud-gestützte Echtzeitdatenbank für reibungslose Datensynchronisation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong className="text-white">Row-Level Security (RLS):</strong> Datenintegrität und absolute Isolation der Benutzerdaten direkt im DB-Layer.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong className="text-white">Cloud-Storage Buckets:</strong> Cloud-Speicher für hochgeladene Schriftdateien mit SHA-256 Validierung.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3: Professional Contributions */}
          <section className="space-y-4 avoid-break">
            <div className="flex items-center gap-3 text-white border-b border-white/10 pb-3 print-border leading-none">
              <div className="p-2 rounded-xl bg-white/5 text-white print-bg-card flex items-center justify-center shrink-0">
                <Layers className="w-4.5 h-4.5 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold tracking-tight font-display">3. Meine Kernaufgaben & Implementierungen</h2>
            </div>
            
            <div className="text-gray-300 text-sm sm:text-base leading-relaxed space-y-5 font-sans">
              <p>
                Als Projektverantwortlicher habe ich die Architektur konzipiert, die Datenbankstruktur eigenständig aufgebaut und die Umsetzung der Anwendungslogik gesteuert. Wichtige technische Highlights sind:
              </p>
              
              <div className="space-y-4 font-sans">
                <div className="flex items-start gap-3.5 bg-[#121215] p-5 rounded-2xl border border-white/10 print-bg-card print-border">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5 shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white text-sm block mb-1 font-display">
                      Intelligente Duplikatsprüfung im Client (SHA-256):
                    </strong>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      Entwicklung eines clientseitigen Krypto-Hashes. Vor dem Upload berechnet die Web-App den SHA-256-Hashwert der Schriftdatei. Die RPC-Funktion <code className="bg-white/10 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono">prepare_font_upload</code> prüft die Existenz des Hashes. Falls existent, entfällt der Upload komplett, was Bandbreite und Cloud-Speicher schont.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 bg-[#121215] p-5 rounded-2xl border border-white/10 print-bg-card print-border">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5 shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white text-sm block mb-1 font-display">
                      Serverseitige Quoten & Validierung:
                    </strong>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      Sicherung des Systems durch ein hartes Limit von maximal 50 Schriften pro Benutzerkonto. Bei Überschreiten wirft das Backend die Ausnahme <code className="bg-white/10 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono">font_limit_reached</code>, welche das Frontend fängt und in eine freundliche UI-Meldung übersetzt.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 bg-[#121215] p-5 rounded-2xl border border-white/10 print-bg-card print-border">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5 shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white text-sm block mb-1 font-display">
                      Bedarfsgesteuertes Laden & Rendering (Lazy Loading):
                    </strong>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      Entwicklung eines On-Demand-Fontloaders über die <code className="bg-white/10 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono">FontFace-API</code>. Schriftdateien werden erst dann geladen und im Browser gerendert, wenn sie tatsächlich im Viewport des Benutzers erscheinen, was eine hervorragende Performance garantiert.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Database & Server Services */}
          <section className="space-y-5 avoid-break">
            <div className="flex items-center gap-3 text-white border-b border-white/10 pb-3 print-border leading-none">
              <div className="p-2 rounded-xl bg-white/5 text-white print-bg-card flex items-center justify-center shrink-0">
                <Database className="w-4.5 h-4.5 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold tracking-tight font-display">4. Relationales Datenbankschema & API-Sicherheit</h2>
            </div>
            
            <p className="text-sm text-gray-300 leading-relaxed font-sans">
              Das relationale PostgreSQL-Schema bei Supabase sorgt für maximale Konsistenz, sichert alle Verknüpfungen ab und ist strikt durch Row-Level Security (RLS) geschützt:
            </p>

            {/* Integrated Supabase visual schema diagram */}
            <SupabaseSchemaDiagram />

            <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-4 print-bg-card print-border">
              <div className="flex items-center gap-2 text-white font-mono text-xs font-semibold">
                <Server className="w-4 h-4 text-cyan-400" />
                <span>Backend Architecture & Security Policies</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs text-gray-300">
                <div className="p-4 bg-[#080808]/60 rounded-xl border border-white/10 print-bg-dark print-border">
                  <div className="font-bold text-white mb-2">Benutzer (Auth)</div>
                  <div className="space-y-1 text-gray-400">
                    <div>• user_id (UUID)</div>
                    <div>• email (Text)</div>
                    <div>• role (User/Admin)</div>
                  </div>
                </div>
                
                <div className="p-4 bg-[#080808]/60 rounded-xl border border-white/10 print-bg-dark print-border">
                  <div className="font-bold text-white mb-2">Schriften (Fonts)</div>
                  <div className="space-y-1 text-gray-400">
                    <div>• id (UUID, PK)</div>
                    <div>• hash (Text, Unique)</div>
                    <div>• group_id (FK)</div>
                  </div>
                </div>

                <div className="p-4 bg-[#080808]/60 rounded-xl border border-white/10 print-bg-dark print-border">
                  <div className="font-bold text-white mb-2">Gruppen (Groups)</div>
                  <div className="space-y-1 text-gray-400">
                    <div>• id (UUID, PK)</div>
                    <div>• name (Text)</div>
                    <div>• user_id (FK)</div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center gap-2.5 text-xs text-gray-400 font-sans">
                <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Integrierte PostgreSQL trigger functions garantieren referenzielle Integrität bei Lösch- & Verschiebeaktionen.</span>
              </div>
            </div>
          </section>

          {/* Section 5: Live Site Link */}
          <section className="bg-gradient-to-r from-cyan-950/30 via-[#121215] to-blue-950/30 p-6 sm:p-8 rounded-2xl border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-5 print-bg-card print-border avoid-break">
            <div className="text-left font-sans">
              <h3 className="text-white font-bold text-base mb-1 font-display">Live-Demonstration & Website</h3>
              <p className="text-sm text-gray-300 max-w-lg leading-relaxed">
                Das System ist voll einsatzbereit und weltweit erreichbar. Nutzen Sie die Zugangsdaten im Anschreiben für ein Live-Testing der Plattform.
              </p>
            </div>
            
            <a 
              href="https://fontat.pages.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white/10 border border-white/20 hover:bg-white/20 text-white text-xs font-semibold px-5 py-3 rounded-full transition-all shrink-0 font-display"
            >
              <span>fontat.pages.dev</span>
              <ExternalLink className="w-4 h-4 text-cyan-400" />
            </a>
          </section>

        </div>
        
      </div>
    </div>
  );
};
