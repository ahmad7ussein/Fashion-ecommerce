"use client";
import { motion } from "framer-motion";
import { FileText, CheckCircle, AlertCircle, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/lib/language";
export default function TermsPage() {
    const { language } = useLanguage();
    const sections = [
        {
            icon: <CheckCircle className="h-6 w-6"/>,
            title: language === "ar" ? "1. قبول الشروط" : "1. Acceptance of Terms",
            content: language === "ar"
                ? "باستخدام موقع FashionHub وخدماتنا، أنت توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام موقعنا."
                : "By using FashionHub website and services, you agree to be bound by these terms and conditions. If you do not agree to any part of these terms, please do not use our website.",
        },
        {
            icon: <FileText className="h-6 w-6"/>,
            title: language === "ar" ? "2. استخدام الموقع" : "2. Use of Website",
            content: language === "ar"
                ? "يمكنك استخدام موقعنا للأغراض القانونية فقط. لا يجوز لك استخدام الموقع لأي غرض غير قانوني أو محظور، أو بطريقة قد تلحق الضرر أو تعطل الموقع."
                : "You may use our website for lawful purposes only. You may not use the website for any illegal or prohibited purpose, or in a way that may damage or disrupt the website.",
        },
        {
            icon: <Scale className="h-6 w-6"/>,
            title: language === "ar" ? "3. الطلبات والدفع" : "3. Orders and Payment",
            content: language === "ar"
                ? "جميع الطلبات تخضع للقبول من قبلنا. نحتفظ بالحق في رفض أو إلغاء أي طلب. يجب أن تكون جميع معلومات الدفع دقيقة وكاملة. الأسعار قابلة للتغيير دون إشعار مسبق."
                : "All orders are subject to acceptance by us. We reserve the right to refuse or cancel any order. All payment information must be accurate and complete. Prices are subject to change without prior notice.",
        },
        {
            icon: <AlertCircle className="h-6 w-6"/>,
            title: language === "ar" ? "4. المنتجات المخصصة" : "4. Custom Products",
            content: language === "ar"
                ? "المنتجات المخصصة غير قابلة للإرجاع إلا في حالة وجود عيب في التصنيع. أنت مسؤول عن التأكد من دقة التصميم قبل تأكيد الطلب. لا نتحمل مسؤولية الأخطاء الإملائية أو التصميمية التي لم يتم اكتشافها قبل التأكيد."
                : "Custom products are non-refundable except in case of manufacturing defects. You are responsible for ensuring design accuracy before confirming the order. We are not responsible for spelling or design errors not detected before confirmation.",
        },
        {
            icon: <CheckCircle className="h-6 w-6"/>,
            title: language === "ar" ? "5. الإرجاع والاستبدال" : "5. Returns and Exchanges",
            content: language === "ar"
                ? "يمكن إرجاع المنتجات العادية خلال 30 يوم من الاستلام بشرط أن تكون في حالتها الأصلية. المنتجات المخصصة غير قابلة للإرجاع إلا في حالة وجود عيب. يرجى مراجعة سياسة الإرجاع الكاملة على موقعنا."
                : "Regular products can be returned within 30 days of receipt provided they are in their original condition. Custom products are non-refundable except in case of defects. Please review our full return policy on our website.",
        },
        {
            icon: <FileText className="h-6 w-6"/>,
            title: language === "ar" ? "6. الملكية الفكرية" : "6. Intellectual Property",
            content: language === "ar"
                ? "جميع المحتويات على موقعنا، بما في ذلك النصوص، الرسومات، الشعارات، والصور، محمية بحقوق الطبع والنشر. لا يجوز نسخ أو استخدام أي محتوى دون إذن كتابي منا."
                : "All content on our website, including text, graphics, logos, and images, is protected by copyright. You may not copy or use any content without our written permission.",
        },
    ];
    return (<div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white pt-20 sm:pt-24">
      <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24 py-12 sm:py-16">
        
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-rose-100 rounded-full mb-4">
            <FileText className="h-8 w-8 text-rose-600"/>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 tracking-tight text-gray-900">
            {language === "ar" ? "شروط الخدمة" : "Terms of Service"}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            {language === "ar"
            ? "آخر تحديث: يناير 2025"
            : "Last Updated: January 2025"}
          </p>
        </motion.div>

        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="max-w-4xl mx-auto mb-12">
          <Card className="p-6 sm:p-8 bg-white border-2 border-gray-200 shadow-lg">
            <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
              {language === "ar"
            ? "يرجى قراءة شروط الخدمة هذه بعناية قبل استخدام موقع FashionHub. باستخدام موقعنا، أنت توافق على الالتزام بهذه الشروط."
            : "Please read these Terms of Service carefully before using FashionHub website. By using our website, you agree to be bound by these terms."}
            </p>
          </Card>
        </motion.div>

        
        <div className="max-w-4xl mx-auto space-y-6">
          {sections.map((section, index) => (<motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}>
              <Card className="p-6 sm:p-8 bg-white border-2 border-gray-200 hover:border-rose-300 transition-all shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-rose-100 rounded-lg text-rose-600 flex-shrink-0">
                    {section.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                      {section.title}
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>))}
        </div>

        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }} className="max-w-4xl mx-auto mt-12">
          <Card className="p-6 sm:p-8 bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-rose-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {language === "ar" ? "اتصل بنا" : "Contact Us"}
            </h3>
            <p className="text-gray-700 mb-4">
              {language === "ar"
            ? "إذا كان لديك أي أسئلة حول شروط الخدمة هذه، يرجى التواصل معنا:"
            : "If you have any questions about these Terms of Service, please contact us:"}
            </p>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>{language === "ar" ? "البريد الإلكتروني:" : "Email:"}</strong>{" "}
                <a href="mailto:legal@fashionhub.com" className="text-rose-600 hover:underline">
                  legal@fashionhub.com
                </a>
              </p>
              <p>
                <strong>{language === "ar" ? "الهاتف:" : "Phone:"}</strong> +1 (555) 123-4567
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>);
}
