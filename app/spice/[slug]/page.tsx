import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star } from "@phosphor-icons/react/dist/ssr";
import { SPICES, getSpice, paletteStyle } from "@/data/spices";
import { formatINR } from "@/lib/commerce";
import { SpiceViewer } from "@/components/spice/spice-viewer";
import { BuyPanel } from "@/components/spice/buy-panel";
import { DeliveryEstimator } from "@/components/spice/delivery-estimator";
import { SpiceGrid } from "@/components/spice/spice-grid";
import { BodyTheme } from "@/components/site/body-theme";
import { PhotoSlot } from "@/components/site/photo-slot";
import { spiceShots } from "@/data/photography";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return SPICES.map((spice) => ({ slug: spice.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const spice = getSpice(slug);
  if (!spice) return { title: "Spice not found" };

  return {
    title: spice.metaTitle,
    description: spice.metaDescription,
    alternates: { canonical: `/spice/${spice.slug}` },
    openGraph: {
      title: spice.metaTitle,
      description: spice.metaDescription,
      type: "article",
    },
  };
}

export default async function SpicePage({ params }: PageProps) {
  const { slug } = await params;
  const spice = getSpice(slug);
  if (!spice) notFound();

  const related = spice.pairsWith
    .map((id) => SPICES.find((s) => s.id === id))
    .filter((s): s is (typeof SPICES)[number] => Boolean(s));

  const grain = spice.heat >= 2 ? "Medium" : spice.heat === 1 ? "Mild" : "None";

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: spice.name,
    alternateName: spice.local.roman,
    description: spice.description,
    category: "Spices",
    brand: { "@type": "Brand", name: "wowspice" },
    countryOfOrigin: "India",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: spice.rating,
      reviewCount: spice.reviewCount,
    },
    offers: {
      "@type": "Offer",
      price: spice.basePrice,
      priceCurrency: "INR",
      // 100 g reference price; real offers vary by pack size.
      availability: "https://schema.org/InStock",
      url: `/spice/${spice.slug}`,
    },
  };

  return (
    <div style={paletteStyle(spice)}>
      <BodyTheme accent={spice.palette.accent} bg={spice.palette.bg} />

      <script
        type="application/ld+json"
        // The object is built here, not user-supplied.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(56% 42% at 50% 22%, ${spice.palette.accent}24 0%, transparent 74%), linear-gradient(180deg, ${spice.palette.bg} 0%, #060504 100%)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-5 pt-28 pb-24 sm:px-8">
        <Link
          href="/collection"
          className="inline-flex items-center gap-2 text-[0.85rem] text-[rgb(var(--ws-paper)/0.7)] transition-colors duration-200 hover:text-[rgb(var(--ws-paper))]"
        >
          <ArrowLeft size={14} weight="bold" />
          All spices
        </Link>

        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SpiceViewer spice={spice} />

            <dl className="ws-rule mt-9 grid grid-cols-2 gap-x-6 gap-y-5 pt-7">
              {[
                { term: "Origin", value: `${spice.origin.place}, ${spice.origin.district}` },
                { term: "Altitude", value: spice.origin.altitude },
                { term: "Harvest", value: spice.harvest },
                { term: "Growing families", value: `${spice.origin.farms} smallholdings` },
              ].map((row) => (
                <div key={row.term}>
                  <dt className="ws-meta">{row.term}</dt>
                  <dd className="mt-1 text-[0.88rem]">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="ws-meta">{spice.origin.state}</p>
            <h1 className="ws-display-lg mt-2">{spice.name}</h1>
            <p className="ws-local mt-2">{spice.local.roman}</p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="flex items-center gap-1.5 text-[0.85rem]">
                <span className="flex" aria-hidden style={{ color: "rgb(var(--ws-accent))" }}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      size={13}
                      weight={index < Math.round(spice.rating) ? "fill" : "regular"}
                    />
                  ))}
                </span>
                <span className="tabular-nums">{spice.rating.toFixed(1)}</span>
                <span className="ws-meta">({spice.reviewCount} reviews)</span>
              </span>
              <span className="ws-meta">Heat: {grain}</span>
            </div>

            <p className="ws-body mt-6">{spice.description}</p>

            <ul className="mt-6 flex flex-wrap gap-2">
              {spice.flavorNotes.map((note) => (
                <li
                  key={note}
                  className="rounded-[var(--radius-control)] border border-white/14 px-3 py-1.5 text-[0.76rem]"
                >
                  {note}
                </li>
              ))}
            </ul>

            <div className="ws-rule mt-8 pt-8">
              <BuyPanel spice={spice} />
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- details */}
        <div className="mt-20 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-20">
          <div className="border-t border-white/10">
            {[
              {
                head: `Where the ${spice.name.toLowerCase()} comes from`,
                body: (
                  <>
                    <p className="ws-body">{spice.sourcing}</p>
                    <p className="ws-body mt-4">{spice.process}</p>
                  </>
                ),
              },
              {
                head: "How we handle and pack it",
                body: (
                  <p className="ws-body">
                    Packed in resealable, vacuum-sealed pouches within 48 hours of grinding, each
                    one carrying its batch number and drying date. Standard delivery across India
                    in {""}
                    3–5 working days; free above {formatINR(499)}.
                  </p>
                ),
              },
              {
                head: "Delivery estimate",
                body: <DeliveryEstimator />,
              },
              {
                head: "Returns",
                body: (
                  <p className="ws-body">
                    Not satisfied with the freshness or quality? Tell us within 48 hours of delivery
                    for a full refund or replacement — no questions asked. Spices are agricultural,
                    and we would rather hear about a bad batch than have you quietly stop buying
                    from us.
                  </p>
                ),
              },
              {
                head: "Storing it",
                body: <p className="ws-body">{spice.storage}</p>,
              },
              {
                head: "How to use it",
                body: (
                  <ul className="ws-body list-disc space-y-1.5 pl-5">
                    {spice.uses.map((use) => (
                      <li key={use}>{use}</li>
                    ))}
                  </ul>
                ),
              },
            ].map((panel) => (
              <details key={panel.head} className="group border-b border-white/10">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[0.96rem] font-medium [&::-webkit-details-marker]:hidden">
                  {panel.head}
                  <span
                    aria-hidden
                    className="relative h-3.5 w-3.5 flex-none transition-transform duration-250 ease-out group-open:rotate-45"
                  >
                    <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current" />
                    <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-current" />
                  </span>
                </summary>
                <div className="pb-6">{panel.body}</div>
              </details>
            ))}
          </div>

          <aside className="self-start rounded-[var(--radius-surface)] border border-white/10 bg-white/3 p-6">
            <h2 className="font-display text-[1.1rem] font-semibold">On this label</h2>
            <dl className="mt-5 space-y-3 text-[0.84rem]">
              {[
                { term: "Net weight", value: "See pack selection" },
                { term: "Ingredients", value: `100% ${spice.name.toLowerCase()}` },
                {
                  term: "Allergens",
                  value:
                    spice.id === "cashew" || spice.id === "cashewshell"
                      ? "Contains tree nuts (cashew)"
                      : "No declared allergens",
                },
                { term: "Dietary", value: spice.dietary.join(" · ") },
                { term: "Storage", value: "Cool, dry, away from light" },
                { term: "Shelf life", value: "24 months from packing" },
                { term: "Packed by", value: "wowspice, Kochi, Kerala" },
              ].map((row) => (
                <div key={row.term} className="flex justify-between gap-5 border-b border-white/8 pb-3">
                  <dt className="text-[rgb(var(--ws-paper)/0.58)]">{row.term}</dt>
                  <dd className="text-right">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="ws-meta mt-5 leading-relaxed">
              Demonstration storefront: licence numbers and lab report references are placeholders
              pending registration.
            </p>
          </aside>
        </div>

        {/* ----------------------------------------------------------- gallery */}
        {(() => {
          const shots = spiceShots(spice.name, spice.slug);
          return (
            <section className="mt-24" aria-labelledby="gallery-heading">
              <h2 id="gallery-heading" className="ws-display-md mb-8">
                See the spice up close
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <PhotoSlot
                  shotId={shots[0].id}
                  ratio="1 / 1"
                  brief={shots[0].direction}
                  size={shots[0].size}
                />
                <PhotoSlot
                  shotId={shots[1].id}
                  ratio="4 / 5"
                  brief={shots[1].direction}
                  size={shots[1].size}
                />
              </div>
            </section>
          );
        })()}

        {/* ------------------------------------------------------------ related */}
        <section className="mt-24" aria-labelledby="pairs-heading">
          <h2 id="pairs-heading" className="ws-display-md mb-8">
            Cooks pair this with
          </h2>
          <SpiceGrid ids={related.map((s) => s.id)} captions />
        </section>
      </div>
    </div>
  );
}
