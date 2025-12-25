"use client"

import React, { useState } from "react"

// Site-wide Logo component
// Place your logo file in fashion-ecommerce/public as logo.svg, logo.png or logo.jpg
// The component will try svg -> png -> jpg -> placeholder automatically.

type LogoProps = { className?: string; alt?: string }

function useLogoSource(initialHeight: number) {
  const [src, setSrc] = useState<string>("/logo.svg")

  const handleError = () => {
    setSrc((prev) => {
      if (prev === "/logo.svg") return "/logo.png"
      if (prev === "/logo.png") return "/logo.jpg"
      if (prev === "/logo.jpg") return "/logo.jpeg"
      return "/placeholder-logo.png"
    })
  }

  const height = initialHeight
  return { src, setSrc, handleError, height }
}

export function Logo({ className = "", alt = "FashionHub logo" }: LogoProps) {
  const { src, handleError } = useLogoSource(40)
  return (
    <img
      src={src}
      alt={alt}
      height={40}
      className={`h-10 w-auto ${className}`}
      decoding="async"
      onError={handleError}
    />
  )
}

export function LogoCompact({ className = "", alt = "FashionHub logo" }: LogoProps) {
  const { src, handleError } = useLogoSource(32)
  return (
    <img
      src={src}
      alt={alt}
      height={32}
      className={`h-8 w-auto ${className}`}
      decoding="async"
      onError={handleError}
    />
  )
}
