"use client";
import React, { useState } from "react";
function useLogoSource(initialHeight) {
    const [src, setSrc] = useState("/logo.png");
    const handleError = () => {
        setSrc((prev) => {
            if (prev === "/logo.png")
                return "/logo.svg";
            if (prev === "/logo.svg")
                return "/logo.jpg";
            if (prev === "/logo.jpg")
                return "/logo.jpeg";
            return "/placeholder-logo.png";
        });
    };
    const height = initialHeight;
    return { src, setSrc, handleError, height };
}
export function Logo({ className = "", alt = "FashionHub logo" }) {
    const { src, handleError } = useLogoSource(40);
    return (<img src={src} alt={alt} height={40} className={`h-10 w-auto dark:brightness-110 dark:contrast-125 dark:drop-shadow-[0_2px_8px_rgba(255,255,255,0.35)] ${className}`} decoding="async" onError={handleError}/>);
}
export function LogoCompact({ className = "", alt = "FashionHub logo" }) {
    const { src, handleError } = useLogoSource(32);
    return (<img src={src} alt={alt} height={32} className={`h-8 w-auto dark:brightness-110 dark:contrast-125 dark:drop-shadow-[0_2px_8px_rgba(255,255,255,0.35)] ${className}`} decoding="async" onError={handleError}/>);
}
