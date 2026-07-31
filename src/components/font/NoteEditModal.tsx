import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, AlertCircle, Trash2 } from 'lucide-react';
import { Font } from '../../types';
import { formatFontName } from '../../utils/text';

interface NoteEditModalProps {
  noteEditModal: { isOpen: boolean; fontId: string | null; noteText: string };
  setNoteEditModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; fontId: string | null; noteText: string }>>;
  dbFonts: Font[];
  dir: 'rtl' | 'ltr' | 'auto';
  t: (key: string) => string;
  onSaveNote: (fontId: string, note: string) => Promise<void>;
}

export const NoteEditModal: React.FC<NoteEditModalProps> = ({
  noteEditModal,
  setNoteEditModal,
  dbFonts,
  dir,
  t,
  onSaveNote,
}) => {
  const [noteText, setNoteText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (noteEditModal.isOpen) {
      setNoteText(noteEditModal.noteText || '');
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [noteEditModal.isOpen, noteEditModal.noteText]);

  if (!noteEditModal.isOpen) return null;

  const currentFont = dbFonts.find(f => f.id === noteEditModal.fontId);

  const handleClose = () => {
    setNoteEditModal({ isOpen: false, fontId: null, noteText: '' });
    setNoteText('');
    setErrorMsg(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const trimmed = noteText.trim();
    if (trimmed.length > 100) {
      setErrorMsg(dir === 'rtl' ? 'الملاحظة يجب ألا تتجاوز 100 حرف' : 'Note cannot exceed 100 characters');
      return;
    }

    if (!noteEditModal.fontId) return;

    try {
      setIsSubmitting(true);
      await onSaveNote(noteEditModal.fontId, trimmed);
      handleClose();
    } catch (err: any) {
      console.error('Error saving note in modal:', err);
      const msg = err?.message || (dir === 'rtl' ? 'فشل حفظ الملاحظة. يرجى المحاولة لاحقاً.' : 'Failed to save note. Please try again.');
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!noteEditModal.fontId) return;
    setErrorMsg(null);
    try {
      setIsSubmitting(true);
      await onSaveNote(noteEditModal.fontId, '');
      handleClose();
    } catch (err: any) {
      console.error('Error deleting note in modal:', err);
      const msg = err?.message || (dir === 'rtl' ? 'فشل حذف الملاحظة.' : 'Failed to delete note.');
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 font-sans" dir={dir}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-[#0f0f0f]/95 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-5 z-10"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-white font-bold text-lg mb-1 font-display flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                <span>{dir === 'rtl' ? 'ملاحظة الخط' : 'Font Note'}</span>
              </h3>
              <p className="text-white/40 text-xs font-light">
                {dir === 'rtl' ? 'للخط:' : 'For font:'}{' '}
                <span className="text-amber-400 font-mono text-xs">
                  {formatFontName(currentFont?.name || '')}
                </span>
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="text-white/70 font-medium">
                  {dir === 'rtl' ? 'نص الملاحظة (حتى 100 حرف):' : 'Note text (up to 100 chars):'}
                </label>
                <span className={`font-mono text-[11px] ${noteText.length > 90 ? 'text-amber-400 font-bold' : 'text-white/40'}`}>
                  {noteText.length} / 100
                </span>
              </div>
              <div className="relative flex items-start bg-white/[0.03] border border-white/10 focus-within:border-amber-500/50 rounded-2xl p-3.5 transition-all duration-300">
                <textarea
                  value={noteText}
                  maxLength={100}
                  rows={3}
                  autoFocus
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length <= 100) {
                      setNoteText(val);
                      if (errorMsg) setErrorMsg(null);
                    } else {
                      setErrorMsg(dir === 'rtl' ? 'الملاحظة يجب ألا تتجاوز 100 حرف' : 'Note cannot exceed 100 characters');
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  className="w-full bg-transparent border-none p-0 text-white text-sm outline-none focus:ring-0 leading-relaxed placeholder:text-white/20 font-sans resize-none"
                  placeholder={dir === 'rtl' ? 'اكتب ملاحظتك هنا (مثال: للعنوان الرئيسي، ممتاز للتصاميم الحديثة...)' : 'Write your note here...'}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-white/5">
              {noteEditModal.noteText ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleDeleteNote}
                  className="px-3 py-2 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-all text-xs font-medium cursor-pointer flex items-center gap-1.5"
                  title={dir === 'rtl' ? 'حذف الملاحظة' : 'Delete note'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{dir === 'rtl' ? 'حذف الملاحظة' : 'Delete Note'}</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleClose}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 hover:text-white transition-all text-xs font-medium cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black transition-all text-xs font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-50"
                >
                  {isSubmitting
                    ? (dir === 'rtl' ? 'جاري الحفظ...' : 'Saving...')
                    : (dir === 'rtl' ? 'حفظ الملاحظة' : 'Save Note')}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
