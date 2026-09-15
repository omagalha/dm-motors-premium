const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID?.trim();

type MetaPixelParameter = string | number | boolean | string[] | undefined;

export type MetaPixelParameters = Record<string, MetaPixelParameter>;

type MetaPixelFunction = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  loaded?: boolean;
  push?: MetaPixelFunction;
  queue: unknown[][];
  version?: string;
};

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
  }
}

let initializedPixelId: string | undefined;

function loadMetaPixelScript() {
  if (document.querySelector('script[data-meta-pixel="true"]')) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  script.dataset.metaPixel = "true";
  document.head.appendChild(script);
}

export function initializeMetaPixel() {
  if (typeof window === "undefined" || !META_PIXEL_ID) return false;

  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
      } else {
        fbq.queue.push(args);
      }
    } as MetaPixelFunction;

    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;
  }

  loadMetaPixelScript();

  if (initializedPixelId !== META_PIXEL_ID) {
    window.fbq("init", META_PIXEL_ID);
    initializedPixelId = META_PIXEL_ID;
  }

  return true;
}

export function trackMetaEvent(eventName: string, parameters?: MetaPixelParameters) {
  if (!initializeMetaPixel()) return;

  if (parameters) {
    window.fbq?.("track", eventName, parameters);
    return;
  }

  window.fbq?.("track", eventName);
}
