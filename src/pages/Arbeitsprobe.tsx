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
          /* Force exact black background and light text in output PDF */
          body, html {
            background-color: #080808 !important;
            color: #F3F4F6 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
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
            background-color: #121212 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-bg-alt {
            background-color: #18181C !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-border {
            border-color: rgba(255, 255, 255, 0.1) !important;
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
                
                <div className="p-10 sm:p-14 space-y-16">
                  
                  {/* Document Title Block */}
                  <div className="border-b border-white/[0.08] pb-8 print-border">
                    <div className="text-cyan-400 text-[13px] font-bold tracking-[0.2em] uppercase mb-3 print-text-cyan font-display">
                      ARBEITSPROBE / SOFTWARE ENTWICKLUNG
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-5 print-text-white font-display">
                      Fontat – Technische Projektdokumentation
                    </h1>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/50 print-text-muted font-mono">
                      <span>Rolle: Projektplanung & Datenbankarchitektur</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Typ: Cloud-Plattform</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Sprache: Deutsch</span>
                    </div>
                  </div>

                  {/* Section 1: Project Overview */}
                  <section className="space-y-5 avoid-break">
                    <div className="flex items-center gap-3.5 text-white border-b border-white/[0.08] pb-3 print-border print-text-white">
                      <div className="p-2 rounded-lg bg-white/5 text-white print-bg-card flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-bold tracking-tight font-display mt-0.5">1. Projektübersicht & Vision</h2>
                    </div>
                    <div className="text-gray-300 text-[15px] leading-relaxed space-y-5 print-text-muted">
                      <p>
                        <strong>Fontat</strong> ist ein modernes, cloudbasiertes System zur interaktiven Verwaltung, Live-Visualisierung und zum Testen von Schriftarten. Die Plattform wurde entwickelt, um Webdesignern und Entwicklern ein nahtloses typografisches Labor direkt im Browser bereitzustellen.
                      </p>
                      <p>
                        Mit dem integrierten <strong>"Typografie-Labor" (Lab)</strong> können Anwender geladene Schriften direkt manipulieren, Glyphen extrahieren und Textmetriken vergleichen. Das System glänzt mit nativer, reibungsloser Unterstützung von <strong>RTL-Schriften (Right-to-Left, z.B. Arabisch)</strong> gekoppelt mit LTR-Schriften in Echtzeit.
                      </p>
                    </div>
                  </section>

                  {/* Section 2: Technology Stack */}
                  <section className="space-y-5 avoid-break">
                    <div className="flex items-center gap-3.5 text-white border-b border-white/[0.08] pb-3 print-border print-text-white">
                      <div className="p-2 rounded-lg bg-white/5 text-white print-bg-card flex items-center justify-center shrink-0">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-bold tracking-tight font-display mt-0.5">2. Technologie-Stack & Architektur</h2>
                    </div>
                    
                    <p className="text-[15px] text-gray-400 print-text-muted leading-relaxed max-w-2xl">
                      Das System setzt auf hochperformante Webtechnologien mit einer klaren Trennung von Client und serverseitigen Services.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                      
                      <div className="bg-[#18181B]/50 p-6 rounded-2xl border border-white/[0.06] print-bg-card print-border">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-1 rounded bg-cyan-500/10 text-cyan-400 print-text-cyan">
                            <Check className="w-4 h-4" />
                          </div>
                          <h3 className="text-[15px] font-bold text-white print-text-white font-display mt-0.5">Frontend-Architektur</h3>
                        </div>
                        <ul className="text-sm text-gray-400 space-y-3 list-none print-text-muted">
                          <li className="leading-relaxed"><strong>React (v18+) & TypeScript:</strong> Typensichere Logik, schnelles Rendering und stabiles State-Management.</li>
                          <li className="leading-relaxed"><strong>Tailwind CSS:</strong> Schnelle, responsive UI-Stile basierend auf der einheitlichen, dunklen Fontat-Markenidentität.</li>
                          <li className="leading-relaxed"><strong>Framer Motion:</strong> Flüssige Benutzeroberfläche dank nativer Hardware-beschleunigter Mikro-Animationen.</li>
                        </ul>
                      </div>

                      <div className="bg-[#18181B]/50 p-6 rounded-2xl border border-white/[0.06] print-bg-card print-border">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-1 rounded bg-blue-500/10 text-blue-400">
                            <Check className="w-4 h-4" />
                          </div>
                          <h3 className="text-[15px] font-bold text-white print-text-white font-display mt-0.5">Backend & Cloud-Infrastruktur</h3>
                        </div>
                        <ul className="text-sm text-gray-400 space-y-3 list-none print-text-muted">
                          <li className="leading-relaxed"><strong>Supabase (PostgreSQL):</strong> Relationale, cloud-gestützte Echtzeitdatenbank für reibungslose Datensynchronisation.</li>
                          <li className="leading-relaxed"><strong>Row-Level Security (RLS):</strong> Datenintegrität und absolute Isolation der Benutzerdaten direkt im DB-Layer.</li>
                          <li className="leading-relaxed"><strong>Cloud-Storage Buckets:</strong> Cloud-Speicher für hochgeladene Schriftdateien mit SHA-256 Validierung.</li>
                        </ul>
                      </div>

                    </div>
                  </section>

                  {/* Section 3: Professional Contributions */}
                  <section className="space-y-5 avoid-break">
                    <div className="flex items-center gap-3.5 text-white border-b border-white/[0.08] pb-3 print-border print-text-white">
                      <div className="p-2 rounded-lg bg-white/5 text-white print-bg-card flex items-center justify-center shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-bold tracking-tight font-display mt-0.5">3. Meine Kernaufgaben & Implementierungen</h2>
                    </div>
                    
                    <div className="text-gray-300 text-[15px] leading-relaxed space-y-6 print-text-muted">
                      <p>
                        Als Projektverantwortlicher habe ich die Architektur konzipiert, die Datenbankstruktur eigenständig aufgebaut und die Umsetzung der Anwendungslogik in Zusammenarbeit mit KI-gestützten Entwicklungswerkzeugen gesteuert. Wichtige technische Highlights sind:
                      </p>
                      
                      <div className="space-y-5">
                        
                        <div className="flex items-start gap-4 bg-[#18181B]/30 p-5 rounded-xl border border-white/[0.04] print-bg-card print-border">
                          <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 mt-0.5 shrink-0 print-text-cyan">
                            <Check className="w-4 h-4" />
                          </div>
                          <div>
                            <strong className="text-white text-[15px] block mb-1.5 print-text-white font-display">
                              Intelligente Duplikatsprüfung im Client (SHA-256):
                            </strong>
                            <p className="text-sm text-gray-400 leading-relaxed print-text-muted">
                              Entwicklung eines clientseitigen Krypto-Hashes. Vor dem Upload berechnet die Web-App den SHA-256-Hashwert der Schriftdatei. Die RPC-Funktion <code className="bg-white/5 text-cyan-300 px-1.5 py-0.5 rounded text-[11px] font-mono print-text-cyan">prepare_font_upload</code> prüft die Existenz des Hashes. Falls existent, entfällt der Upload komplett, was Bandbreite und Cloud-Speicher schont.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 bg-[#18181B]/30 p-5 rounded-xl border border-white/[0.04] print-bg-card print-border">
                          <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 mt-0.5 shrink-0 print-text-cyan">
                            <Check className="w-4 h-4" />
                          </div>
                          <div>
                            <strong className="text-white text-[15px] block mb-1.5 print-text-white font-display">
                              Serverseitige Quoten & Validierung:
                            </strong>
                            <p className="text-sm text-gray-400 leading-relaxed print-text-muted">
                              Sicherung des Systems durch ein hartes Limit von maximal 50 Schriften pro Benutzerkonto. Bei Überschreiten wirft das Backend die Ausnahme <code className="bg-white/5 text-cyan-300 px-1.5 py-0.5 rounded text-[11px] font-mono print-text-cyan">font_limit_reached</code>, welche das Frontend fängt und in eine freundliche UI-Meldung übersetzt.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 bg-[#18181B]/30 p-5 rounded-xl border border-white/[0.04] print-bg-card print-border">
                          <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 mt-0.5 shrink-0 print-text-cyan">
                            <Check className="w-4 h-4" />
                          </div>
                          <div>
                            <strong className="text-white text-[15px] block mb-1.5 print-text-white font-display">
                              Bedarfsgesteuertes Laden & Rendering (Lazy Loading):
                            </strong>
                            <p className="text-sm text-gray-400 leading-relaxed print-text-muted">
                              Entwicklung eines On-Demand-Fontloaders über die <code className="bg-white/5 text-cyan-300 px-1.5 py-0.5 rounded text-[11px] font-mono print-text-cyan">FontFace-API</code>. Schriftdateien werden erst dann geladen und im Browser gerendert, wenn sie tatsächlich im Viewport des Benutzers erscheinen, was eine hervorragende Performance garantiert.
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </section>

                  {/* Hard page break only on printed PDF for professional pagination spacing */}
                  <div className="page-break" />

                  {/* Section 4: Database & Server Services */}
                  <section className="space-y-5 avoid-break">
                    <div className="flex items-center gap-3.5 text-white border-b border-white/[0.08] pb-3 print-border print-text-white">
                      <div className="p-2 rounded-lg bg-white/5 text-white print-bg-card flex items-center justify-center shrink-0">
                        <Database className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-bold tracking-tight font-display mt-0.5">4. Relationales Datenbankschema & API-Sicherheit</h2>
                    </div>
                    
                    <p className="text-[15px] text-gray-400 print-text-muted leading-relaxed max-w-2xl">
                      Das relationale PostgreSQL-Schema bei Supabase sorgt für maximale Konsistenz und ist strikt durch Row-Level Security (RLS) geschützt:
                    </p>

                    <div className="bg-[#18181B]/30 border border-white/[0.06] rounded-2xl p-6 space-y-5 print-bg-card print-border">
                      <div className="flex items-center gap-2.5 text-white font-mono text-[13px] font-semibold print-text-white">
                        <Server className="w-4.5 h-4.5 text-cyan-400 print-text-cyan" />
                        <span>Supabase Schema ER-Diagramm</span>
                      </div>
                      
                      <div className="overflow-hidden rounded-xl border border-white/10">
                        <img 
                          src="/IMG_20260804_153425.jpg" 
                          alt="Supabase Schema ER-Diagramm" 
                          className="w-full h-auto rounded-xl object-contain block"
                        />
                      </div>

                      <div className="pt-4 border-t border-white/[0.04] flex items-center gap-2.5 text-xs text-gray-400 print-text-muted print-border">
                        <Terminal className="w-4 h-4 text-cyan-400 print-text-cyan" />
                        <span>Integrierte PostgreSQL trigger functions garantieren referenzielle Integrität bei Lösch- & Verschiebeaktionen.</span>
                      </div>
                    </div>
                  </section>

                  {/* Section 5: Link */}
                  <section className="bg-gradient-to-r from-cyan-950/20 to-blue-950/20 p-7 rounded-2xl border border-cyan-500/10 flex flex-col sm:flex-row items-center justify-between gap-5 print-bg-card print-border print:p-6 mt-4">
                    <div className="text-left">
                      <h3 className="text-white font-bold text-[15px] mb-1.5 print-text-white font-display">Live-Demonstration & Website</h3>
                      <p className="text-[13px] text-gray-400 max-w-md print-text-muted leading-relaxed">
                        Das System ist voll einsatzbereit und weltweit erreichbar. Nutzen Sie die Zugangsdaten im Anschreiben für ein Live-Testing der Plattform.
                      </p>
                    </div>
                    
                    <a 
                      href="https://fontat.pages.dev" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-semibold px-5 py-3 rounded-full transition-all shrink-0 print-border print-text-white"
                    >
                      <span>fontat.pages.dev</span>
                      <ExternalLink className="w-4 h-4 text-cyan-400 print-text-cyan" />
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
