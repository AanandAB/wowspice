"use client";

import { useEffect, useState } from "react";

/**
 * Tracks prefers-reduced-motion and updates if the user changes it mid-session.
 *
 * Reduced motion means *fewer and gentler* animations, not zero. Callers should
 * keep opacity and colour transitions and drop positional movement.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
