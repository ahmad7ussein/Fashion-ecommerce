"use client"

import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/lib/language"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { createContactMessage } from "@/lib/api/contact"

export default function ContactPage() {
  const { language } = useLanguage()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await createContactMessage(formData)
      
      toast({
        title: language === "ar" ? "تم الإرسال بنجاح" : "Message Sent",
        description: language === "ar" 
          ? "شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن."
          : "Thank you for contacting us. We'll get back to you as soon as possible.",
      })
      setFormData({ name: "", email: "", subject: "", message: "" })
    } catch (error: any) {
      toast({
        title: language === "ar" ? "خطأ في الإرسال" : "Error",
        description: error.message || (language === "ar" 
          ? "حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى."
          : "An error occurred while sending the message. Please try again."),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactInfo = [
    {
      icon: <Mail className="h-6 w-6" />,
      title: language === "ar" ? "البريد الإلكتروني" : "Email",
      content: "support@fashionhub.com",
      link: "mailto:support@fashionhub.com",
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: language === "ar" ? "الهاتف" : "Phone",
      content: "+1 (555) 123-4567",
      link: "tel:+15551234567",
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: language === "ar" ? "العنوان" : "Address",
      content: language === "ar" 
        ? "123 شارع الموضة، الرياض، المملكة العربية السعودية"
        : "123 Fashion Street, Riyadh, Saudi Arabia",
      link: "#",
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
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 tracking-tight text-gray-900">
            {language === "ar" ? "تواصل معنا" : "Contact Us"}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            {language === "ar"
              ? "نحن هنا لمساعدتك. تواصل معنا لأي استفسار أو دعم."
              : "We're here to help. Get in touch with us for any inquiries or support."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            {contactInfo.map((info, index) => (
              <Card
                key={index}
                className="p-6 bg-white border-2 border-gray-200 hover:border-rose-300 transition-all shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-rose-100 rounded-lg text-rose-600">
                    {info.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{info.title}</h3>
                    {info.link !== "#" ? (
                      <a
                        href={info.link}
                        className="text-gray-600 hover:text-rose-600 transition-colors"
                      >
                        {info.content}
                      </a>
                    ) : (
                      <p className="text-gray-600">{info.content}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="p-6 sm:p-8 bg-white border-2 border-gray-200 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="h-6 w-6 text-rose-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {language === "ar" ? "أرسل لنا رسالة" : "Send us a Message"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {language === "ar" ? "الاسم" : "Name"}
                    </label>
                    <Input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full border-2 border-gray-200 focus:border-rose-300"
                      placeholder={language === "ar" ? "اسمك الكامل" : "Your full name"}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {language === "ar" ? "البريد الإلكتروني" : "Email"}
                    </label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full border-2 border-gray-200 focus:border-rose-300"
                      placeholder={language === "ar" ? "example@email.com" : "example@email.com"}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {language === "ar" ? "الموضوع" : "Subject"}
                  </label>
                  <Input
                    id="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full border-2 border-gray-200 focus:border-rose-300"
                    placeholder={language === "ar" ? "موضوع رسالتك" : "Message subject"}
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {language === "ar" ? "الرسالة" : "Message"}
                  </label>
                  <Textarea
                    id="message"
                    required
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full min-h-[150px] border-2 border-gray-200 focus:border-rose-300"
                    placeholder={language === "ar" ? "اكتب رسالتك هنا..." : "Write your message here..."}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 h-12 text-lg font-semibold shadow-lg shadow-rose-200"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      {language === "ar" ? "جاري الإرسال..." : "Sending..."}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      {language === "ar" ? "إرسال الرسالة" : "Send Message"}
                    </span>
                  )}
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

