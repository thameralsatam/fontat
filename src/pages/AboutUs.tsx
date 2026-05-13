import { Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { FadeSection } from '../components/FadeSection';

export const AboutUs = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto pt-32 px-4 pb-32" dir={isAr ? 'rtl' : 'ltr'}>
      <FadeSection>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <Info className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">
            {isAr ? 'من نحن – FONTAT' : 'About FONTAT'}
          </h1>
        </div>
      </FadeSection>

      <div className="space-y-8 text-white/80 leading-relaxed text-lg">
        <FadeSection delay={0.1}>
          <p>
            {isAr 
              ? <><strong>FONTAT</strong> ليست مجرد موقع لإدارة الخطوط، بل <strong className="font-bold text-white">مساحة رقمية</strong> تهدف إلى <strong className="font-bold text-white">تنظيم الإبداع</strong> وإعطائه شكلًا واضحًا وبسيطًا.</>
              : <><strong className="font-bold text-white">FONTAT</strong> is not just a platform for managing fonts, but a <strong className="font-bold text-white">digital space</strong> designed to organize creativity and present it in a clear and simple way.</>}
          </p>
        </FadeSection>

        <FadeSection delay={0.2}>
          <p>
            {isAr 
              ? <>تم تصميم المنصة لتمنح المستخدمين القدرة على <strong className="font-bold text-white">إدارة خطوطهم بسهولة</strong>، ولتمنح الاستوديوهات وسيلة احترافية لـ <strong className="font-bold text-white">عرض أعمالها</strong> من خلال معاينات منظمة وجذابة.</>
              : <>The platform is built to give users the ability to <strong className="font-bold text-white">manage their fonts with ease</strong>, and to give studios a professional way to <strong className="font-bold text-white">showcase their work</strong> through clean and visually appealing previews.</>}
          </p>
        </FadeSection>

        <FadeSection delay={0.3}>
          <div className="bg-white/5 p-8 rounded-3xl border border-white/10 mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              {isAr ? 'نؤمن بأن:' : 'We believe that:'}
            </h2>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                <span>{isAr ? <><strong className="font-bold text-white">البساطة</strong> لا تعني التقليل</> : <><strong className="font-bold text-white">Simplicity</strong> does not mean limitation</>}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                <span>{isAr ? <><strong className="font-bold text-white">الخصوصية</strong> لا يجب أن تكون خيارًا</> : <><strong className="font-bold text-white">Privacy</strong> should never be optional</>}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                <span>{isAr ? <><strong className="font-bold text-white">احترام حقوق المصممين</strong> هو أساس أي منصة ناجحة</> : <><strong className="font-bold text-white">Respecting designers’ rights</strong> is the foundation of any successful platform</>}</span>
              </li>
            </ul>
          </div>
        </FadeSection>
      </div>
    </div>
  );
};
