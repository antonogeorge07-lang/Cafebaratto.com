// Lightweight GA/GTM-compatible event tracker.
// Matches the window.dataLayer schema exactly: { event, ...params, ts }.

type Primitive = string | number | boolean | null | undefined;
export type TrackParams = Record<string, Primitive | Primitive[] | Record<string, Primitive>>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackEvent(event: string, params: TrackParams = {}): void {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params, ts: Date.now() });
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("[analytics]", event, params);
    }
  } catch {
    // swallow — analytics must never break the app
  }
}
