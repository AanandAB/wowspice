import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { SpiceCarousel } from "@/components/carousel/spice-carousel";
import { SpiceGrid } from "@/components/spice/spice-grid";
import { PhotoSlot } from "@/components/site/photo-slot";
import { BRAND_SHOTS } from "@/data/photography";
import { PACKS, SPICES } from "@/data/spices";
import { formatINR, unitPrice } from "@/lib/commerce";

export const metadata: Metadata = {
  title: "whole spices from Kerala, dried the slow way",
  description:
    "Eleven whole spices bought directly from smallholdings across Kerala. Sun-dried on mats, hand-graded, and dispatched from Kochi within two working days.",
};

const WHOLE = { id: "whole" as const, label: "Whole", note: "", surcharge: 0 };

const FAQS: { q: string; a: string }[] = [
  {
    q: "Whole or ground — which should I buy?",
    a: "Whole, almost always. A whole seed keeps its volatile oils behind an intact skin, so it holds its aroma for a year or two; ground, the same spice fades in about six weeks. We grind to order for anyone who wants the convenience, and we grind the morning we dispatch rather than holding ground stock.",
  },
  {
    q: "How much does delivery cost?",
    a: "Flat ₹49 anywhere in India, free on orders above ₹499. We dispatch from Kochi within two working days, and orders placed before 2pm usually go out the same working day. Every product page estimates an arrival window from your pincode before you check out.",
  },
  {
    q: "What if a spice arrives stale or damp?",
    a: "Tell us within 48 hours of delivery and we refund or replace it, no questions asked. Spices are agricultural, and we would rather hear about a bad batch than have you quietly stop buying from us.",
  },
  {
    q: "Do you add colouring or anti-caking agents?",
    a: "No. Nothing here is dyed, anti-caked, irradiated or bulked out. Turmeric is polished by hand rather than with a polishing agent, and mace is shade-dried specifically so it keeps its own crimson instead of being painted back to colour.",
  },
  {
    q: "Is this a real shop?",
    a: "It is a demonstration storefront built to show the 3D specimen viewer and the full ordering flow. The catalogue, sourcing notes and pricing are modelled on real Malabar trade, but no payment is taken and the licence numbers on this site are placeholders.",
  },
];

