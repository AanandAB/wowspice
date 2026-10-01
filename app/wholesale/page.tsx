import type { Metadata } from "next";
import { paletteStyle, SPICES } from "@/data/spices";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { BodyTheme } from "@/components/site/body-theme";
import { formatINR } from "@/lib/commerce";

export const metadata: Metadata = {
  title: "Wholesale and gifting",
  description:
    "5 kg and 25 kg wholesale lots with the same batch numbering as retail, trial quantities, and made-to-order gift boxes for weddings and corporate gifting.",
};

const GIFT_BOXES = [
  {
    name: "Three-spice box",
    price: 1450,
    contents: "Black pepper, turmeric, cardamom · 50 g each",
    note: "The everyday starter. Fits a 200 g card sleeve and posts at letter rate.",
  },
  {
    name: "Five-spice box",
    price: 2380,
    contents: "Adds cinnamon and dry ginger · 50 g each",
    note: "Our most-ordered gift. Works for housewarmings and client thank-yous.",
  },
  {
    name: "Nine-spice box",
    price: 4250,
    contents: "The full collection except the in-shell cashew · 50 g each",
    note: "Built for weddings and Diwali. Cards can be printed with your own message.",
  },
];

export default function WholesalePage() {
  return (
    <div style={paletteStyle(SPICES[5])}>
      <BodyTheme accent={SPICES[5].palette.accent} bg={SPICES[5].palette.bg} />

      <div className="relative z-10 mx-auto max-w-6xl px-5 pt-28 pb-24 sm:px-8">
        <header className="max-w-[58ch]">
          <h1 className="ws-display-lg">
            We would rather sell twenty kilos than twenty grams
          </h1>
          <p className="ws-body mt-5">
            Wholesale lots come from the same holdings and carry the same batch numbering as retail.
            We will not open a separate, cheaper supply chain for trade customers and quietly send
            you the second-grade material — the lot you taste is the lot you get.
          </p>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-x-16 gap-y-10 lg:grid-cols-2">
          <section aria-labelledby="terms-heading">
            <h2 id="terms-heading" className="ws-display-md">
              How it works
            </h2>
            <dl className="mt-7 border-t border-white/12">
              {[
                {
                  term: "Trial quantities",
                  body: "One kilo of any spice, at retail rates, before you commit to a season. Most kitchens start here.",
                },
                {
                  term: "Standard lots",
                  body: "5 kg and 25 kg in food-grade sacks with an inner liner, batch numbered and dated.",
                },
                {
                  term: "Contract volumes",
                  body: "Standing monthly volumes from 100 kg, priced per season against the harvest window.",
                },
                {
                  term: "Documentation",
                  body: "Batch traceability, lab reports for pesticide residue and aflatoxin, and FSSAI paperwork where required.",
                },
                {
                  term: "Payment terms",
                  body: "Prepaid for trials. Thirty days from delivery on standing contracts, subject to a first-order review.",
                },
              ].map((row) => (
                <div key={row.term} className="border-b border-white/10 py-5">
                  <dt className="text-[0.95rem] font-semibold">{row.term}</dt>
                  <dd className="ws-meta mt-2 max-w-[58ch] leading-relaxed">{row.body}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="enquiry-heading">
            <h2 id="enquiry-heading" className="ws-display-md">
              Send an enquiry
            </h2>
            <p className="ws-body mt-4 mb-8">
              Tell us the spices, rough volumes and timings. If you need certifications we have not
              listed, say so and we will tell you honestly whether we can meet them.
            </p>
            <EnquiryForm />
          </section>
        </div>

        {/* ------------------------------------------------------------- gifting */}
        <section id="gifting" className="mt-24" aria-labelledby="gifting-heading">
          <h2 id="gifting-heading" className="ws-display-lg max-w-[26ch]">
            Gift boxes, made up to order
          </h2>
          <p className="ws-body mt-4">
            We build these the week they ship rather than holding stock, so tell us the date you
            need them rather than ordering the day before. Cards are printed with your own message.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {GIFT_BOXES.map((box, index) => (
              <article
                key={box.name}
                className="flex flex-col justify-between rounded-[var(--radius-surface)] border border-white/10 p-6"
                style={{
                  background:
                    index === 1
                      ? "linear-gradient(160deg, rgb(var(--ws-accent) / 0.14) 0%, rgb(255 255 255 / 0.03) 72%)"
                      : "rgb(255 255 255 / 0.03)",
                }}
              >
                <div>
                  <p className="ws-meta">{index === 1 ? "Most ordered" : `Option ${index + 1}`}</p>
                  <h3 className="ws-display-md mt-3">{box.name}</h3>
                  <p className="ws-meta mt-3 leading-relaxed">{box.contents}</p>
                  <p className="ws-body mt-4 text-[0.88rem]">{box.note}</p>
                </div>
                <p className="ws-price mt-7">
                  {formatINR(box.price)}
                  <span className="ws-meta ml-2 font-normal">per box</span>
                </p>
              </article>
            ))}
          </div>

          <div className="ws-rule mt-10 pt-8">
            <h3 className="ws-display-md">Corporate and wedding gifting</h3>
            <p className="ws-body mt-3">
              From sixty boxes we print the sleeve with your own identity and pack to a delivery
              schedule. Minimum order is sixty boxes, or thirty if you can take a single fixed
              dispatch date.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
