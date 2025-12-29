"use client"

import { motion } from "framer-motion"
import { Users, Award, Heart, Zap, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AboutPage() {
  const features = [
    {
      title: "Premium Quality",
      description: "We use only the finest materials to ensure your designs look and feel amazing."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Expert Team",
      description: "Our team of designers and fashion experts bring years of experience to every product."
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Award Winning",
      description: "Recognized globally for innovation and excellence in custom fashion."
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Customer First",
      description: "Your satisfaction is our priority. We're here to make your vision a reality."
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Fast Production",
      description: "Quick turnaround times without compromising on quality."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Quality Guarantee",
      description: "100% satisfaction guaranteed or your money back."
    }
  ]

  const stats = [
    { value: "10K+", label: "Custom Designs" },
    { value: "5K+", label: "Happy Customers" },
    { value: "500+", label: "Products" },
    { value: "50+", label: "Countries" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white pt-24">
      <div className="container mx-auto px-6 md:px-12 lg:px-24 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">
            About FashionHub
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Your destination for premium fashion and quality clothing since 2020
          </p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="text-center"
            >
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 text-lg">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Story Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto mb-24"
        >
          <div className="bg-white/90 backdrop-blur-sm border-2 border-rose-100 rounded-2xl p-12 shadow-xl">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
              <p>
                FashionHub was born from a simple idea: everyone deserves access to premium fashion that truly represents their style. 
                In 2020, we set out to revolutionize online fashion shopping by offering quality clothing for everyone.
              </p>
              <p>
                What started as a small boutique with a curated selection has grown into a global fashion platform serving thousands 
                of customers across 50+ countries. We carefully select each piece to ensure quality, style, and value.
              </p>
              <p>
                Today, we're proud to be your trusted fashion destination, combining the latest trends 
                with timeless style to deliver clothing that makes you look and feel amazing.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-24"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">
            Why Choose <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">FashionHub</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="bg-white/90 backdrop-blur-sm border-2 border-rose-100 rounded-2xl p-8 hover:bg-white hover:border-rose-300 hover:shadow-xl transition-all group"
              >
                {feature.icon && (
                  <div className="text-rose-500 mb-4 group-hover:scale-110 group-hover:text-rose-600 transition-all">
                    {feature.icon}
                  </div>
                )}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-center"
        >
          <div className="bg-gradient-to-br from-white to-rose-50/50 backdrop-blur-sm border-2 border-rose-100 rounded-3xl p-16 shadow-xl">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to Create Something Amazing?
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Join thousands of satisfied customers and start designing your unique style today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/studio">
                <Button className="h-14 px-10 bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 rounded-full text-lg font-medium shadow-lg">
                  Start Designing
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" className="h-14 px-10 border-2 border-rose-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 rounded-full text-lg font-medium">
                  Browse Products
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
