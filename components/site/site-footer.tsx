import Link from "next/link";
import { Wordmark } from "./wordmark";
import { SPICES } from "@/data/spices";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Shop",
    links: [
      { label: "All spices", href: "/collection" },
      { label: "Whole vs ground", href: "/collection?form=whole" },
      { label: "Delivery & shipping", href: "/delivery" },
      { label: "Wholesale & bulk", href: "/wholesale" },
    ],
  },
  {
    heading: "The farms",
    links: [
      { label: "Where we source", href: "/farms" },
      { label: "How we dry and grade", href: "/farms#process" },
      { label: "Harvest calendar", href: "/farms#calendar" },
    ],
  },
  {
    heading: "Orders",
    links: [
      { label: "Delivery estimate", href: "/delivery#estimate" },
      { label: "Returns policy", href: "/delivery#returns" },
      { label: "Packaging", href: "/delivery#packaging" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#060504] px-5 pt-16 pb-9 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Wordmark />
            <p className="ws-meta mt-4 max-w-[34ch] leading-relaxed">
              Whole spices bought directly from smallholdings across Kerala, dried the slow way,
              and dispatched from Kochi within two working days.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h3 className="mb-4 text-[0.78rem] font-medium text-[rgb(var(--ws-paper)/0.5)]">
                {column.heading}
              </h3>
              {column.links.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className="mb-2.5 block text-[0.86rem] text-[rgb(var(--ws-paper)/0.72)] transition-colors duration-200 hover:text-[rgb(var(--ws-paper))]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <div className="ws-rule-accent mt-12 pt-6">
          <h3 className="mb-4 text-[0.78rem] font-medium text-[rgb(var(--ws-paper)/0.5)]">
            Every spice we carry
          </h3>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {SPICES.map((spice) => (
              <li key={spice.id}>
                <Link
                  href={`/spice/${spice.slug}`}
                  className="text-[0.82rem] text-[rgb(var(--ws-paper)/0.62)] transition-colors duration-200 hover:text-[rgb(var(--ws-paper))]"
                >
                  {spice.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-[0.76rem] text-[rgb(var(--ws-paper)/0.42)] sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} wowspice. A demonstration storefront.</span>
          <span className="font-mono">
            FSSAI licence and GSTIN are placeholder values pending registration
          </span>
        </div>
      </div>
    </footer>
  );
}
