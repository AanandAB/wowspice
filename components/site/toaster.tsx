"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Toasts.
 *
 * Positioned bottom-centre on mobile and bottom-right on desktop, matching
 * where the cart button lives so the feedback is spatially consistent with the
 * action that caused it.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      offset={20}
      gap={10}
      // Transient messages should not stack into a wall.
      visibleToasts={3}
      style={
        {
          "--normal-bg": "#161313",
          "--normal-text": "rgb(var(--ws-paper))",
          "--normal-border": "rgb(var(--ws-accent) / 0.34)",
        } as React.CSSProperties
      }
      toastOptions={{
        duration: 3200,
        style: {
          background: "#161313",
          color: "rgb(var(--ws-paper))",
          border: "1px solid rgb(var(--ws-accent) / 0.34)",
          borderRadius: "999px",
          fontSize: "0.86rem",
          padding: "0.7rem 1.1rem",
          boxShadow: "0 14px 40px rgba(0,0,0,0.55)",
        },
      }}
    />
  );
}
