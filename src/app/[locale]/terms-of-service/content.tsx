import { SiteFooter } from "@/components/PageSections";
import { SiteHeader } from "@/components/PageSections.client";
import type { Translations, Locale } from "@/i18n";

type TermsSection = {
  heading: string;
  body?: string;
  before?: string;
  bullets?: readonly string[];
  after?: string;
};

export function TermsOfServiceContent({
  locale,
  t,
  reviewCount,
  reviewRating,
}: {
  locale: Locale;
  t: Translations;
  reviewCount: number;
  reviewRating: number | null;
}) {
  const { terms } = t;
  const sections = terms.sections as readonly TermsSection[];

  return (
    <div className="font-jakarta min-h-screen bg-white flex flex-col">
      <SiteHeader />

      <main className="pt-[65px] md:pt-[73px] xl:pt-[101px] flex-1">
        <section
          id="terms-of-service"
          aria-labelledby="terms-heading"
          className="bg-white py-[var(--section-py)] px-[var(--site-margin)]"
        >
          <div className="max-w-[1200px] mx-auto flex flex-col gap-[var(--gap-content)]">
            {/* HeadingBlock */}
            <header className="flex flex-col gap-[var(--gap-heading)]">
              <h1
                id="terms-heading"
                className="h2 text-[#001416] text-center"
              >
                {terms.heading}
              </h1>
              <p className="body-large text-[#001416] text-center">
                {terms.effectiveDate}
                <br />
                <br />
                {terms.intro}
              </p>
            </header>

            {/* Sections (1–7 data-driven + 8 Contact) */}
            <div className="py-[var(--gap-content)]">
              {sections.map((section, i) => (
                <section
                  key={i}
                  className="border-b border-[var(--divider-color)] flex flex-col gap-3 py-[var(--gap-content)]"
                >
                  <h2 className="h3 text-[#001416]">{section.heading}</h2>
                  <div className="body-regular text-[#001416] space-y-0">
                    {section.body && <p>{section.body}</p>}
                    {section.before && <p>{section.before}</p>}
                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="list-disc pl-6">
                        {section.bullets.map((item, j) => (
                          <li key={j}>{item}</li>
                        ))}
                      </ul>
                    )}
                    {section.after && <p>{section.after}</p>}
                  </div>
                </section>
              ))}

              {/* Section 8: Contact */}
              <section className="border-b border-[var(--divider-color)] flex flex-col gap-3 py-[var(--gap-content)]">
                <h2 className="h3 text-[#001416]">{terms.contact.heading}</h2>
                <div className="body-regular text-[#001416] space-y-0">
                  <p>{terms.contact.intro}</p>
                  <address className="not-italic">
                    {terms.contact.businessName}
                    <br />
                    {terms.contact.phoneLabel}{" "}
                    <a
                      href="tel:9549996600"
                      data-track-location="terms"
                      className="hover:underline"
                    >
                      {terms.contact.phone}
                    </a>
                    <br />
                    {terms.contact.emailLabel}{" "}
                    <a
                      href={`mailto:${terms.contact.email}`}
                      className="underline"
                    >
                      {terms.contact.email}
                    </a>
                    <br />
                    {terms.contact.addressLabel}{" "}
                    {terms.contact.addressLine1}
                    <br />
                    {terms.contact.addressLine2}
                  </address>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} t={t} reviewCount={reviewCount} reviewRating={reviewRating} />
    </div>
  );
}
