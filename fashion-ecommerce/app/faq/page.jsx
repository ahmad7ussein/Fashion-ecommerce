"use client";
import { motion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/language";
import { useState } from "react";
export default function FAQPage() {
    const { language } = useLanguage();
    const [openIndex, setOpenIndex] = useState(0);
    const faqs = [
        {
            question: language === "ar"
                ? "كيف يمكنني طلب منتج مخصص؟"
                : "How can I order a custom product?",
            answer: language === "ar"
                ? "يمكنك استخدام استوديو التصميم لإنشاء تصميمك المخصص. اختر المنتج، أضف النصوص والصور، ثم أضف التصميم إلى السلة وأكمل الطلب."
                : "You can use our Design Studio to create your custom design. Choose a product, add text and images, then add the design to your cart and complete your order.",
        },
        {
            question: language === "ar"
                ? "ما هي مدة التوصيل؟"
                : "What is the delivery time?",
            answer: language === "ar"
                ? "مدة التوصيل تتراوح بين 5-10 أيام عمل للمنتجات العادية، و 10-15 يوم عمل للمنتجات المخصصة."
                : "Delivery time ranges from 5-10 business days for regular products, and 10-15 business days for custom products.",
        },
        {
            question: language === "ar"
                ? "هل يمكنني إرجاع المنتج؟"
                : "Can I return a product?",
            answer: language === "ar"
                ? "نعم، يمكنك إرجاع المنتج خلال 30 يوم من تاريخ الاستلام. يجب أن يكون المنتج في حالته الأصلية وغير مستخدم."
                : "Yes, you can return a product within 30 days of receipt. The product must be in its original condition and unused.",
        },
        {
            question: language === "ar"
                ? "ما هي طرق الدفع المتاحة؟"
                : "What payment methods are available?",
            answer: language === "ar"
                ? "نقبل البطاقات الائتمانية (Visa, Mastercard, American Express)، PayPal، والدفع عند الاستلام في بعض المناطق."
                : "We accept credit cards (Visa, Mastercard, American Express), PayPal, and cash on delivery in some regions.",
        },
        {
            question: language === "ar"
                ? "كيف يمكنني تتبع طلبي؟"
                : "How can I track my order?",
            answer: language === "ar"
                ? "بعد إتمام الطلب، ستصلك رسالة بريد إلكتروني برقم التتبع. يمكنك استخدام هذا الرقم لتتبع طلبك على موقعنا."
                : "After completing your order, you'll receive an email with a tracking number. You can use this number to track your order on our website.",
        },
        {
            question: language === "ar"
                ? "هل المنتجات متوفرة بجميع المقاسات؟"
                : "Are products available in all sizes?",
            answer: language === "ar"
                ? "نعم، معظم منتجاتنا متوفرة بجميع المقاسات من XS إلى XXL. يمكنك اختيار المقاس عند إضافة المنتج إلى السلة."
                : "Yes, most of our products are available in all sizes from XS to XXL. You can select the size when adding the product to your cart.",
        },
        {
            question: language === "ar"
                ? "ما هي جودة المواد المستخدمة؟"
                : "What is the quality of materials used?",
            answer: language === "ar"
                ? "نستخدم فقط أجود المواد مثل القطن 100% والمواد عالية الجودة لضمان راحتك ومتانة المنتج."
                : "We use only premium materials like 100% cotton and high-quality fabrics to ensure your comfort and product durability.",
        },
        {
            question: language === "ar"
                ? "هل يمكنني تعديل التصميم بعد الطلب؟"
                : "Can I modify the design after ordering?",
            answer: language === "ar"
                ? "يمكنك تعديل التصميم قبل تأكيد الطلب. بعد التأكيد، يرجى التواصل معنا في أقرب وقت ممكن."
                : "You can modify the design before confirming the order. After confirmation, please contact us as soon as possible.",
        },
        {
            question: language === "ar"
                ? "هل تقدمون شحن مجاني؟"
                : "Do you offer free shipping?",
            answer: language === "ar"
                ? "نعم، نقدم شحن مجاني للطلبات التي تزيد عن 100 دولار في معظم المناطق."
                : "Yes, we offer free shipping for orders over $100 in most regions.",
        },
        {
            question: language === "ar"
                ? "كيف يمكنني التواصل مع خدمة العملاء؟"
                : "How can I contact customer service?",
            answer: language === "ar"
                ? "يمكنك التواصل معنا عبر البريد الإلكتروني support@fashionhub.com أو الهاتف 0592639933 أو استخدام نموذج الاتصال على موقعنا."
                : "You can contact us via email at support@fashionhub.com, phone at 0592639933, or use the contact form on our website.",
        },
    ];
    return (<div className="min-h-[100svh] bg-gradient-to-b from-white via-rose-50/30 to-white pt-20 sm:pt-24">
      <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24 py-10 sm:py-16">
        
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-rose-100 rounded-full mb-4">
            <HelpCircle className="h-8 w-8 text-rose-600"/>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 tracking-tight text-gray-900">
            {language === "ar" ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            {language === "ar"
            ? "ابحث عن إجابات لأسئلتك الشائعة حول منتجاتنا وخدماتنا."
            : "Find answers to common questions about our products and services."}
          </p>
        </motion.div>

        
        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (<motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
              <Card className={`overflow-hidden border-2 transition-all cursor-pointer ${openIndex === index
                ? "border-rose-500 shadow-lg"
                : "border-gray-200 hover:border-rose-300"}`} onClick={() => setOpenIndex(openIndex === index ? null : index)}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                        {faq.question}
                      </h3>
                      {openIndex === index && (<motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="text-gray-600 leading-relaxed">
                          {faq.answer}
                        </motion.p>)}
                    </div>
                    <ChevronDown className={`h-6 w-6 text-gray-400 flex-shrink-0 transition-transform ${openIndex === index ? "rotate-180" : ""}`}/>
                  </div>
                </CardContent>
              </Card>
            </motion.div>))}
        </div>

        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }} className="mt-12 text-center">
          <Card className="p-8 bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-rose-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {language === "ar" ? "لم تجد إجابتك؟" : "Still have questions?"}
            </h3>
            <p className="text-gray-600 mb-4">
              {language === "ar"
            ? "تواصل معنا وسنكون سعداء لمساعدتك"
            : "Contact us and we'll be happy to help"}
            </p>
            <a href="/contact" className="inline-block px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-semibold hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg shadow-rose-200">
              {language === "ar" ? "اتصل بنا" : "Contact Us"}
            </a>
          </Card>
        </motion.div>
      </div>
    </div>);
}
