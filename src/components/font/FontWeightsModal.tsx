import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Download, Trash2, Plus, Check, X } from 'lucide-react';
import { Font, FontWeight } from '../../types';
import { UploadTask } from '../../contexts/GlobalContext';
import { formatFontName } from '../../utils/text';

interface FontWeightsModalProps {
  weightsModal: { isOpen: boolean; parentFont: Font | null; weights: FontWeight[] };
  setWeightsModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; parentFont: Font | null; weights: FontWeight[] }>>;
  modalPulseFontId: string | null;
  dir: 'rtl' | 'ltr' | 'auto';
  t: (key: string) => string;
  handleDownload: (url: string, name: string) => void;
  getPreviewText: (id: string) => string;
  handlePreviewChange: (id: string, text: string) => void;
  uploadQueue: UploadTask[];
  uploadedSessionFontsRef: React.MutableRefObject<Record<string, { localUrl: string, taskId: string }>>;
  isOwner: boolean;
  setDeleteWeightModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; childFontId: string | null }>>;
  setUploadingWeightFor: React.Dispatch<React.SetStateAction<string | null>>;
  weightInputRef: React.RefObject<HTMLInputElement | null>;
  fontSize: number;
}

interface WeightRowProps {
  w: any;
  dir: 'rtl' | 'ltr' | 'auto';
  modalPulseFontId: string | null;
  handleDownload: (url: string, name: string) => void;
  isOwner: boolean;
  setDeleteWeightModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; childFontId: string | null }>>;
  getPreviewText: (id: string) => string;
  handlePreviewChange: (id: string, text: string) => void;
  fontSize: number;
}

