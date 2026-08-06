# Open Items — Weather Recovery Solutions Website

Tracked items needed to complete the site. Check off as resolved.

## SEO / Schema / Content

- [ ] **BBB sameAs URL**: Replace the generic `https://www.bbb.org/` in JSON-LD (`src/app/[locale]/layout.tsx`) with the actual Weather Recovery Solutions BBB profile URL. Also referenced in `sameAs` under the `RoofingContractor` schema.
- [ ] **Google review count**: The site and JSON-LD currently say "48" reviews. This number is hardcoded in the JSON-LD `aggregateRating.reviewCount` (layout.tsx) and in all 3 i18n files (hero.socialProof, hero.trust, about.trust). Update periodically as new reviews come in, or automate via Google Places API.
- [ ] **MyFloridaLicense sameAs URL**: Verify `https://www.myfloridalicense.com/LicenseDetail.asp?SID=&id=CCC1328244` still resolves correctly — the state site may have changed URL patterns.
- [ ] **Social media links**: Footer Facebook and Instagram links are placeholder `href="#"`. Replace with actual WRS social profile URLs.
- [ ] **Canonical domain**: The site currently deploys to `weather-recovery-solutions.vercel.app`. When a production domain is set (e.g., `weatherrecoverysolutions.com`), update `SITE_URL` in `layout.tsx` and all canonical/hreflang references. Larry should also configure www vs non-www redirect at the DNS/hosting level.

## Images & Media

- [ ] **Hero image**: Currently using a single static photo. Confirm this is the final approved hero image.
- [ ] **Service card images**: All 3 service cards show "Service Image Placeholder" divs. Need actual photos for Roof Repair, Roof Replacement, and Emergency services.
- [ ] **About section image**: Shows "Image Placeholder". Need a team/company photo.
- [ ] **Process section image**: Shows "Image Placeholder". Need a photo of the inspection process.
- [ ] **Gallery before/after images**: All gallery project cards show placeholder divs. Need actual before/after photos with the drag-to-compare slider implemented.
- [ ] **Map embed**: The NAP/contact section shows "Map Placeholder". Need a Google Maps embed or static map image of the Deerfield Beach location.

## Functionality

- [x] **Form submission backend**: Wired to Job Nimbus via `/api/contact` → `src/lib/jobnimbus.ts`. Creates a Contact on the **Retail / Lead** board and a linked **Lead** task assigned to **Andreia Medina**, which drives the bell-icon notification. Only `JOBNIMBUS_API_KEY` needs to be set in Vercel Production; record type, status, source, sales rep, and task type are hardcoded.
- [x] **Job Nimbus failure monitoring**: Sentry (Vercel Marketplace integration, free tier) captures any failed JN call — contact create, note create, or task create — with the lead's name/phone/city/service attached as Sentry context. Partial failures (contact created but task failed) are captured as warnings so the team can manually create the missing task and follow up. Email alert rule configured in Sentry to fire on any event tagged `integration: jobnimbus`.
- [ ] **Sentry alert review cadence**: Review Sentry alerts and dashboard weekly until JN sync is confirmed reliable. If recurring failure modes show up, consider adding retry logic in `src/lib/jobnimbus.ts`.
- [ ] **Gallery slider**: The before/after comparison slider in the gallery section is not implemented — just placeholder UI. Need to add an interactive image comparison component.
- [ ] **Mobile menu / hamburger**: No mobile navigation menu exists. The navbar only shows language switcher + phone number. Consider whether a hamburger menu is needed for section navigation.
- [ ] **Scroll-to-section**: The secondary CTA button ("Request Free Inspection") and various `href="#inspection-form"` links reference `#inspection-form` but the form section ID is `#request-inspection`. Either rename the section ID or update the anchor links.

## Content & Copy

- [ ] **Privacy policy page**: Footer links to `/{locale}/privacy-policy` but this page does not exist yet.
- [ ] **Portuguese FAQ #1 missing bold markers**: The first PT FAQ answer in `pt.ts` does not use `**bold**` markers like the EN and ES versions do. Minor consistency issue.

## Infrastructure

- [ ] **robots.txt**: No `robots.txt` file exists. Should add one that references the sitemap and allows all crawlers.
- [ ] **Open Graph image**: No `og:image` is set in the metadata. Should add a branded social sharing image (1200x630px recommended).
- [ ] **Favicon / app icons**: Verify favicon and Apple touch icons are set and match the WRS brand.
