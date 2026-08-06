"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale } from "@/i18n";

// Flip when the gallery section is unhidden in src/app/[locale]/page.tsx.
const GALLERY_ENABLED = false;

type JumpNavItem = {
  // Anchor target for the click — element scrolled into view.
  id: string;
  // Optional element observed by the scroll-spy. Defaults to `id` when
  // omitted. Use this when the click target lives partway inside a larger
  // section and you want the nav to highlight while anywhere in the section.
  spyId?: string;
  labelKey:
    | "whyUs"
    | "reviews"
    | "services"
    | "gallery"
    | "ourProcess"
    | "faqs"
    | "contactUs";
};

const ITEMS: JumpNavItem[] = [
  { id: "benefits-authority", labelKey: "whyUs" },
  { id: "customer-reviews", labelKey: "reviews" },
  { id: "services-hub", labelKey: "services" },
  { id: "recent-projects", labelKey: "gallery" },
  { id: "roofing-process", labelKey: "ourProcess" },
  { id: "roofing-faq", labelKey: "faqs" },
  { id: "contact-info", spyId: "contact-section", labelKey: "contactUs" },
];

type StickyNavCtx = {
  stuck: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
};

const Ctx = createContext<StickyNavCtx | null>(null);

export function useStickyNav() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Safe fallback if the provider isn't mounted — header stays in its
    // default (unstuck) state.
    return { stuck: false, sentinelRef: { current: null } as React.RefObject<HTMLDivElement | null> };
  }
  return ctx;
}

