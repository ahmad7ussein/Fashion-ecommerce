const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "";
const ANDROID_API_URL = process.env.NEXT_PUBLIC_ANDROID_API_URL || "";
const USE_PROXY = process.env.NEXT_PUBLIC_USE_PROXY === "true";
const FALLBACK_DEV_WEB_API_URL = "http://localhost:5000/api";

const resolveIsNative = () => {
  if (typeof window === "undefined") {
    return false;
  }
  const protocol = window.location?.protocol;
  if (protocol === "capacitor:" || protocol === "ionic:") {
    return true;
  }
  const cap = (window as Window & {
    Capacitor?: { isNativePlatform?: () => boolean };
  }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
};

const isHttpsPage = () =>
  typeof window !== "undefined" && window.location?.protocol === "https:";

const isProduction = () => process.env.NODE_ENV === "production";

const isHttpUrl = (value: string) => value.startsWith("http://");

const ensureHttpsApiUrl = (value: string) => {
  if (!value) {
    return value;
  }
  if (isHttpUrl(value)) {
    if (isHttpsPage() || isProduction()) {
      console.error("[API] Insecure API URL blocked on HTTPS page:", value);
      return "";
    }
    console.warn("[API] Insecure API URL in development:", value);
  }
  return value;
};

export const getApiBaseUrl = () => {
  if (resolveIsNative()) {
    return ANDROID_API_URL || RAW_API_BASE_URL || FALLBACK_DEV_WEB_API_URL;
  }

  if (USE_PROXY) {
    return "/api";
  }

  const safeApiUrl = ensureHttpsApiUrl(RAW_API_BASE_URL);
  if (safeApiUrl) {
    return safeApiUrl;
  }

  if (isHttpsPage() || isProduction()) {
    return "/api";
  }

  return FALLBACK_DEV_WEB_API_URL;
};

export const API_BASE_URL = () => getApiBaseUrl();

const CLOUDINARY_HTTP_PREFIX = "http://res.cloudinary.com/";
const CLOUDINARY_HTTPS_PREFIX = "https://res.cloudinary.com/";

export const sanitizeExternalUrl = (value: string) => {
  if (!value) {
    return "";
  }
  if (value.startsWith(CLOUDINARY_HTTP_PREFIX)) {
    if (!isProduction()) {
      console.warn("[Assets] Upgrading Cloudinary URL to HTTPS:", value);
    }
    return CLOUDINARY_HTTPS_PREFIX + value.slice(CLOUDINARY_HTTP_PREFIX.length);
  }
  if (value.startsWith("http://")) {
    if (isHttpsPage() || isProduction()) {
      console.error("[Assets] Insecure asset URL blocked:", value);
      return "";
    }
    console.warn("[Assets] Insecure asset URL in development:", value);
  }
  return value;
};
