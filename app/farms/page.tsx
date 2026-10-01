import type { Metadata } from "next";
import Link from "next/link";
import { SPICES, paletteStyle } from "@/data/spices";
import { PhotoSlot } from "@/components/site/photo-slot";
import { BRAND_SHOTS } from "@/data/photography";
import { BodyTheme } from "@/components/site/body-theme";

export const metadata: Metadata = {
  title: "Where we source",
  description:
    "Nine districts across Kerala, 254 smallholdings, and the drying, grading and batch numbering that happens between the farm and your kitchen.",
};

const PROCESS = [
  {
    step: "01",
    head: "Picked, not gathered",
    body: "Pepper is picked when the lower berries redden, cardamom at 75–80 days before the pod splits, nutmeg when the fruit falls. Picking at the right moment costs yield and is the single biggest determinant of aroma.",
  },
  {
    step: "02",
    head: "Processed the same day",
    body: "Threshing, splitting and peeling all happen within hours of harvest. Mace left overnight oxidises from crimson to brown, which is why most of the mace on the market is dyed back to colour and ours is not.",
  },
  {
    step: "03",
    head: "Dried on mats or over smoke",
    body: "Five to eighteen days depending on the spice and the weather. Kudampuli is smoked over coconut shell rather than sun-dried, which is slower and gives the resinous edge that a Malabar fish curry depends on.",
  },
  {
    step: "04",
    head: "Graded by hand",
    body: "Cardamom at 8 mm and 7 mm, cashew at W240, turmeric by curcumin content. Grading is done by the same families that grew the crop, not at a central facility.",
  },
  {
    step: "05",
    head: "Batch numbered and sealed",
    body: "Every pouch carries a batch number traceable to the holding and the drying date. If a batch turns out wrong we can find its neighbours on the shelf and pull them.",
  },
];

const CALENDAR = [
  { spice: "Black Pepper", window: "December – February", district: "Wayanad" },
  { spice: "Cardamom", window: "August – November", district: "Idukki" },
  { spice: "Cinnamon", window: "June – October", district: "Kozhikode" },
  { spice: "Turmeric", window: "January – March", district: "Wayanad" },
  { spice: "Nutmeg and Mace", window: "June – August", district: "Kottayam, Idukki" },
  { spice: "Cashew", window: "March – May", district: "Kollam" },
  { spice: "Dry Ginger", window: "January – February", district: "Wayanad" },
  { spice: "Tamarind", window: "February – April", district: "Palakkad" },
  { spice: "Malabar Tamarind", window: "June – September", district: "Thrissur" },
];

export default function FarmsPage() {
  return (
    <div style={paletteStyle(SPICES[3])}>
      <BodyTheme accent={SPICES[3].palette.accent} bg={SPICES[3].palette.bg} />

      <div className="relative z-10 mx-auto max-w-6xl px-5 pt-28 pb-24 sm:px-8">
        <header className="max-w-[56ch]">
          <h1 className="ws-display-lg">Nine districts, 254 families</h1>
          <p className="ws-body mt-5">
            We do not own a plantation and we do not want one. Buying from smallholdings means
            smaller lots, more paperwork and far more variability — and it means the money stays in
            the districts where the spice actually grows.
          </p>
        </header>

        <div className="mt-12">
          <PhotoSlot
            shotId={BRAND_SHOTS[0].id}
            ratio="21 / 9"
            brief={BRAND_SHOTS[0].direction}
            size={BRAND_SHOTS[0].size}
          />
        </div>

        {/* ------------------------------------------------------------ process */}
        <section id="process" className="mt-20" aria-labelledby="process-heading">
          <h2 id="process-heading" className="ws-display-lg max-w-[24ch]">
            What happens between the vine and your jar
          </h2>

          <ol className="mt-10 border-t border-white/10">
            {PROCESS.map((item) => (
              <li
                key={item.step}
                className="grid grid-cols-1 gap-3 border-b border-white/10 py-7 sm:grid-cols-[5rem_minmax(0,22ch)_minmax(0,1fr)] sm:gap-8"
              >
                <span
                  className="font-mono text-[0.8rem] tabular-nums"
                  style={{ color: "rgb(var(--ws-accent))" }}
                >
                  {item.step}
                </span>
                <h3 className="text-[1rem] leading-snug font-semibold">{item.head}</h3>
                <p className="ws-meta max-w-[62ch] leading-relaxed">{item.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ----------------------------------------------------------- calendar */}
        <section id="calendar" className="mt-20" aria-labelledby="calendar-heading">
          <h2 id="calendar-heading" className="ws-display-lg">
            Harvest calendar
          </h2>
          <p className="ws-body mt-4">
            Nothing here is available year-round at full quality. If you need a spice out of season
            we will tell you rather than quietly sell you last year&rsquo;s lot.
          </p>

          <div className="mt-9 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <caption className="sr-only">
                Harvest window and primary district for each spice
              </caption>
              <thead>
                <tr className="border-b border-white/16">
                  {["Spice", "Harvest window", "Primary district"].map((head) => (
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
                {CALENDAR.map((row) => (
                  <tr key={row.spice} className="border-b border-white/8">
                    <th scope="row" className="py-3.5 text-[0.9rem] font-medium">
                      {row.spice}
                    </th>
                    <td className="py-3.5 text-[0.88rem] text-[rgb(var(--ws-paper)/0.78)]">
                      {row.window}
                    </td>
                    <td className="py-3.5 text-[0.88rem] text-[rgb(var(--ws-paper)/0.78)]">
                      {row.district}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---------------------------------------------------------- districts */}
        <section className="mt-20" aria-labelledby="districts-heading">
          <h2 id="districts-heading" className="ws-display-lg">
            Who grows what
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {SPICES.map((spice) => (
              <article key={spice.id} className="border-t border-white/12 pt-4">
                <h3 className="text-[0.98rem] font-semibold">{spice.origin.district}</h3>
                <p className="ws-meta mt-1.5">
                  {spice.name} · {spice.origin.place} · {spice.origin.altitude}
                </p>
                <p className="ws-meta mt-2.5 leading-relaxed">
                  {spice.origin.farms} smallholdings. Harvested {spice.harvest.toLowerCase()}.
                </p>
                <Link
                  href={`/spice/${spice.slug}`}
                  className="mt-3 inline-block text-[0.82rem] underline"
                  style={{ color: "rgb(var(--ws-accent))" }}
                >
                  See the {spice.name.toLowerCase()}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <PhotoSlot
              shotId={BRAND_SHOTS[2].id}
              ratio="3 / 2"
              brief={BRAND_SHOTS[2].direction}
              size={BRAND_SHOTS[2].size}
            />
            <PhotoSlot
              shotId={BRAND_SHOTS[3].id}
              ratio="3 / 2"
              brief={BRAND_SHOTS[3].direction}
              size={BRAND_SHOTS[3].size}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
