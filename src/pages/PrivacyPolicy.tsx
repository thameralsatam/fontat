import { Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { FadeSection } from '../components/FadeSection';

export const PrivacyPolicy = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto pt-32 px-4 pb-32" dir={isAr ? 'rtl' : 'ltr'}>
      <FadeSection>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">
            {isAr ? 'سياسة الخصوصية – FONTAT' : 'Privacy Policy – FONTAT'}
          </h1>
        </div>
      </FadeSection>

      <div className="space-y-8 text-white/80 leading-relaxed">
        <FadeSection delay={0.1}>
          <p className="text-lg text-white">
            {isAr 
              ? <>في <strong className="font-bold text-white">FONTAT</strong>، نؤمن أن <strong className="font-bold text-white">الخصوصية</strong> ليست مجرد خيار، بل <strong className="font-bold text-white">حق أساسي</strong> لكل مستخدم. نحن نتعامل مع بياناتك باحترام وشفافية، ونحرص على حمايتها قدر الإمكان.</>
              : <>At <strong className="font-bold text-white">FONTAT</strong>, we believe that <strong className="font-bold text-white">privacy</strong> is not just an option, but a <strong className="font-bold text-white">fundamental right</strong> for every user. We treat your data with respect and transparency, and we are committed to protecting it as much as possible.</>}
          </p>
        </FadeSection>

        <FadeSection delay={0.15}>
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              {isAr ? '1. المعلومات التي نجمعها' : '1. Information We Collect'}
            </h2>
            <p>{isAr ? 'نقوم بجمع الحد الأدنى من المعلومات اللازمة لتشغيل المنصة، مثل:' : 'We only collect the minimum information necessary to operate the platform, such as:'}</p>
            <ul className={`list-disc list-inside space-y-2 ${isAr ? 'mr-4' : 'ml-4'}`}>
              <li>{isAr ? 'البريد الإلكتروني لتسجيل الدخول' : 'Email address for account access'}</li>
              <li>{isAr ? 'كلمة المرور (بشكل مشفّر)' : 'Encrypted password'}</li>
              <li>{isAr ? 'الملفات التي تقوم برفعها (كالخطوط وصور المعاينة)' : 'Uploaded content (such as fonts and preview images)'}</li>
              <li>{isAr ? 'بعض البيانات التقنية (مثل نوع المتصفح وعنوان IP)' : 'Basic technical data (such as IP address and browser type)'}</li>
            </ul>
          </section>
        </FadeSection>

        <FadeSection delay={0.2}>
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              {isAr ? '2. كيف نستخدم هذه المعلومات' : '2. How We Use This Information'}
            </h2>
            <p>{isAr ? 'نستخدم بياناتك فقط من أجل:' : 'We use your data only to:'}</p>
            <ul className={`list-disc list-inside space-y-2 ${isAr ? 'mr-4' : 'ml-4'}`}>
              <li>{isAr ? 'إدارة حسابك' : 'Manage your account'}</li>
              <li>{isAr ? 'تمكينك من الوصول إلى ملفاتك' : 'Provide access to your uploaded files'}</li>
              <li>{isAr ? 'تحسين أداء الموقع وأمانه' : 'Improve the performance and security of the platform'}</li>
            </ul>
            <p>{isAr ? 'نحن لا نستخدم بياناتك لأي غرض غير ضروري.' : 'We do not use your data for any unnecessary purposes.'}</p>
          </section>
        </FadeSection>

        <FadeSection delay={0.25}>
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              {isAr ? '3. المحتوى الذي ترفعه' : '3. Uploaded Content'}
            </h2>
            <p>{isAr ? <>الملفات التي تقوم برفعها داخل حسابك <strong className="font-bold text-white">تبقى خاصة بك</strong>، ولا يتم عرضها للآخرين.</> : <>Files uploaded within your account <strong className="font-bold text-white">remain private</strong> and are not visible to others.</>}</p>
            <p>{isAr ? <>أما الملفات التي يتم رفعها في قسم "المختبر"، فهي <strong className="font-bold text-white">مؤقتة</strong>، ولا يتم حفظها بشكل دائم.</> : <>Files uploaded in the "Lab" section are <strong className="font-bold text-white">temporary</strong> and are not permanently stored.</>}</p>
            <p>{isAr ? <>نحن <strong className="font-bold text-white">لا نقوم بالاطلاع</strong> على ملفاتك أو تحليلها، إلا في حالات محدودة تفرضها الحاجة، مثل:</> : <>We <strong className="font-bold text-white">do not access</strong> or analyze your files, except in limited situations where it becomes necessary, such as:</>}</p>
            <ul className={`list-disc list-inside space-y-2 ${isAr ? 'mr-4' : 'ml-4'}`}>
              <li>{isAr ? 'معالجة مشكلة تقنية' : 'Resolving technical issues'}</li>
              <li>{isAr ? 'حماية النظام من إساءة الاستخدام' : 'Protecting the platform from misuse'}</li>
              <li>{isAr ? 'الاستجابة لطلبات قانونية أو شكاوى تتعلق بحقوق الملكية' : 'Responding to legal requests or copyright-related complaints'}</li>
            </ul>
          </section>
        </FadeSection>

        <FadeSection delay={0.3}>
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              {isAr ? '4. المسؤولية' : '4. Responsibility'}
            </h2>
            <p>{isAr ? <>أنت المسؤول <strong className="font-bold text-white">الكامل</strong> عن أي محتوى تقوم برفعه.</> : <>You are <strong className="font-bold text-white">fully responsible</strong> for any content you upload.</>}</p>
            <p>{isAr ? <>برفعك لأي ملف، فإنك تقر بأن لديك <strong className="font-bold text-white">الحق القانوني</strong> أو الترخيص لاستخدامه.</> : <>By uploading any file, you confirm that you have the <strong className="font-bold text-white">legal right</strong> or license to use it.</>}</p>
          </section>
        </FadeSection>

        <FadeSection delay={0.35}>
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              {isAr ? '5. حماية البيانات' : '5. Data Protection'}
            </h2>
            <p>{isAr ? <>نقوم باتخاذ إجراءات تقنية وتنظيمية مناسبة لحماية بياناتك. و<strong className="font-bold text-white">لا نقوم ببيعها</strong> أو مشاركتها مع أي طرف ثالث.</> : <>We take appropriate technical and organizational measures to protect your data. We <strong className="font-bold text-white">do not sell</strong> or share your data with any third party.</>}</p>
          </section>
        </FadeSection>

        <FadeSection delay={0.4}>
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              {isAr ? '6. حقوقك' : '6. Your Rights'}
            </h2>
            <p>{isAr ? 'يمكنك في أي وقت:' : 'At any time, you have the right to:'}</p>
            <ul className={`list-disc list-inside space-y-2 ${isAr ? 'mr-4' : 'ml-4'}`}>
              <li>{isAr ? 'الوصول إلى بياناتك' : 'Access your data'}</li>
              <li>{isAr ? 'تعديلها' : 'Modify it'}</li>
              <li>{isAr ? 'أو حذفها' : 'Or delete it'}</li>
            </ul>
          </section>
        </FadeSection>

        <FadeSection delay={0.45}>
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              {isAr ? '7. التواصل' : '7. Contact'}
            </h2>
            <p>{isAr ? 'لأي استفسار:' : 'For any inquiries:'}</p>
            <a href="mailto:support@fontat.net" className="text-cyan-400 hover:underline">support@fontat.net</a>
          </section>
        </FadeSection>
      </div>
    </div>
  );
};
