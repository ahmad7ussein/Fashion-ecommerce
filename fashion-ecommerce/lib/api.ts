const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";
const DEFAULT_ANDROID_API_URL = "http://10.0.2.2:5000/api";
const ANDROID_API_URL =
  process.env.NEXT_PUBLIC_ANDROID_API_URL || DEFAULT_ANDROID_API_URL;
const FALLBACK_DEV_WEB_API_URL = "http://localhost:5000/api";
const WEB_API_PREFIX = "/api";

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
    if (ANDROID_API_URL) {
      return ANDROID_API_URL;
    }
    const safeApiUrl = ensureHttpsApiUrl(RAW_API_BASE_URL);
    return safeApiUrl || FALLBACK_DEV_WEB_API_URL;
  }

  return WEB_API_PREFIX;
};

export const API_BASE_URL = () => getApiBaseUrl();

export const getApiUrl = (path: string) => {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!base) {
    return normalizedPath;
  }
  if (base.endsWith("/") && normalizedPath.startsWith("/")) {
    return `${base.slice(0, -1)}${normalizedPath}`;
  }
  return `${base}${normalizedPath}`;
};

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
