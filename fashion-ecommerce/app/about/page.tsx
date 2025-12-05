"use client"

import { motion } from "framer-motion"
import { Sparkles, Users, Award, Heart, Zap, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AboutPage() {
  const features = [
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "Premium Quality",
      description: "We use only the finest materials to ensure your designs look and feel amazing."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Expert Team",
      description: "Our team of designers and craftsmen bring years of experience to every product."
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
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black pt-24">
      <div className="container mx-auto px-6 md:px-12 lg:px-24 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            About StyleCraft
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
            Transforming your creative vision into wearable art since 2020
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
              <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-gray-400 text-lg">{stat.label}</div>
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
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12">
            <h2 className="text-4xl font-bold text-white mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
              <p>
                StyleCraft was born from a simple idea: everyone deserves to wear something that truly represents who they are. 
                In 2020, we set out to revolutionize the fashion industry by putting the power of design directly into your hands.
              </p>
              <p>
                What started as a small studio with a handful of products has grown into a global platform serving thousands 
                of customers across 50+ countries. Our AI-powered design studio makes it easy for anyone to create professional, 
                unique designs without any design experience.
              </p>
              <p>
                Today, we're proud to be at the forefront of the custom fashion movement, combining cutting-edge technology 
                with traditional craftsmanship to deliver products that exceed expectations.
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
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
            Why Choose StyleCraft
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 transition-all group"
              >
                <div className="text-white mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
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
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-3xl p-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Create Something Amazing?
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Join thousands of satisfied customers and start designing your unique style today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/studio">
                <Button className="h-14 px-10 bg-white text-black hover:bg-gray-200 rounded-full text-lg font-medium">
                  Start Designing
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" className="h-14 px-10 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 rounded-full text-lg font-medium">
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

