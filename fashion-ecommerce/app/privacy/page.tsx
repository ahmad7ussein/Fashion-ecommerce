"use client"

import { motion } from "framer-motion"
import { Shield, Lock, Eye, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/lib/language"

export default function PrivacyPage() {
  const { language } = useLanguage()

  const sections = [
    {
      icon: <FileText className="h-6 w-6" />,
      title: language === "ar" ? "1. المعلومات التي نجمعها" : "1. Information We Collect",
      content: language === "ar"
        ? "نجمع المعلومات التي تقدمها لنا مباشرة عند التسجيل، الطلب، أو التواصل معنا. تشمل هذه المعلومات الاسم، البريد الإلكتروني، العنوان، معلومات الدفع، وتفضيلاتك."
        : "We collect information you provide directly when registering, ordering, or contacting us. This includes name, email, address, payment information, and your preferences.",
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: language === "ar" ? "2. كيفية استخدام المعلومات" : "2. How We Use Information",
      content: language === "ar"
        ? "نستخدم معلوماتك لمعالجة الطلبات، تحسين خدماتنا، التواصل معك، وإرسال التحديثات والتسويق (بموافقتك)."
        : "We use your information to process orders, improve our services, communicate with you, and send updates and marketing (with your consent).",
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: language === "ar" ? "3. حماية المعلومات" : "3. Information Protection",
      content: language === "ar"
        ? "نستخدم تقنيات تشفير متقدمة لحماية معلوماتك. لا نشارك معلوماتك الشخصية مع أطراف ثالثة إلا كما هو موضح في هذه السياسة."
        : "We use advanced encryption technologies to protect your information. We do not share your personal information with third parties except as described in this policy.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: language === "ar" ? "4. حقوقك" : "4. Your Rights",
      content: language === "ar"
        ? "لديك الحق في الوصول، التعديل، الحذف، أو نقل بياناتك الشخصية. يمكنك أيضاً الاعتراض على معالجة بياناتك أو سحب موافقتك في أي وقت."
        : "You have the right to access, modify, delete, or transfer your personal data. You can also object to processing your data or withdraw your consent at any time.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white pt-20 sm:pt-24">
      <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24 py-12 sm:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center justify-center p-3 bg-rose-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-rose-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 tracking-tight text-gray-900">
            {language === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            {language === "ar"
              ? "آخر تحديث: يناير 2025"
              : "Last Updated: January 2025"}
          </p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <Card className="p-6 sm:p-8 bg-white border-2 border-gray-200 shadow-lg">
            <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
              {language === "ar"
                ? "في FashionHub، نحن ملتزمون بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك الشخصية عند استخدام موقعنا وخدماتنا."
                : "At FashionHub, we are committed to protecting your privacy. This privacy policy explains how we collect, use, and protect your personal information when using our website and services."}
            </p>
          </Card>
        </motion.div>

        {/* Sections */}
        <div className="max-w-4xl mx-auto space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
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
            </motion.div>
          ))}
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="max-w-4xl mx-auto mt-12"
        >
          <Card className="p-6 sm:p-8 bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-rose-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {language === "ar" ? "اتصل بنا" : "Contact Us"}
            </h3>
            <p className="text-gray-700 mb-4">
              {language === "ar"
                ? "إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى التواصل معنا:"
                : "If you have any questions about this privacy policy, please contact us:"}
            </p>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>{language === "ar" ? "البريد الإلكتروني:" : "Email:"}</strong>{" "}
                <a
                  href="mailto:privacy@fashionhub.com"
                  className="text-rose-600 hover:underline"
                >
                  privacy@fashionhub.com
                </a>
              </p>
              <p>
                <strong>{language === "ar" ? "الهاتف:" : "Phone:"}</strong> +1 (555) 123-4567
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

