import Link from "next/link";

/**
 * The mark. Two weights of the same display face rather than a serif/sans mix:
 * emphasis inside a wordmark should come from the family's own italic, not from
 * a second typeface bolted on.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`font-display text-[1.32rem] leading-none font-semibold tracking-[-0.015em] ${className}`}
      aria-label="wowspice, home"
    >
      <span className="italic" style={{ fontWeight: 500 }}>
        wow
      </span>
      spice
    </Link>
  );
}
