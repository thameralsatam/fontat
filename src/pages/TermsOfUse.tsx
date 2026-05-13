import { FileText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { FadeSection } from '../components/FadeSection';

export const TermsOfUse = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto pt-32 px-4 pb-32" dir={isAr ? 'rtl' : 'ltr'}>
      <FadeSection>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">
            {isAr ? 'شروط الاستخدام – FONTAT' : 'Terms of Service – FONTAT'}
          </h1>
        </div>
      </FadeSection>

      <div className="space-y-8 text-white/80 leading-relaxed">
        <FadeSection delay={0.1}>
          <p className="text-lg text-white">
            {isAr 
              ? <>باستخدامك لمنصة <strong className="font-bold text-white">FONTAT</strong>، فإنك توافق على مجموعة من القواعد التي تهدف إلى الحفاظ على بيئة <strong className="font-bold text-white">آمنة وعادلة</strong> للجميع.</>
              : <>By using <strong className="font-bold text-white">FONTAT</strong>, you agree to a set of rules designed to maintain a <strong className="font-bold text-white">safe and fair</strong> environment for everyone.</>}
          </p>
        </FadeSection>

        <FadeSection delay={0.15}>
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              {isAr ? '1. الحسابات' : '1. Accounts'}
            </h2>
            <p>{isAr ? <>أنت مسؤول عن <strong className="font-bold text-white">حماية حسابك</strong> والحفاظ على بيانات تسجيل الدخول الخاصة بك.</> : <>You are responsible for <strong className="font-bold text-white">maintaining the security</strong> of your account and your login credentials.</>}</p>
          </section>
        </FadeSection>

        <FadeSection delay={0.2}>
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              {isAr ? '2. الاستخدام المقبول' : '2. Acceptable Use'}
            </h2>
            <p>{isAr ? <>يجب استخدام المنصة بطريقة <strong className="font-bold text-white">قانونية وأخلاقية</strong>.</> : <>The platform must be used in a <strong className="font-bold text-white">lawful and ethical</strong> manner.</>}</p>
            <p>{isAr ? <>و<strong className="font-bold text-white">لا يُسمح</strong> برفع أي محتوى:</> : <>You are <strong className="font-bold text-white">not allowed</strong> to upload any content that:</>}</p>
            <ul className={`list-disc list-inside space-y-2 ${isAr ? 'mr-4' : 'ml-4'}`}>
              <li>{isAr ? <>ينتهك <strong className="font-bold text-white">حقوق الملكية</strong> أو التراخيص</> : <>Violates <strong className="font-bold text-white">copyright</strong> or licensing rights</>}</li>
              <li>{isAr ? <>أو يحتوي على مواد <strong className="font-bold text-white">غير قانونية</strong> أو ضارة</> : <>Is <strong className="font-bold text-white">illegal</strong> or harmful</>}</li>
            </ul>
          </section>
        </FadeSection>

        <FadeSection delay={0.25}>
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              {isAr ? '3. الخطوط والتراخيص' : '3. Fonts and Licensing'}
            </h2>
            <p>{isAr ? <>تتيح المنصة رفع الخطوط <strong className="font-bold text-white">المجانية والمدفوعة</strong>.</> : <>The platform allows uploading both free and <strong className="font-bold text-white">licensed fonts</strong>.</>}</p>
            <p>{isAr ? <>وعند رفع أي ملف، فإنك تؤكد أنك <strong className="font-bold text-white">تملكه</strong> أو تمتلك <strong className="font-bold text-white">ترخيصًا</strong> لاستخدامه.</> : <>By uploading any file, you confirm that you <strong className="font-bold text-white">own it</strong> or have a <strong className="font-bold text-white">valid license</strong> to use it.</>}</p>
            <p>{isAr ? <>ولا تقوم FONTAT <strong className="font-bold text-white">بالتحقق</strong> من هذه التراخيص.</> : <>FONTAT <strong className="font-bold text-white">does not verify</strong> these licenses.</>}</p>
          </section>
        </FadeSection>

        <FadeSection delay={0.3}>
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              {isAr ? '4. مسؤولية المحتوى' : '4. Content Responsibility'}
            </h2>
            <p>{isAr ? <>جميع الملفات التي يتم رفعها تقع مسؤوليتها بالكامل على <strong className="font-bold text-white">المستخدم</strong>.</> : <>All uploaded content is the <strong className="font-bold text-white">sole responsibility</strong> of the user.</>}</p>
          </section>
        </FadeSection>

        <FadeSection delay={0.35}>
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              {isAr ? '5. خصوصية الملفات' : '5. File Privacy'}
            </h2>
            <p>{isAr ? <>الملفات داخل الحسابات <strong className="font-bold text-white">خاصة</strong>، ولا يتم مشاركتها بشكل عام.</> : <>Files within user accounts are <strong className="font-bold text-white">private</strong> and are not publicly shared.</>}</p>
          </section>
        </FadeSection>

        <FadeSection delay={0.4}>
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              {isAr ? '6. إدارة الحسابات' : '6. Account Management'}
            </h2>
            <p>{isAr ? <>يحق لنا <strong className="font-bold text-white">إيقاف أو حذف</strong> أي حساب يخالف هذه الشروط، وذلك للحفاظ على استقرار المنصة وسلامة المستخدمين.</> : <>We reserve the right to <strong className="font-bold text-white">suspend or remove</strong> any account that violates these terms, in order to maintain the stability of the platform and the safety of its users.</>}</p>
          </section>
        </FadeSection>

        <FadeSection delay={0.45}>
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              {isAr ? '7. توفر الخدمة' : '7. Service Availability'}
            </h2>
            <p>{isAr ? 'نسعى لتقديم خدمة مستقرة، لكننا لا نضمن خلوها من الانقطاع أو التحديثات المفاجئة.' : 'We strive to provide a stable service, but we do not guarantee uninterrupted availability and may update or modify the platform at any time.'}</p>
          </section>
        </FadeSection>
      </div>
    </div>
  );
};
