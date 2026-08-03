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
      // If we are inside the iframe sandbox, open a clean tab with ?print=true parameter to print automatically
      const cleanUrl = window.location.origin + window.location.pathname + '?print=true';
      window.open(cleanUrl, '_blank');
    } else {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F4F6] font-sans antialiased selection:bg-white/20 pb-20 print:bg-white print:text-black">
      
      {/* Top action bar - Hidden on Print */}
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
          <span className="text-xs text-[#06B6D4] font-semibold tracking-wide">Bewerbungsunterlage / Arbeitsprobe</span>
        </div>

        {/* Action Button */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-[0_4px_15px_rgba(6,182,212,0.3)] hover:shadow-[0_6px_20px_rgba(6,182,212,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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
          <div className="text-xs text-gray-300 leading-relaxed">
            <span className="font-bold text-white block mb-1">Tipp für den perfekten Export:</span>
            Klicken Sie oben auf <span className="text-cyan-400 font-semibold">"Als PDF drucken / speichern"</span>. Die Anwendung öffnet automatisch einen unbeschränkten neuen Tab, um die PDF-Datei in erstklassiger Druckqualität ohne Frame-Einschränkungen zu generieren.
          </div>
        </div>
      </div>

      {/* Document Container */}
      <div 
        ref={printAreaRef}
        className="max-w-[850px] mx-auto my-8 bg-[#121212] rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden border border-white/[0.08] print:my-0 print:border-none print:shadow-none print:bg-white print:rounded-none"
      >
        
        {/* Real Site-Matching Header */}
        <header className="bg-[#080808] h-20 px-8 flex items-center justify-between border-b border-white/10 print:border-b-2 print:border-black/25">
          {/* Authentic FONTAT English Logo using the real Logo component */}
          <div className="flex items-center justify-start">
            <div className="w-[125px] h-fit flex items-center justify-center text-white print:text-black">
              <Logo className="w-full h-auto text-white print:text-black" id="arbeitsprobe-header-logo" />
            </div>
          </div>

          {/* Authentic Notifications/Bell Button on the Right */}
          <div className="flex items-center justify-end">
            <div className="relative w-10 h-10 rounded-full border border-white/20 bg-[#080808] flex items-center justify-center text-white shadow-sm print:border-black/20 print:text-black">
              <Bell className="w-4 h-4 stroke-[1.5]" />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-[#06B6D4] rounded-full print:bg-black"></span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-10 sm:p-14 space-y-12 print:p-8 print:text-black">
          
          {/* Document Title */}
          <div className="border-b border-white/[0.08] pb-8 print:border-black/20">
            <div className="text-cyan-400 text-xs font-bold tracking-[0.2em] uppercase mb-2.5 print:text-blue-800">
              ARBEITSPROBE / TECH-DOKUMENTATION
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4 print:text-black">
              Fontat – Technische Projektdokumentation
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/50 print:text-gray-600 font-mono">
              <span>Rolle: Alleiniger Entwickler</span>
              <span className="hidden sm:inline">•</span>
              <span>Typ: Full-Stack Web-App</span>
              <span className="hidden sm:inline">•</span>
              <span>Sprache: Deutsch</span>
            </div>
          </div>

          {/* Section 1: Project Overview */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-white border-b border-white/[0.08] pb-2.5 print:border-black/15 print:text-black">
              <div className="p-1.5 rounded-lg bg-white/5 text-white print:bg-gray-100 print:text-black">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">1. Projektübersicht & Vision</h2>
            </div>
            <div className="text-gray-300 text-sm leading-relaxed space-y-4 print:text-gray-800">
              <p>
                <strong>Fontat</strong> ist ein innovatives, cloudbasiertes System zur interaktiven Verwaltung, Live-Visualisierung und zum Testen von Schriftarten. Die Plattform wurde entwickelt, um Webdesignern und Entwicklern ein nahtloses typografisches Labor direkt im Browser bereitzustellen.
              </p>
              <p>
                Durch ein hochentwickeltes <strong>"Typografie-Labor" (Lab)</strong> können Benutzer geladene Schriften direkt anpassen, Glyphen extrahieren und Textmetriken vergleichen. Ein Alleinstellungsmerkmal ist die perfekte Unterstützung und das harmonische Zusammenspiel von <strong>RTL- (Right-to-Left, z.B. Arabisch)</strong> und <strong>LTR- (Left-to-Right)</strong> Schriften.
              </p>
            </div>
          </section>

          {/* Section 2: Technology Stack */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-white border-b border-white/[0.08] pb-2.5 print:border-black/15 print:text-black">
              <div className="p-1.5 rounded-lg bg-white/5 text-white print:bg-gray-100 print:text-black">
                <Cpu className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">2. Technologie-Stack & Architektur</h2>
            </div>
            
            <p className="text-xs text-gray-400 print:text-gray-700 leading-relaxed max-w-2xl">
              Das System setzt auf moderne, hochperformante Webtechnologien mit einer klaren Trennung von Client und serverseitigen Services.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="bg-[#18181B]/50 p-5 rounded-2xl border border-white/[0.06] print:bg-gray-50 print:border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1 rounded bg-cyan-500/10 text-cyan-400">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-bold text-white print:text-black">Frontend-Architektur</h3>
                </div>
                <ul className="text-xs text-gray-400 space-y-2 list-none print:text-gray-700">
                  <li><strong>React (v18+) & TypeScript:</strong> Typensichere Logik, schnelles Rendering und stabiles State-Management.</li>
                  <li><strong>Tailwind CSS:</strong> Schnelle, responsive UI-Stile basierend auf der einheitlichen, dunklen Fontat-Markenidentität.</li>
                  <li><strong>Framer Motion:</strong> Flüssige Benutzeroberfläche dank nativer Hardware-beschleunigter Mikro-Animationen.</li>
                </ul>
              </div>

              <div className="bg-[#18181B]/50 p-5 rounded-2xl border border-white/[0.06] print:bg-gray-50 print:border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1 rounded bg-blue-500/10 text-blue-400">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-bold text-white print:text-black">Backend & Cloud-Infrastruktur</h3>
                </div>
                <ul className="text-xs text-gray-400 space-y-2 list-none print:text-gray-700">
                  <li><strong>Supabase (PostgreSQL):</strong> Relationale, cloud-gestützte Echtzeitdatenbank für reibungslose Datensynchronisation.</li>
                  <li><strong>Row-Level Security (RLS):</strong> Datenintegrität und absolute Isolation der Benutzerdaten direkt im DB-Layer.</li>
                  <li><strong>Cloud-Storage Buckets:</strong> Hochzuverlässiger Cloud-Speicher für hochgeladene Schriftdateien mit SHA-256 Validierung.</li>
                </ul>
              </div>

            </div>
          </section>

          {/* Page Break for cleaner printing output */}
          <div className="print:page-break-before" />

          {/* Section 3: Professional Contributions */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-white border-b border-white/[0.08] pb-2.5 print:border-black/15 print:text-black">
              <div className="p-1.5 rounded-lg bg-white/5 text-white print:bg-gray-100 print:text-black">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">3. Meine Kernaufgaben & Implementierungen</h2>
            </div>
            
            <div className="text-gray-300 text-sm leading-relaxed space-y-5 print:text-gray-800">
              <p>
                In meiner Rolle als alleiniger Full-Stack Entwickler lag mein Fokus auf der Entwicklung einer performanten Plattform mit modernsten Sicherheits- und Optimierungsstandards:
              </p>
              
              <div className="space-y-4">
                
                <div className="flex items-start gap-3 bg-[#18181B]/30 p-4 rounded-xl border border-white/[0.04] print:bg-gray-50 print:border-gray-200">
                  <div className="p-1 rounded bg-[#06B6D4]/10 text-[#06B6D4] mt-0.5 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white text-xs block mb-1 print:text-black">
                      Intelligente Duplikatsprüfung im Client (SHA-256):
                    </strong>
                    <p className="text-xs text-gray-400 leading-relaxed print:text-gray-700">
                      Entwicklung eines clientseitigen Krypto-Hashes. Vor jedem Upload berechnet die Web-App den SHA-256-Hashwert der Schriftdatei. Eine Supabase RPC-Funktion (<code className="bg-white/5 text-cyan-300 px-1 py-0.5 rounded text-[10px] print:bg-gray-100 print:text-blue-800 font-mono">prepare_font_upload</code>) prüft, ob dieser Hash bereits im System existiert. Ist dies der Fall, entfällt der Upload in den Speicher-Bucket komplett, was Bandbreite spart und redundanten Dateimüll vermeidet.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#18181B]/30 p-4 rounded-xl border border-white/[0.04] print:bg-gray-50 print:border-gray-200">
                  <div className="p-1 rounded bg-[#06B6D4]/10 text-[#06B6D4] mt-0.5 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white text-xs block mb-1 print:text-black">
                      Serverseitige Quoten & Validierung:
                    </strong>
                    <p className="text-xs text-gray-400 leading-relaxed print:text-gray-700">
                      Sicherung des Systems durch ein hartes Limit von maximal 50 Schriften pro Benutzerkonto. Bei Überschreiten des Quotas wirft die Backend-Schnittstelle einen definierten Fehlercode (<code className="bg-white/5 text-cyan-300 px-1 py-0.5 rounded text-[10px] print:bg-gray-100 print:text-blue-800 font-mono">font_limit_reached</code>), welcher vom Frontend abgefangen und in eine verständliche UI-Meldung übersetzt wird.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#18181B]/30 p-4 rounded-xl border border-white/[0.04] print:bg-gray-50 print:border-gray-200">
                  <div className="p-1 rounded bg-[#06B6D4]/10 text-[#06B6D4] mt-0.5 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white text-xs block mb-1 print:text-black">
                      Bedarfsgesteuertes Laden & Rendering (Lazy Loading):
                    </strong>
                    <p className="text-xs text-gray-400 leading-relaxed print:text-gray-700">
                      Entwicklung eines On-Demand-Fontloaders über die <code className="bg-white/5 text-cyan-300 px-1 py-0.5 rounded text-[10px] print:bg-gray-100 print:text-blue-800 font-mono">FontFace-API</code>. Schriftdateien werden erst dann geladen und im Browser gerendert, wenn sie tatsächlich in den sichtbaren Bereich (Viewport) des Benutzers gescrollt werden. Dies sorgt für eine exzellente Render-Performance bei umfangreichen Schriftbibliotheken.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* Section 4: Database & Server Services */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-white border-b border-white/[0.08] pb-2.5 print:border-black/15 print:text-black">
              <div className="p-1.5 rounded-lg bg-white/5 text-white print:bg-gray-100 print:text-black">
                <Database className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">4. Relationales Datenbankschema & API-Sicherheit</h2>
            </div>
            
            <p className="text-xs text-gray-400 print:text-gray-700 leading-relaxed max-w-2xl">
              Das relationale PostgreSQL-Schema bei Supabase sorgt für maximale Konsistenz und ist strikt durch Row-Level Security (RLS) geschützt:
            </p>

            <div className="bg-[#18181B]/30 border border-white/[0.06] rounded-2xl p-5 space-y-4 print:bg-gray-50 print:border-gray-200">
              <div className="flex items-center gap-2 text-white font-mono text-xs font-semibold print:text-black">
                <Server className="w-4 h-4 text-cyan-400" />
                <span>Backend Architecture & Security Policies</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px] text-gray-400 print:text-gray-700">
                <div className="p-3 bg-[#080808]/50 rounded-xl border border-white/[0.04] print:bg-white print:border-gray-200">
                  <div className="font-bold text-white mb-1.5 print:text-black">Benutzer (Auth)</div>
                  <div className="space-y-0.5">
                    <div>• user_id (UUID)</div>
                    <div>• email (Text)</div>
                    <div>• role (User/Admin)</div>
                  </div>
                </div>
                
                <div className="p-3 bg-[#080808]/50 rounded-xl border border-white/[0.04] print:bg-white print:border-gray-200">
                  <div className="font-bold text-white mb-1.5 print:text-black">Schriften (Fonts)</div>
                  <div className="space-y-0.5">
                    <div>• id (UUID, PK)</div>
                    <div>• hash (Text, Unique)</div>
                    <div>• group_id (FK)</div>
                  </div>
                </div>

                <div className="p-3 bg-[#080808]/50 rounded-xl border border-white/[0.04] print:bg-white print:border-gray-200">
                  <div className="font-bold text-white mb-1.5 print:text-black">Gruppen (Groups)</div>
                  <div className="space-y-0.5">
                    <div>• id (UUID, PK)</div>
                    <div>• name (Text)</div>
                    <div>• user_id (FK)</div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.04] flex items-center gap-2 text-[11px] text-gray-400 print:text-gray-600 print:border-gray-200">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Integrierte PostgreSQL trigger functions garantieren referenzielle Integrität bei Lösch- & Verschiebeaktionen.</span>
              </div>
            </div>

            {/* Perfect SVG database vector box instead of dashed lines */}
            <div className="border border-white/10 rounded-2xl p-6 text-center bg-[#18181B]/20 print:border-gray-200 print:bg-gray-50 flex flex-col items-center justify-center gap-2">
              <Database className="w-8 h-8 text-cyan-400/80 mb-1" />
              <p className="font-semibold text-white text-xs print:text-black">Supabase Schema ER-Diagramm</p>
              <p className="text-[10px] text-gray-400 max-w-md mx-auto leading-relaxed print:text-gray-500">
                In der final ausgedruckten PDF-Bewerbung können Sie dieses optisch ausgerichtete Feld nutzen, um Ihren grafischen Screenshot der Supabase Tabellenbeziehungen einzubinden.
              </p>
            </div>
          </section>

          {/* Section 5: Link */}
          <section className="bg-gradient-to-r from-cyan-950/20 to-blue-950/20 p-6 rounded-2xl border border-cyan-500/10 flex flex-col sm:flex-row items-center justify-between gap-4 print:bg-gray-50 print:border-gray-200 print:p-5">
            <div className="text-left">
              <h3 className="text-white font-bold text-sm mb-1 print:text-black">Live-Demonstration & Website</h3>
              <p className="text-xs text-gray-400 max-w-md print:text-gray-700 leading-relaxed">
                Das System ist voll einsatzbereit und weltweit erreichbar. Nutzen Sie die Zugangsdaten im Anschreiben für ein Live-Testing der Plattform.
              </p>
            </div>
            
            <a 
              href="https://fontat.pages.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold px-4.5 py-2.5 rounded-full transition-all shrink-0 print:border-gray-300 print:text-black"
            >
              <span>fontat.pages.dev</span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            </a>
          </section>

        </div>

      </div>
    </div>
  );
};
