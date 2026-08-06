"use client";

import { useEffect } from "react";
import { useLocale } from "@/i18n";
import { track } from "@/lib/analytics";

const TRACKED_SECTIONS = new Set([
  "hero",
  "aeo-answer-capsule",
  "benefits-authority",
  "inspection-form",
  "customer-reviews",
  "services-hub",
  "roofing-process",
  "roofing-faq",
  "about-wrs",
  "contact-info",
  "final-cta",
]);

const SOCIAL_HOSTS: Record<string, string> = {
  "facebook.com": "facebook",
  "www.facebook.com": "facebook",
  "instagram.com": "instagram",
  "www.instagram.com": "instagram",
};

const MAP_HOSTS = new Set([
  "maps.app.goo.gl",
  "goo.gl",
  "maps.google.com",
  "www.google.com",
]);

export function AnalyticsListener() {
  const { locale } = useLocale();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      const rawHref = anchor.getAttribute("href") ?? "";
      if (!rawHref) return;

      const location = anchor.dataset.trackLocation;
      const label = anchor.dataset.trackLabel;

      // Explicit override via data-track-event (used for internal nav links
      // that don't match any href-based branch below).
      if (anchor.dataset.trackEvent === "nav_click") {
        track("nav_click", {
          nav_target: anchor.dataset.trackTarget,
          location,
        });
        return;
      }

      // Phone: tel:
      if (rawHref.startsWith("tel:")) {
        track("phone_click", {
          phone_number: rawHref.replace(/^tel:/, "").replace(/\D/g, ""),
          location,
          locale,
        });
        return;
      }

      // CTA: in-page #inspection-form
      if (rawHref === "#inspection-form" || rawHref.endsWith("#inspection-form")) {
        track("cta_click", {
          cta_label: label,
          cta_target: "inspection-form",
          location,
        });
        return;
      }

      // Absolute URL handling — social, map, outbound
      let url: URL | null = null;
      try {
        url = new URL(anchor.href);
      } catch {
        return;
      }

      const host = url.hostname.toLowerCase();
      const sameHost = host === window.location.hostname.toLowerCase();

      const social = SOCIAL_HOSTS[host];
      if (social) {
        track("social_click", { social_platform: social, location });
        return;
      }

      if (MAP_HOSTS.has(host) && url.pathname.startsWith("/maps")) {
        track("map_click", { map_target: "directions", location });
        return;
      }
      if (host === "maps.app.goo.gl" || host === "goo.gl") {
        track("map_click", { map_target: "address", location });
        return;
      }

      if (!sameHost) {
        track("outbound_click", {
          link_url: anchor.href,
          link_domain: host,
          location,
        });
      }
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true } as EventListenerOptions);
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const seen = new Set<string>();
    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (!id || seen.has(id)) continue;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (timers.has(id)) continue;
            const timer = setTimeout(() => {
              if (!seen.has(id)) {
                seen.add(id);
                track("section_view", { section_id: id });
                observer.unobserve(entry.target);
              }
              timers.delete(id);
            }, 1000);
            timers.set(id, timer);
          } else {
            const t = timers.get(id);
            if (t) {
              clearTimeout(t);
              timers.delete(id);
            }
          }
        }
      },
      { threshold: [0.5] },
    );

    for (const id of TRACKED_SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => {
      for (const t of timers.values()) clearTimeout(t);
      observer.disconnect();
    };
  }, []);

  return null;
}
