import { spiceImage } from "@/data/photography";

/**
 * The shared product-image primitive.
 *
 * Resolves a spice's photo through `AVAILABLE_IMAGES` and renders it, or falls
 * back to a clearly-labelled placeholder. This is deliberately animation-free:
 * entrance/hover motion lives in the parent card wrappers (carousel, grid,
 * viewer) so each surface controls its own timing instead of every `<img>`
 * re-animating underneath.
 */

export interface SpiceImageProps {
  slug: string;
  /** Used for alt text and the placeholder label. */
  name: string;
  /** Alt text / placeholder brief. Defaults to the specimen description. */
  alt?: string;
  className?: string;
  /** Eager-load (above the fold) rather than lazy. */
  priority?: boolean;
  /** object-fit for the <img>. */
  fit?: "cover" | "contain";
}

export function SpiceImage({
  slug,
  name,
  alt,
  className = "",
  priority = false,
  fit = "cover",
}: SpiceImageProps) {
  const src = spiceImage(slug);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? `${name} — whole spice`}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        className={className}
        style={{ objectFit: fit }}
      />
    );
  }

  return (
    <div
      data-photo-slot={slug}
      className={`flex flex-col justify-end border border-dashed border-white/16 p-4 ${className}`}
      style={{
        background:
          "linear-gradient(140deg, rgb(255 255 255 / 0.03) 0%, rgb(var(--ws-accent) / 0.05) 60%, rgb(255 255 255 / 0.02) 100%)",
      }}
    >
      <p className="font-mono text-[0.62rem] tracking-wide text-[rgb(var(--ws-paper)/0.42)] uppercase">
        Photography needed
      </p>
      <p className="mt-1 text-[0.8rem] leading-relaxed text-[rgb(var(--ws-paper)/0.66)]">
        {alt ?? name}
      </p>
    </div>
  );
}
