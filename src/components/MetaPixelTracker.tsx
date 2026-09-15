import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { trackMetaEvent } from "@/services/metaPixel";

let lastTrackedPage: string | undefined;

function isWhatsAppLink(href: string) {
  try {
    const hostname = new URL(href, window.location.origin).hostname.toLowerCase();
    return (
      hostname === "wa.me" || hostname === "api.whatsapp.com" || hostname === "web.whatsapp.com"
    );
  } catch {
    return false;
  }
}

export function MetaPixelTracker() {
  const location = useLocation();
  const pageKey = `${location.pathname}${location.searchStr}`;
  const isAdminPage = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdminPage) {
      lastTrackedPage = undefined;
      return;
    }

    if (lastTrackedPage === pageKey) return;

    trackMetaEvent("PageView");
    lastTrackedPage = pageKey;
  }, [isAdminPage, pageKey]);

  useEffect(() => {
    if (isAdminPage) return;

    const trackWhatsAppClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link || !isWhatsAppLink(link.href)) return;

      trackMetaEvent("Contact", { contact_method: "WhatsApp" });
    };

    document.addEventListener("click", trackWhatsAppClick, true);
    return () => document.removeEventListener("click", trackWhatsAppClick, true);
  }, [isAdminPage]);

  return null;
}
