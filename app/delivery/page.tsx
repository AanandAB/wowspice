import type { Metadata } from "next";
import Link from "next/link";
import { paletteStyle, SPICES } from "@/data/spices";
import { FLAT_SHIPPING, FREE_SHIPPING_THRESHOLD, formatINR } from "@/lib/commerce";
import { DELIVERY_ZONES } from "@/lib/delivery";
import { DeliveryEstimator } from "@/components/spice/delivery-estimator";
import { BodyTheme } from "@/components/site/body-theme";

export const metadata: Metadata = {
  title: "Delivery and returns",
  description:
    "Transit times by region from Kochi, flat-rate shipping, cash-on-delivery availability, packaging and the 48-hour returns policy.",
};

export default function DeliveryPage() {
  return (
    <div style={paletteStyle(SPICES[1])}>
      <BodyTheme accent={SPICES[1].palette.accent} bg={SPICES[1].palette.bg} />

      <div className="relative z-10 mx-auto max-w-6xl px-5 pt-28 pb-24 sm:px-8">
        <header className="max-w-[56ch]">
          <h1 className="ws-display-lg">Delivery and returns</h1>
          <p className="ws-body mt-5">
            Everything ships from Kochi. Flat {formatINR(FLAT_SHIPPING)} anywhere in India, free
            above {formatINR(FREE_SHIPPING_THRESHOLD)}. Orders placed before 2pm go out the same
            working day; anything later goes the next.
          </p>
        </header>

        <section id="estimate" className="mt-12" aria-labelledby="estimate-heading">
          <h2 id="estimate-heading" className="ws-display-md mb-6">
            What will it cost me, and when?
          </h2>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-20">
            <div className="ws-surface p-6">
              <DeliveryEstimator />
            </div>

            <div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-left">
                  <caption className="sr-only">Transit times by region</caption>
                  <thead>
                    <tr className="border-b border-white/16">
                      {["Region", "Transit", "Cash on delivery"].map((head) => (
                        <th
                          key={head}
                          scope="col"
                          className="py-3 text-[0.76rem] font-medium tracking-wide text-[rgb(var(--ws-paper)/0.55)] uppercase"
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DELIVERY_ZONES.map((zone) => (
                      <tr key={zone.id} className="border-b border-white/8">
                        <th scope="row" className="py-3.5 text-[0.88rem] font-medium">
                          {zone.label}
                        </th>
                        <td className="py-3.5 text-[0.86rem] tabular-nums text-[rgb(var(--ws-paper)/0.78)]">
                          {zone.minDays}–{zone.maxDays} working days
                        </td>
                        <td className="py-3.5 text-[0.86rem] text-[rgb(var(--ws-paper)/0.78)]">
                          {zone.cod ? "Yes" : "Prepaid only"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="ws-meta mt-5 max-w-[62ch] leading-relaxed">
                Transit times run from dispatch, not from order. They come from a model based on
                Indian postal circles rather than a live courier feed, so treat them as estimates —
                the confirmation email carries the actual tracking reference.
              </p>
            </div>
          </div>
        </section>

        <section id="packaging" className="mt-20" aria-labelledby="packaging-heading">
          <h2 id="packaging-heading" className="ws-display-lg">
            Packaging
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-x-16 gap-y-8 sm:grid-cols-2">
            {[
              {
                head: "Resealable, vacuum-sealed pouches",
                body: "Packed within 48 hours of grinding and vacuum sealed, because oxygen is what actually ages a spice. The zip closure is built to be reopened hundreds of times.",
              },
              {
                head: "Batch number on every pouch",
                body: "Traceable to the holding and the drying date. Quote it and we can tell you exactly which lot you are holding and who dried it.",
              },
              {
                head: "No plastic inside, no plastic outside",
                body: "Kraft outer, paper tape, no bubble wrap. Spices travel perfectly well in a rigid card box and the whole thing recycles.",
              },
              {
                head: "Ground to order only",
                body: "We hold no ground stock. If you order ground, it is milled the morning it ships, which is the only way ground spice is worth buying at all.",
              },
            ].map((item) => (
              <div key={item.head} className="border-t border-white/12 pt-5">
                <h3 className="text-[1rem] font-semibold">{item.head}</h3>
                <p className="ws-meta mt-2.5 max-w-[56ch] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="returns" className="mt-20" aria-labelledby="returns-heading">
          <div className="ws-rule-accent rounded-[var(--radius-media)] border border-white/10 bg-white/3 px-6 py-12 sm:px-12">
            <h2 id="returns-heading" className="ws-display-lg max-w-[26ch]">
              48 hours, no questions, no photographs required
            </h2>
            <p className="ws-body mt-5">
              Spices are agricultural. A lot can dry badly, pick up moisture in transit, or simply
              not be what you expected. Tell us within 48 hours of delivery and we replace it or
              refund it — we will not ask you to prove anything.
            </p>
            <p className="ws-body mt-4">
              Past 48 hours we will still talk to you. Whole spices hold their quality for two
              years, so if something tastes flat after a month, that is our problem, not yours.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/wholesale" className="ws-btn ws-btn-ghost">
                Raise a problem with an order
              </Link>
              <Link href="/collection" className="ws-btn ws-btn-ghost">
                Back to the collection
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
