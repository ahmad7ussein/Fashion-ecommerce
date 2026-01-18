"use client";
import { useState } from "react";
import Script from "next/script";
import { ProfessionalNavbar } from "@/components/professional-navbar";
import "./try-on.css";

export default function TryOnPage() {
  const [holisticReady, setHolisticReady] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <ProfessionalNavbar />
      <div className="pt-28">
        <div className="try-on-scope" dir="rtl">
          <div className="page">
            <main className="main">
            <section className="hero">
              <div className="hero-text">
                <h1>تجربة الملابس الافتراضية لأول مرة</h1>
                <p>
                  استخدم كاميرا جهازك لتجربة الملابس بشكل مباشر. جرّب التصاميم
                  قبل الشراء وتأكد من المقاس والستايل المناسب لك.
                </p>

                <button id="startCameraBtn" className="btn-primary" type="button">
                  ابدأ تجربة الملابس
                </button>

                <p id="statusText" className="status-text">
                  الرجاء الضغط على زر التشغيل لبدء التجربة.
                </p>
              </div>

              <div className="hero-camera">
                <div className="camera-card">
                  <div className="camera-header">
                    <span className="camera-dot red"></span>
                    <span className="camera-dot yellow"></span>
                    <span className="camera-dot green"></span>
                    <span className="camera-title">تجربة الملابس</span>
                  </div>

                  <div className="camera-body">
                    <div className="camera-container">
                      <video id="video" autoPlay playsInline></video>
                      <canvas id="overlay"></canvas>
                    </div>
                  </div>
                </div>
              </div>

              <div className="store">
                <div className="store-header">
                  <h3>جرّب الملابس</h3>
                  <p className="store-sub">اختر التصميم المناسب لك من القائمة.</p>
                </div>

                <div className="garments-store" id="garmentsStore">
                  <button className="garment-card" type="button" data-garment="ss1">
                    <img src="/try-on/shirt1.png" alt="قميص قصير 1" />
                    <div className="garment-meta">
                      <div className="garment-name">قميص قصير</div>
                      <div className="garment-desc">قماش مريح</div>
                    </div>
                  </button>

                  <button className="garment-card" type="button" data-garment="ss2">
                    <img src="/try-on/shirt2.png" alt="قميص قصير 2" />
                    <div className="garment-meta">
                      <div className="garment-name">قميص قصير</div>
                      <div className="garment-desc">قماش مريح</div>
                    </div>
                  </button>

                  <button className="garment-card" type="button" data-garment="shirt_collar2">
                    <img src="/try-on/shirt_collar2.png" alt="قميص قصير مع ياقة 2" />
                    <div className="garment-meta">
                      <div className="garment-name">قميص قصير مع ياقة</div>
                      <div className="garment-desc">قماش مريح</div>
                    </div>
                  </button>

                  <button className="garment-card" type="button" data-garment="ss3">
                    <img src="/try-on/shirt3.png" alt="قميص قصير 3" />
                    <div className="garment-meta">
                      <div className="garment-name">قميص قصير</div>
                      <div className="garment-desc">قماش مريح</div>
                    </div>
                  </button>

                  <button className="garment-card" type="button" data-garment="ss4">
                    <img src="/try-on/shirt4.png" alt="قميص قصير 4" />
                    <div className="garment-meta">
                      <div className="garment-name">قميص قصير</div>
                      <div className="garment-desc">قماش مريح</div>
                    </div>
                  </button>

                  <button className="garment-card" type="button" data-garment="shirt_collar">
                    <img src="/try-on/shirt_collar.png" alt="قميص قصير مع ياقة" />
                    <div className="garment-meta">
                      <div className="garment-name">قميص قصير مع ياقة</div>
                      <div className="garment-desc">قماش مريح</div>
                    </div>
                  </button>

                  <button className="garment-card" type="button" data-garment="hoodie">
                    <img src="/try-on/hoodie.png" alt="هودي" />
                    <div className="garment-meta">
                      <div className="garment-name">هودي</div>
                      <div className="garment-desc">قماش مريح</div>
                    </div>
                  </button>

                  <button className="garment-card" type="button" data-garment="shirt">
                    <img src="/try-on/qamies.png" alt="قميص طويل 1" />
                    <div className="garment-meta">
                      <div className="garment-name">قميص طويل</div>
                      <div className="garment-desc">قماش مريح</div>
                    </div>
                  </button>

                  <button className="garment-card" type="button" data-garment="shirt2">
                    <img src="/try-on/qamies2.png" alt="قميص طويل 2" />
                    <div className="garment-meta">
                      <div className="garment-name">قميص طويل</div>
                      <div className="garment-desc">قماش مريح</div>
                    </div>
                  </button>

                  <button className="garment-card" type="button" data-garment="shirt3">
                    <img src="/try-on/qamies3.png" alt="قميص طويل 3" />
                    <div className="garment-meta">
                      <div className="garment-name">قميص طويل</div>
                      <div className="garment-desc">قماش مريح</div>
                    </div>
                  </button>

                  <button className="garment-card" type="button" data-garment="qamies_kom">
                    <img src="/try-on/qamies_kom.png" alt="قميص طويل بأكمام" />
                    <div className="garment-meta">
                      <div className="garment-name">قميص طويل بأكمام</div>
                      <div className="garment-desc">قماش مريح</div>
                    </div>
                  </button>

                  <button className="garment-card" type="button" data-garment="plain_short">
                    <img src="/try-on/plain_short.png" alt="قميص قصير" />
                    <div className="garment-meta">
                      <div className="garment-name">قميص قصير</div>
                      <div className="garment-desc">قماش مريح</div>
                    </div>
                  </button>
                </div>
              </div>
            </section>
          </main>

            <footer className="footer">
              <p>FashionHub</p>
            </footer>
          </div>
        </div>
    </div>
      <Script
        id="try-on-holistic"
        src="https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5/holistic.js"
        strategy="afterInteractive"
        onLoad={() => setHolisticReady(true)}
        crossOrigin="anonymous"
      />
      {holisticReady && (
        <Script id="try-on-script" src="/try-on/script.js" strategy="afterInteractive" />
      )}
    </div>
  );
}
