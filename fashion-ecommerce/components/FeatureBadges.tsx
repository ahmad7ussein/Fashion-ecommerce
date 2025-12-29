"use client"

import type { FC } from "react"
import { Droplets, ShieldCheck, Truck } from "lucide-react"

export const FeatureBadges: FC = () => {
  const features = [
    {
      icon: Droplets,
      label: "طباعة مقاومة",
      sublabel: "للماء",
    },
    {
      icon: ShieldCheck,
      label: "خامة عالية",
      sublabel: "الجودة",
    },
    {
      icon: Truck,
      label: "شحن وتوصيل",
      sublabel: "سريع",
    },
  ]

  return (
    <div className="flex justify-center gap-8 py-4">
      {features.map((feature, index) => (
        <div key={index} className="flex flex-col items-center gap-1 text-center">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
            <feature.icon className="w-5 h-5 text-secondary" />
          </div>
          <span className="text-xs font-medium text-foreground">{feature.label}</span>
          <span className="text-xs text-muted-foreground">{feature.sublabel}</span>
        </div>
      ))}
    </div>
  )
}