const WeightRow: React.FC<WeightRowProps> = ({
  w,
  dir,
  modalPulseFontId,
  handleDownload,
  isOwner,
  setDeleteWeightModal,
  getPreviewText,
  handlePreviewChange,
  fontSize
}) => {
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);

  useEffect(() => {
    if (w.font?.metadata?.status === 'success') {
      const completedAt = w.font.metadata.completedAt || Date.now();
      const elapsed = Date.now() - completedAt;
      const remaining = 5000 - elapsed;
      if (remaining > 0) {
        setShowSuccessCheck(true);
        const timer = setTimeout(() => {
          setShowSuccessCheck(false);
        }, remaining);
        return () => clearTimeout(timer);
      } else {
        setShowSuccessCheck(false);
      }
    } else {
      setShowSuccessCheck(false);
    }
  }, [w.font?.metadata?.status, w.font?.metadata?.completedAt]);

  return (
    <div className={`bg-white/5 p-3 rounded-xl border flex flex-col gap-1.5 group/item transition-all duration-700 ${modalPulseFontId === w.font?.id ? 'border-white/30 shadow-lg ring-1 ring-white/50 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'border-white/5 ring-0 ring-transparent shadow-none'}`}>
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
               <span style={{ fontFamily: w.font?.name ? `"${w.font.name}", sans-serif` : 'sans-serif', fontSize: '14px', lineHeight: 1 }}>{dir === 'rtl' ? 'ع' : 'a'}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <p dir="ltr" className="text-white font-medium text-xs truncate max-w-[150px] text-left">{formatFontName(w.font?.name || '')}</p>
              {showSuccessCheck && <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 animate-pulse" />}
            </div>
          </div>
          <div className="flex items-center">
            {!w.font?.metadata?.isUploading && (
              <>
                <button onClick={(e) => { e.stopPropagation(); handleDownload(w.font?.download_url!, w.font?.name!); }} className="p-2 -mr-1 hover:bg-white/10 rounded-full text-white opacity-50 hover:text-white transition-colors cursor-pointer">
                  <Download className="w-3.5 h-3.5" />
                </button>
                {isOwner && !w.isOptimistic && (
                  <button onClick={(e) => { e.stopPropagation(); setDeleteWeightModal({ isOpen: true, childFontId: w.childFontId || null }); }} className="p-2 -mr-1 hover:bg-red-500/10 rounded-full text-white opacity-30 hover:text-red-400 transition-colors cursor-pointer" title="Delete Weight">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
       </div>
       <textarea 
         value={getPreviewText(w.font?.id || '')} 
         onChange={(e) => handlePreviewChange(w.font?.id || '', e.target.value)} 
         className="w-full bg-transparent border-none outline-none text-white font-light resize-none overflow-hidden whitespace-nowrap" 
         style={{ 
           fontFamily: w.font?.name ? `"${w.font.name}", sans-serif` : 'sans-serif', 
           fontSize: `${fontSize}px`, 
           lineHeight: '1.6', 
           height: `${fontSize * 1.6 + 12}px`,
           minHeight: `${fontSize * 1.6 + 12}px`,
           maxHeight: `${fontSize * 1.6 + 12}px`,
           paddingTop: '6px',
           paddingBottom: '6px',
           display: '-webkit-box', 
           WebkitLineClamp: 1, 
           WebkitBoxOrient: 'vertical', 
           whiteSpace: 'nowrap',
           fontFeatureSettings: 'normal', 
           fontVariantLigatures: 'normal' 
         }} 
       />
    </div>
  );
};

export const FontWeightsModal: React.FC<FontWeightsModalProps> = ({
  weightsModal,
  setWeightsModal,
  modalPulseFontId,
  dir,
  t,
  handleDownload,
  getPreviewText,
  handlePreviewChange,
  uploadQueue,
  uploadedSessionFontsRef,
  isOwner,
  setDeleteWeightModal,
  setUploadingWeightFor,
  weightInputRef,
  fontSize
}) => {
  return createPortal(
    <AnimatePresence>
      {weightsModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setWeightsModal(prev => ({ ...prev, isOpen: false }))} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="bg-[#141414] border border-white/10 w-full max-w-lg mx-auto rounded-t-3xl p-5 pb-8 sm:pb-5 relative z-10 shadow-2xl max-h-[85vh] flex flex-col mt-auto">
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-white leading-tight font-display">{formatFontName(weightsModal.parentFont?.name || '')}</h3>
                <span className="text-xs text-white opacity-40">{t('font.weights')}</span>
              </div>
              <button onClick={() => setWeightsModal(prev => ({ ...prev, isOpen: false }))} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
                <X className="w-5 h-5 text-white opacity-70" />
              </button>
            </div>

            <div className="overflow-y-auto pr-2 custom-scrollbar max-h-[420px] min-h-0 space-y-3">
              {/* Parent Font */}
              <div className={`bg-white/5 p-3 rounded-xl border flex flex-col gap-1.5 relative overflow-hidden transition-all duration-700 ${modalPulseFontId === weightsModal.parentFont?.id ? 'border-white/30 shadow-lg ring-1 ring-white/50 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'border-white/5 ring-0 ring-transparent shadow-none'}`}>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                          <span style={{ fontFamily: `"${weightsModal.parentFont?.name}", sans-serif`, fontSize: '14px', lineHeight: 1 }}>{dir === 'rtl' ? 'ع' : 'a'}</span>
                       </div>
                       <div>
                         <p className="text-white font-bold text-xs truncate max-w-[150px]">{formatFontName(weightsModal.parentFont?.name || '')}</p>
                       </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDownload(weightsModal.parentFont?.download_url!, weightsModal.parentFont?.name!); }} className="p-1.5 hover:bg-white/10 rounded-full text-white opacity-50 hover:text-white transition-colors cursor-pointer">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                 </div>
                 <textarea 
                   value={getPreviewText(weightsModal.parentFont?.id || '')} 
                   onChange={(e) => handlePreviewChange(weightsModal.parentFont?.id || '', e.target.value)} 
                   className="w-full bg-transparent border-none outline-none text-white font-light resize-none overflow-hidden whitespace-nowrap" 
                   style={{ 
                     fontFamily: weightsModal.parentFont?.name ? `"${weightsModal.parentFont?.name}", sans-serif` : 'sans-serif', 
                     fontSize: `${fontSize}px`, 
                     lineHeight: '1.6', 
                     height: `${fontSize * 1.6 + 12}px`,
                     minHeight: `${fontSize * 1.6 + 12}px`,
                     maxHeight: `${fontSize * 1.6 + 12}px`,
                     paddingTop: '6px',
                     paddingBottom: '6px',
                     display: '-webkit-box', 
                     WebkitLineClamp: 1, 
                     WebkitBoxOrient: 'vertical', 
                     whiteSpace: 'nowrap',
                     fontFeatureSettings: 'normal', 
                     fontVariantLigatures: 'normal' 
                   }} 
                 />
              </div>

              {/* Weights */}
              {(() => {
                const parentId = weightsModal.parentFont?.id;
                if (!parentId) return null;

                const relevantWeightTasks = uploadQueue.filter(task => task.parentFontId === parentId);
                
                const realWeights = weightsModal.weights.map(w => {
                   const childFont = w.child_font;
                   if (!childFont) return null;
                   const matchedTask = relevantWeightTasks.find(t => t.fontId === w.child_font_id || t.file.name === childFont.name);
                   if (matchedTask) {
                      return { 
                        id: w.id, 
                        font: { 
                          ...childFont, 
                          download_url: childFont.download_url || matchedTask.downloadUrl || '',
                          sessionLocalUrl: matchedTask.localUrl,
                          created_at: matchedTask.timestamp ? new Date(matchedTask.timestamp).toISOString() : childFont.created_at,
                          metadata: { ...childFont.metadata, taskId: matchedTask.id, status: matchedTask.status } 
                        }, 
                        isOptimistic: false, 
                        childFontId: w.child_font_id 
                      };
                   }

                   // Handle session cache for weights uploaded in the current session
                   const sessionFont = uploadedSessionFontsRef.current[w.child_font_id];
                   if (sessionFont) {
                      return {
                        id: w.id,
                        font: {
                          ...childFont,
                          sessionLocalUrl: sessionFont.localUrl,
                          metadata: { ...childFont.metadata, taskId: sessionFont.taskId, status: 'success' }
                        },
                        isOptimistic: false,
                        childFontId: w.child_font_id
                      };
                   }

                   return { id: w.id, font: childFont, isOptimistic: false, childFontId: w.child_font_id };
                }).filter(Boolean) as any[];

                const existingTaskIds = new Set(realWeights.map(rw => rw.font?.metadata?.taskId).filter(Boolean));
                
                const optimisticWeights = relevantWeightTasks
                  .filter(task => !existingTaskIds.has(task.id) && !realWeights.some(real => real.childFontId === task.fontId || real.font?.name === task.file.name))
                  .map(task => ({
                  id: task.id,
                  font: { 
                    id: task.fontId || task.id, 
                    name: task.file.name, 
                    download_url: task.downloadUrl || '', 
                    sessionLocalUrl: task.localUrl,
                    created_at: task.timestamp ? new Date(task.timestamp).toISOString() : new Date().toISOString(),
                    metadata: { isUploading: task.status !== 'success', status: task.status, taskId: task.id } 
                  },
                  isOptimistic: true, childFontId: task.fontId
                }));

                const allWeights = [...optimisticWeights, ...realWeights];
                allWeights.sort((a, b) => {
                   const dateA = new Date((a as any).created_at || a.font?.created_at || 0);
                   const dateB = new Date((b as any).created_at || b.font?.created_at || 0);
                   return dateA.getTime() - dateB.getTime();
                });

                if (allWeights.length === 0) return <p className="text-center text-white opacity-30 py-8 text-sm">{t('font.no_weights')}</p>;

                return allWeights.map((w) => (
                  <WeightRow
                    key={w.font?.metadata?.taskId || w.id}
                    w={w}
                    dir={dir}
                    modalPulseFontId={modalPulseFontId}
                    handleDownload={handleDownload}
                    isOwner={isOwner}
                    setDeleteWeightModal={setDeleteWeightModal}
                    getPreviewText={getPreviewText}
                    handlePreviewChange={handlePreviewChange}
                    fontSize={fontSize}
                  />
                ));
              })()}
            </div>
          
          {isOwner && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <button onClick={() => { if (weightsModal.parentFont) { setUploadingWeightFor(weightsModal.parentFont.id); weightInputRef.current?.click(); } }} className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer border-none outline-none">
                <Plus className="w-4 h-4" />{t('font.add_weight')}
              </button>
            </div>
          )}
        </motion.div>
      </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
