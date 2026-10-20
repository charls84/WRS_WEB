import { WINDOW_OPTIONS, type WindowDays } from "@/lib/config";
import { getDashboard } from "@/lib/dashboard";
import { formatRange } from "@/lib/periods";
import { Connections, Scorecard, SourceBlock } from "@/components/sections";

export const dynamic = "force-dynamic";
// PageSpeed and the site crawl can take a while on a cold cache.
export const maxDuration = 120;

function parseWindow(w: string | undefined): WindowDays {
  const n = Number(w);
  return (WINDOW_OPTIONS as readonly number[]).includes(n) ? (n as WindowDays) : 90;
}

const updated = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" });

export default async function Page({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const days = parseWindow((await searchParams).w);
  const data = await getDashboard(days);
  const s = data.sections;

  return (
    <>
      <header className="topbar">
        <div className="wrap">
          {/* eslint-disable-next-line @next/next/no-img-element -- brand SVG must render exactly as supplied */}
          <img className="logo logo--ink" src="/doux-wordmark-ink.svg" alt="DOUX.WORK" width={175} height={20} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo logo--bone" src="/doux-wordmark-bone.svg" alt="DOUX.WORK" width={175} height={20} />
          <span className="label">Client · Weather Recovery Solutions</span>
        </div>
      </header>

      {data.sample && (
        <div className="sample-band">
          <div className="wrap">
            <span className="label">Sample data for layout review. These are not Weather Recovery Solutions figures.</span>
          </div>
        </div>
      )}

      <main className="wrap">
        <section className="hero" aria-labelledby="h-hero">
          <span className="label">DOUX.WORK · WRS growth dashboard</span>
          <h1 className="display" id="h-hero">
            From baseline to <span className="accent">today.</span>
          </h1>
          <div className="hero-meta">
            <div className="periods">
              <div className="period">
                <span className="label">Baseline window</span>
                <span className="period-value num">{formatRange(data.window.baseline)}</span>
              </div>
              <div className="period">
                <span className="label">Current window</span>
                <span className="period-value num">{formatRange(data.window.current)}</span>
              </div>
            </div>
            <nav className="segmented" aria-label="Comparison window">
              {WINDOW_OPTIONS.map((w) => (
                <a key={w} href={`?w=${w}`} aria-current={w === days ? "page" : undefined}>
                  {w} days
                </a>
              ))}
            </nav>
          </div>
          {data.window.overlapDays > 0 && (
            <div className="notice">
              <span className="label">Windows overlap</span>
              <p>
                The baseline and current windows share {data.window.overlapDays} days, so this view understates the change. Use a shorter window
                for a clean before-and-after.
              </p>
            </div>
          )}
          {data.window.baselineIsFallback && (
            <div className="notice">
              <span className="label">Baseline date not set</span>
              <p>
                Showing the oldest period Search Console still keeps. Set <code>baselineStart</code> in <code>data/baseline.json</code> to the first day of
                the period before DXW work began.
              </p>
            </div>
          )}
        </section>

        <section className="section" aria-labelledby="h-score">
          <div className="section-head">
            <div className="titles">
              <span className="label">Scorecard</span>
              <h2 className="display" id="h-score">
                Six areas, <span className="accent">one view.</span>
              </h2>
              <p className="section-sub">
                Each row compares the same number of days before DXW and now. A question mark means the source is not connected yet or has no data
                that far back. Nothing here is estimated.
              </p>
            </div>
          </div>
          <Scorecard areas={data.areas} />
        </section>

        <SourceBlock eyebrow="Search visibility · Google Search Console" title="Who finds WRS on Google" section={s.gsc} />
        <SourceBlock eyebrow="Website and leads · Google Analytics 4" title="What visitors do on the site" section={s.ga4} />
        <SourceBlock eyebrow="Local presence · Google Business Profile" title="Calls and visits from Maps" section={s.gbp} />
        <SourceBlock eyebrow="Reputation · Google reviews" title="Local trust" section={s.reviews} />
        <SourceBlock eyebrow="Follow-up · JobNimbus" title="From lead to job" section={s.jobnimbus} />
        <SourceBlock eyebrow="Technical · PageSpeed Insights" title="Mobile speed" section={s.pagespeed} />
        <SourceBlock eyebrow="Technical · Site crawl" title="Indexing and tracking coverage" section={s.site} />

        <section className="section" aria-labelledby="h-conn">
          <div className="section-head">
            <div className="titles">
              <span className="label">Connections</span>
              <h2 className="display" id="h-conn">
                What updates <span className="accent">on its own.</span>
              </h2>
              <p className="section-sub">Live sources refresh every six hours. Snapshot sources are saved once a day so growth shows over time.</p>
            </div>
          </div>
          <Connections sections={[s.ga4, s.gsc, s.gbp, s.reviews, s.jobnimbus, s.pagespeed, s.site]} />
        </section>
      </main>

      <footer className="footer">
        <div className="wrap">
          <span className="label">DOUX.WORK · Designing experiences. Connecting systems.</span>
          <span className="label">Generated {updated.format(new Date(data.generatedAt))} ET</span>
        </div>
      </footer>
    </>
  );
}