export function StickyNavProvider({ children }: { children: React.ReactNode }) {
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Watch the sentinel above the JumpNav. When it leaves the viewport (top),
  // the sticky JumpNav has docked under the header.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const readHeaderPx = () => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--header-height")
        .trim();
      const parsed = parseInt(raw, 10);
      return Number.isFinite(parsed) ? parsed : 65;
    };

    let observer: IntersectionObserver | null = null;

    const setup = () => {
      observer?.disconnect();
      const headerPx = readHeaderPx();
      observer = new IntersectionObserver(
        ([entry]) => {
          // Stuck once the sentinel has scrolled above the header line.
          // Comparing against headerPx (not 0) flips stuck the moment the
          // nav docks, instead of after another headerPx of scrolling.
          // Guarding on top < headerPx avoids the initial-mount false-positive
          // when the sentinel is still well below the viewport.
          const nowStuck =
            !entry.isIntersecting &&
            entry.boundingClientRect.top < headerPx;
          setStuck(nowStuck);
        },
        {
          rootMargin: `-${headerPx}px 0px 0px 0px`,
          threshold: 0,
        }
      );
      observer.observe(sentinel);
    };

    setup();
    // Re-setup on resize so the rootMargin tracks responsive header height.
    const onResize = () => setup();
    window.addEventListener("resize", onResize);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Mirror stuck state to <html data-sticky-stuck> so CSS variables for
  // --header-height and --jumpnav-height shrink in lockstep.
  useEffect(() => {
    document.documentElement.dataset.stickyStuck = stuck ? "true" : "false";
  }, [stuck]);

  const value = useMemo<StickyNavCtx>(() => ({ stuck, sentinelRef }), [stuck]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function JumpNav() {
  const { t } = useLocale();
  const { stuck, sentinelRef } = useStickyNav();
  const [activeId, setActiveId] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  // Click-lock so scroll-spy doesn't flip through sections during the
  // smooth-scroll the browser performs in response to the anchor click.
  const clickLockUntilRef = useRef(0);
  const clickLockTimerRef = useRef<number | null>(null);

  const items = useMemo(
    () => ITEMS.filter((it) => GALLERY_ENABLED || it.id !== "recent-projects"),
    []
  );

  // Scroll-spy: pick the topmost section whose top has crossed the dock line
  // (header + jumpnav) and whose bottom is still below it.
  useEffect(() => {
    // Each entry pairs the spy-watched element with the click `id` that
    // should light up when it's active. Letting these diverge means a nav
    // item can highlight while you're anywhere inside a larger section
    // even though clicking jumps to a specific anchor partway down.
    const sectionEntries = items
      .map((it) => {
        const el = document.getElementById(it.spyId ?? it.id);
        return el ? { id: it.id, el } : null;
      })
      .filter((x): x is { id: string; el: HTMLElement } => !!x);

    const computeActive = () => {
      // Click just happened — don't let scroll-spy fight the optimistic update.
      if (Date.now() < clickLockUntilRef.current) return;

      const headerPx = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue("--header-height")
          .trim() || "65",
        10
      );
      const navPx = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue("--jumpnav-height")
          .trim() || "56",
        10
      );
      // Must match scroll-margin-top in globals.css so the clicked target
      // is detected as active immediately after the smooth-scroll settles.
      const dockY = headerPx + navPx - 2;
      // Tolerance absorbs subpixel rounding + the moment right after a
      // click-scroll when the target's top is just shy of dockY.
      const tolerance = 16;

      let current: string | null = null;
      for (const { id, el } of sectionEntries) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= dockY + tolerance) {
          current = id;
        } else {
          // Entries are in DOM/scroll order — no later section can match.
          break;
        }
      }
      setActiveId(current);
    };

    const observer = new IntersectionObserver(computeActive, {
      rootMargin: "-20% 0px -40% 0px",
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });
    sectionEntries.forEach(({ el }) => observer.observe(el));

    // Initial compute (in case page loaded mid-section via deep-link).
    computeActive();
    window.addEventListener("scroll", computeActive, { passive: true });
    window.addEventListener("resize", computeActive);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", computeActive);
      window.removeEventListener("resize", computeActive);
    };
  }, [items]);

  // Auto-scroll active item into view on mobile (where the row scrolls).
  useEffect(() => {
    if (!activeId || !listRef.current) return;
    if (window.matchMedia("(min-width: 768px)").matches) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-jumpnav-id="${activeId}"]`
    );
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeId]);

  // Optimistic active update + lock scroll-spy until the smooth-scroll
  // actually settles. Long downward scrolls used to flicker because the
  // fixed-duration lock could expire mid-flight, briefly letting the spy
  // latch onto a section the page was passing through.
  // Analytics tracking happens via AnalyticsListener's click delegate which
  // reads the data-track-* attributes on the anchor.
  const handleClick = useCallback((id: string) => {
    setActiveId(id);
    // Generous upper bound — scrollend (or the fallback timer) releases early.
    clickLockUntilRef.current = Date.now() + 4000;
    if (clickLockTimerRef.current !== null) {
      window.clearTimeout(clickLockTimerRef.current);
      clickLockTimerRef.current = null;
    }

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      window.removeEventListener("scrollend", release);
      if (clickLockTimerRef.current !== null) {
        window.clearTimeout(clickLockTimerRef.current);
        clickLockTimerRef.current = null;
      }
      clickLockUntilRef.current = 0;
      window.dispatchEvent(new Event("scroll"));
    };

    // Prefer native scrollend (settles exactly when smooth-scroll ends).
    window.addEventListener("scrollend", release, { once: true });
    // Fallback for browsers without scrollend, or if no scroll happens.
    clickLockTimerRef.current = window.setTimeout(release, 1500);
  }, []);

  return (
    <>
      {/* Sentinel: tracked by StickyNavProvider's IntersectionObserver.
          Sits in document flow directly above the sticky nav so its top
          edge crossing the header line == "nav is now docked". */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />

      <nav
        aria-label={t.jumpnav.ariaLabel}
        data-stuck={stuck ? "true" : "false"}
        className="jumpnav sticky top-[var(--header-height)] z-40 bg-white border-b border-[var(--color-neutral-200)] transition-[top,padding,height] duration-200 ease-out"
      >
        <div className="relative">
          {/* Edge fade hints (mobile only) so users see there's more to scroll. */}
          <span
            aria-hidden="true"
            className="md:hidden pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent z-10"
          />
          <span
            aria-hidden="true"
            className="md:hidden pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent z-10"
          />

          <ul
            ref={listRef}
            className="flex items-center gap-6 px-8 scroll-pl-8 scroll-pr-8 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-none md:overflow-visible md:snap-none md:justify-center md:px-[var(--site-margin)] py-3 data-[stuck=true]:py-2 transition-[padding] duration-200 ease-out"
            data-stuck={stuck ? "true" : "false"}
          >
            {items.map((item) => {
              const isActive = activeId === item.id;
              return (
                <li key={item.id} className="snap-start flex-shrink-0">
                  <a
                    href={`#${item.id}`}
                    data-jumpnav-id={item.id}
                    data-track-event="nav_click"
                    data-track-target={item.id}
                    data-track-location="jumpnav"
                    aria-current={isActive ? "location" : undefined}
                    onClick={() => handleClick(item.id)}
                    className={`block whitespace-nowrap border-b-[2.5px] pb-1 -mb-[2.5px] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wrs-teal-on-light)] body-regular ${
                      isActive
                        ? "text-[var(--color-text-primary)] border-[var(--wrs-teal-on-light)] font-[700]"
                        : "text-[var(--color-text-primary)] border-transparent font-[500] hover:text-[var(--wrs-teal-on-light)]"
                    }`}
                  >
                    {t.jumpnav[item.labelKey]}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </>
  );
}