export default function HomePage() {
  const brandHero = BRAND_SHOTS[0];
  const brandStream = BRAND_SHOTS[1];

  // Lowest price per pack, so the tier table reads as a real price ladder
  // rather than a single arbitrary example.
  const packLadder = PACKS.map((pack) => {
    const prices = SPICES.map((spice) => unitPrice(spice, pack, WHOLE));
    const cheapest = Math.min(...prices);
    return {
      label: pack.label,
      grams: pack.grams,
      from: cheapest,
      per100: (cheapest / pack.grams) * 100,
    };
  });

  const basePer100 = packLadder[0].per100;

  return (
    <>
      <SpiceCarousel />

      {/* ---------------------------------------------------------------- grid */}
      <section className="relative px-5 pt-20 pb-4 sm:px-8" aria-labelledby="collection-heading">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-[54ch]">
            <p className="ws-meta mb-3">Eleven spices, eleven districts</p>
            <h2 id="collection-heading" className="ws-display-lg">
              The whole collection
            </h2>
            <p className="ws-body mt-4">
              Every one of these is bought direct from the families who grew it. Spin any of them
              to see the actual surface — the reticulation on a nutmeg, the ribs on a cardamom pod,
              the spiral layers in a cinnamon quill.
            </p>
          </div>

          <SpiceGrid ids={SPICES.map((s) => s.id)} />

          <div className="mt-12 flex justify-center">
            <Link href="/collection" className="ws-btn ws-btn-ghost">
              Browse with filters
              <ArrowRight size={15} weight="bold" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ sourcing */}
      <section
        className="relative mt-10 px-5 py-24 sm:px-8"
        aria-labelledby="sourcing-heading"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          <div>
            <p className="ws-meta mb-3">Why it tastes different</p>
            <h2 id="sourcing-heading" className="ws-display-lg">
              Dried on mats, never in a kiln
            </h2>
            <p className="ws-body mt-5">
              A kiln can turn a wet harvest into a sellable one in eight hours. A mat takes five to
              seven days and loses more weight to the weather. The difference is that kiln drying
              drives off the volatile oils along with the water, and those oils are the entire
              reason a spice is worth buying.
            </p>
            <p className="ws-body mt-4">
              We buy from thirty smallholdings or fewer per spice, most under two acres. That is
              enough to know every one of them by name, and not enough to fill a container, which
              suits us fine.
            </p>

            <dl className="mt-9 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
              {[
                { term: "Smallholdings", value: "254" },
                { term: "Districts", value: "9" },
                { term: "Longest drying", value: "18 days" },
              ].map((stat) => (
                <div key={stat.term} className="border-t border-white/10 pt-3">
                  <dt className="ws-meta">{stat.term}</dt>
                  <dd className="ws-price mt-1">{stat.value}</dd>
                </div>
              ))}
            </dl>

            <Link href="/farms" className="ws-btn ws-btn-ghost mt-9">
              See where each spice comes from
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <PhotoSlot
              shotId={brandHero.id}
              ratio="16 / 10"
              brief={brandHero.direction}
              size={brandHero.size}
            />
            <PhotoSlot
              shotId={brandStream.id}
              ratio="4 / 3"
              brief={brandStream.direction}
              size={brandStream.size}
            />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- packs */}
      <section className="relative px-5 py-20 sm:px-8" aria-labelledby="packs-heading">
        <div className="mx-auto max-w-6xl">
          <h2 id="packs-heading" className="ws-display-lg max-w-[26ch]">
            Buy the size you will actually finish
          </h2>
          <p className="ws-body mt-4">
            Larger packs cost less per gram, which is the only reason to buy more at once. If you
            cook with a spice weekly, 250 g is usually the honest answer.
          </p>

          <div className="mt-11 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {packLadder.map((tier, index) => {
              const saving = Math.round((1 - tier.per100 / basePer100) * 100);
              return (
                <div
                  key={tier.label}
                  className="flex flex-col justify-between rounded-[var(--radius-surface)] border border-white/10 p-5"
                  style={{
                    background:
                      index === 2
                        ? "linear-gradient(160deg, rgb(var(--ws-accent) / 0.14) 0%, rgb(255 255 255 / 0.03) 70%)"
                        : "rgb(255 255 255 / 0.03)",
                  }}
                >
                  <div>
                    <p className="font-mono text-[0.72rem] tracking-wide text-[rgb(var(--ws-paper)/0.5)] uppercase">
                      {index === 2 ? "Most ordered" : `Tier ${index + 1}`}
                    </p>
                    <p className="ws-display-md mt-3">{tier.label}</p>
                  </div>
                  <div className="mt-7">
                    <p className="ws-price">
                      {formatINR(tier.from)}
                      <span className="ws-meta ml-2 font-normal">from</span>
                    </p>
                    <p className="ws-meta mt-1.5 tabular-nums">
                      {saving > 0
                        ? `${formatINR(Math.round(tier.per100))} per 100 g · saves ${saving}%`
                        : `${formatINR(Math.round(tier.per100))} per 100 g`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ws-rule mt-12 flex flex-col gap-6 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="ws-display-md">Gift boxes and wedding favours</h3>
              <p className="ws-body mt-2 max-w-[62ch]">
                Three-, five- and nine-spice boxes in a printed card sleeve, with a hand-written
                card. Priced from ₹1,450 and made up to order, so tell us the date rather than
                ordering the day before.
              </p>
            </div>
            <Link href="/wholesale#gifting" className="ws-btn ws-btn-ghost shrink-0">
              Ask about gift boxes
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- trust */}
      <section className="px-5 py-14 sm:px-8" aria-label="Guarantees">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 divide-y divide-white/10 border-y border-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            {[
              {
                head: "Batch numbers on every pouch",
                body: "Traceable back to the holding and the drying date. If a batch is wrong we can find its neighbours.",
              },
              {
                head: "Lab-tested for what matters",
                body: "Pesticide residue, aflatoxin and curcumin where relevant. Reports available on request.",
              },
              {
                head: "Dispatched from Kochi in 2 days",
                body: "Grinding happens on the dispatch morning, never in advance.",
              },
              {
                head: "48-hour no-questions refund",
                body: "If it arrives damp, stale or wrong, we replace it or refund you.",
              },
            ].map((item) => (
              <div key={item.head} className="px-0 py-6 sm:px-6 sm:first:pl-0">
                <h3 className="text-[0.95rem] leading-snug font-semibold">{item.head}</h3>
                <p className="ws-meta mt-2 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- faq */}
      <section className="px-5 py-20 sm:px-8" aria-labelledby="faq-heading">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[minmax(0,28ch)_minmax(0,1fr)] lg:gap-20">
          <h2 id="faq-heading" className="ws-display-lg">
            Questions we get asked
          </h2>
          <div className="border-t border-white/10">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group border-b border-white/10">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[0.98rem] font-medium [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span
                    aria-hidden
                    className="relative h-3.5 w-3.5 flex-none transition-transform duration-250 ease-out group-open:rotate-45"
                  >
                    <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current" />
                    <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-current" />
                  </span>
                </summary>
                <p className="ws-body pb-6">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- wholesale */}
      <section className="px-5 pb-24 sm:px-8" aria-labelledby="wholesale-heading">
        <div className="mx-auto max-w-6xl">
          <div
            className="ws-grain relative overflow-hidden rounded-[var(--radius-media)] border border-white/10 px-6 py-14 sm:px-12"
            style={{
              background:
                "radial-gradient(120% 140% at 12% 0%, rgb(var(--ws-accent) / 0.2) 0%, rgb(255 255 255 / 0.02) 55%), #0d0b0a",
            }}
          >
            <p className="ws-meta mb-3">Restaurants, retailers and exporters</p>
            <h2 id="wholesale-heading" className="ws-display-lg max-w-[22ch]">
              We would rather sell twenty kilos than twenty grams
            </h2>
            <p className="ws-body mt-5">
              Wholesale lots come from the same holdings, in 5 kg and 25 kg food-grade sacks with
              the same batch numbering. Trial quantities of a kilo are available before you commit
              to a season.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/wholesale" className="ws-btn ws-btn-accent">
                Wholesale enquiry
              </Link>
              <Link href="/delivery" className="ws-btn ws-btn-ghost">
                Delivery and returns
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
