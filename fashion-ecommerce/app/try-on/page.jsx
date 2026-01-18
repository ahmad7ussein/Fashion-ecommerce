"use client";
import { ProfessionalNavbar } from "@/components/professional-navbar";
import "./try-on.css";

export default function TryOnPage() {
  return (
    <div className="min-h-screen bg-white">
      <ProfessionalNavbar />
      <div className="try-on-iframe-shell">
        <iframe
          className="try-on-iframe"
          src="/try-on/index.html"
          title="Try On"
          allow="camera; microphone"
        />
      </div>
    </div>
  );
}
