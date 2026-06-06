import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Image as ImageIcon, Loader2, Save, Info, ArrowUpCircle, AlertTriangle, Gift } from 'lucide-react';
import { createPortal } from 'react-dom';
import { NotificationSlide } from '../../types';
import { createNotification, uploadNotificationImage } from '../../services/notificationService';
import { useLanguage } from '../../contexts/LanguageContext';

const TypeOption = ({ selected, value, label, icon: Icon, onClick }: { selected: boolean, value: string, label: string, icon: any, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${selected ? 'bg-white/10 border-white/20' : 'bg-black/50 border-white/5 hover:bg-white/5 hover:border-white/10'}`}
  >
    <Icon className={`w-4 h-4 ${value === 'update' ? 'text-blue-400' : value === 'alert' ? 'text-amber-400' : value === 'promotion' ? 'text-purple-400' : 'text-green-400'}`} />
    <span className="text-sm font-medium text-white">{label}</span>
  </button>
);

export const AdminNotificationModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) => {
  const [type, setType] = useState('info');
  const [slides, setSlides] = useState<Partial<NotificationSlide>[]>([
      { id: Math.random().toString(), title: '', description: '', image_url: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { dir } = useLanguage();
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

  const handleAddSlide = () => {
    setSlides([...slides, { id: Math.random().toString(), title: '', description: '', image_url: '' }]);
  };

  const handleRemoveSlide = (id: string) => {
    if (slides.length > 1) {
       setSlides(slides.filter(s => s.id !== id));
    }
  };

  const handleChange = (id: string, field: keyof NotificationSlide, value: string) => {
    setSlides(slides.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleImageUpload = async (id: string, file: File) => {
    try {
        setUploadingImageId(id);
        const url = await uploadNotificationImage(file);
        handleChange(id, 'image_url', url);
    } catch (e) {
        console.error('Image upload failed', e);
        alert('Failed to upload image');
    } finally {
        setUploadingImageId(null);
    }
  };

  const handleSubmit = async () => {
      // Validate
      const isValid = slides.every(s => s.title && s.description);
      if (!isValid) return alert('يرجى ملء كافة العناوين والوصف للشرائح');

      setIsSubmitting(true);
      try {
          await createNotification(type, slides, null);
          alert('تم النشر بنجاح! 🚀');
          onSuccess();
          onClose();
      } catch (e: any) {
          console.error('Failed to create notification', e);
          alert(`فشل الإرسال: ${e.message}\n${e.details || ''}\n${e.hint || ''}`);
      } finally {
          setIsSubmitting(false);
      }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
      <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4" dir={dir}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        
        <motion.div 
          initial={{ y: "100%" }} 
          animate={{ y: 0 }} 
          exit={{ y: "100%" }} 
          transition={{ type: "spring", damping: 25, stiffness: 300 }} 
          className="bg-[#141414] border border-white/10 w-full sm:max-w-2xl mx-auto rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 relative z-10 shadow-2xl flex flex-col mt-auto min-h-[70vh] max-h-[90vh]"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">إشعار جديد</h2>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-white opacity-70" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6 space-y-6">
            {/* Notification Type */}
            <div>
              <label className="block text-sm text-white opacity-50 mb-3">نوع الإشعار</label>
              <div className="grid grid-cols-2 gap-2">
                 <TypeOption selected={type === 'update'} value="update" label="تحديث" icon={ArrowUpCircle} onClick={() => setType('update')} />
                 <TypeOption selected={type === 'info'} value="info" label="معلومة" icon={Info} onClick={() => setType('info')} />
                 <TypeOption selected={type === 'alert'} value="alert" label="تنبيه" icon={AlertTriangle} onClick={() => setType('alert')} />
                 <TypeOption selected={type === 'promotion'} value="promotion" label="ترويج" icon={Gift} onClick={() => setType('promotion')} />
              </div>
            </div>

            {/* Slides List */}
            <div className="space-y-4">
               {slides.map((slide, index) => (
                  <div key={slide.id} className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 relative group">
                     {slides.length > 1 && (
                         <button 
                           onClick={() => handleRemoveSlide(slide.id!)}
                           className="absolute top-4 right-4 rtl:left-4 rtl:right-auto p-1.5 text-red-400 bg-red-400/10 rounded-full hover:bg-red-400/20"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                     )}
                     <h3 className="font-bold text-white opacity-80 mb-4">الشريحة {index + 1}</h3>
                     
                     <div className="space-y-4">
                        <div>
                           <label className="block text-xs text-white opacity-50 mb-1">العنوان</label>
                           <input 
                              type="text" 
                              value={slide.title || ''} 
                              onChange={(e) => handleChange(slide.id!, 'title', e.target.value)}
                              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-white/30 outline-none"
                           />
                        </div>
                        <div>
                           <label className="block text-xs text-white opacity-50 mb-1">الوصف</label>
                           <textarea 
                              value={slide.description || ''} 
                              onChange={(e) => handleChange(slide.id!, 'description', e.target.value)}
                              rows={3}
                              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-white/30 outline-none custom-scrollbar"
                           />
                        </div>
                        <div>
                           <label className="block text-xs text-white opacity-50 mb-1">صورة الشريحة (اختياري)</label>
                           {slide.image_url ? (
                              <div className="relative w-full h-32 rounded-lg overflow-hidden group/img">
                                 <img src={slide.image_url} className="w-full h-full object-cover" />
                                 <button onClick={() => handleChange(slide.id!, 'image_url', '')} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-white font-medium text-sm">
                                    تغيير الصورة
                                 </button>
                              </div>
                           ) : (
                               <div onClick={() => fileInputRefs.current[slide.id!]?.click()} className="w-full h-24 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all">
                                  {uploadingImageId === slide.id ? (
                                      <Loader2 className="w-6 h-6 text-white opacity-50 animate-spin" />
                                  ) : (
                                      <>
                                        <ImageIcon className="w-6 h-6 text-white opacity-40 mb-2" />
                                        <span className="text-xs text-white opacity-50">اضغط لرفع صورة</span>
                                      </>
                                  )}
                                  <input 
                                     type="file" 
                                     accept="image/*" 
                                     className="hidden" 
                                     ref={(el) => { fileInputRefs.current[slide.id!] = el }}
                                     onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            handleImageUpload(slide.id!, e.target.files[0]);
                                        }
                                     }}
                                  />
                               </div>
                           )}
                        </div>
                     </div>
                  </div>
               ))}
            </div>

            <button onClick={handleAddSlide} className="w-full py-3 border border-dashed border-white/20 rounded-xl text-white opacity-60 hover:text-white hover:border-white/50 hover:bg-white/5 flex items-center justify-center gap-2 transition-all">
               <Plus className="w-4 h-4" />
               إضافة شريحة جديدة
            </button>

          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-white/10 mt-auto">
             <button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="w-full py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-gray-200 transition-colors"
             >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSubmitting ? 'جاري النشر...' : 'نشر الإشعار'}
             </button>
          </div>

        </motion.div>
      </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
