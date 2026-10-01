import { AVAILABLE_IMAGES } from "@/data/photography";

/**
 * A photography slot.
 *
 * When a real file exists this renders it. Until then it renders an honest,
 * clearly-labelled placeholder carrying the capture brief — deliberately NOT a
 * div pretending to be a screenshot, and not random stock imagery that would
 * misrepresent what is being sold.
 */

export interface PhotoSlotProps {
  /** Key into AVAILABLE_IMAGES. */
  shotId: string;
  /** Aspect ratio, as a CSS aspect-ratio value. */
  ratio?: string;
  /** Capture brief shown while the slot is empty. */
  brief: string;
  /** Recommended capture size. */
  size: string;
  className?: string;
}

export function PhotoSlot({
  shotId,
  ratio = "4 / 3",
  brief,
  size,
  className = "",
}: PhotoSlotProps) {
  const src = AVAILABLE_IMAGES[shotId];

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={brief}
        loading="lazy"
        decoding="async"
        className={`w-full rounded-[var(--radius-media)] object-cover ${className}`}
        style={{ aspectRatio: ratio }}
      />
    );
  }

  return (
    <div
      data-photo-slot={shotId}
      className={`flex flex-col justify-end rounded-[var(--radius-media)] border border-dashed border-white/16 p-5 ${className}`}
      style={{
        aspectRatio: ratio,
        background:
          "linear-gradient(140deg, rgb(255 255 255 / 0.03) 0%, rgb(var(--ws-accent) / 0.05) 60%, rgb(255 255 255 / 0.02) 100%)",
      }}
    >
      <p className="font-mono text-[0.66rem] tracking-wide text-[rgb(var(--ws-paper)/0.42)] uppercase">
        Photography needed · {size}
      </p>
      <p className="mt-1.5 max-w-[46ch] text-[0.82rem] leading-relaxed text-[rgb(var(--ws-paper)/0.66)]">
        {brief}
      </p>
    </div>
  );
}
