"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useLanguage } from "@/lib/language";

const localSamples = {
  ar: "هذا اختبار عربي للتأكد من سلامة الترميز",
  en: "English sample to verify UTF-8 rendering",
};

export default function EncodingDiagnosticsPage() {
  const { language } = useLanguage();
  const [apiSample, setApiSample] = useState(null);
  const [apiError, setApiError] = useState("");
  const [clientInfo, setClientInfo] = useState({ lang: "", dir: "", userAgent: "" });

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        const response = await fetch(`${API_BASE_URL()}/diagnostics/encoding`, {
          cache: "no-store",
        });
        const data = await response.json();
        if (isMounted) {
          setApiSample(data);
        }
      } catch (error) {
        if (isMounted) {
          setApiError(error?.message || "Failed to fetch diagnostic sample");
        }
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    setClientInfo({
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    });
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">
          {language === "ar" ? "فحص ترميز العربية" : "Arabic Encoding Diagnostics"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {language === "ar"
            ? "تحقق من عرض النص العربي واتجاه الصفحة."
            : "Verify Arabic rendering and page direction."}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          {language === "ar" ? "عينة محلية" : "Local Sample"}
        </h2>
        <p className="mt-3 text-base">{localSamples[language]}</p>
      </div>

      <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          {language === "ar" ? "عينة من الـ API" : "API Sample"}
        </h2>
        {apiError ? (
          <p className="mt-3 text-sm text-destructive">{apiError}</p>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            <div>
              <span className="font-medium">message:</span> {apiSample?.message || "..."}
            </div>
            <div>
              <span className="font-medium">sample:</span> {apiSample?.sample || "..."}
            </div>
            <div>
              <span className="font-medium">rtlSample:</span> {apiSample?.rtlSample || "..."}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-background p-6 text-sm shadow-sm">
        <div>
          <span className="font-medium">lang:</span> {clientInfo.lang || "..."}
        </div>
        <div>
          <span className="font-medium">dir:</span> {clientInfo.dir || "..."}
        </div>
        <div>
          <span className="font-medium">userAgent:</span> {clientInfo.userAgent || "..."}
        </div>
      </div>
    </div>
  );
}
