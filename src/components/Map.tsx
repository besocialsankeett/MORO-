import { lazy, Suspense } from "react";
import { useHydrated } from "../lib/hooks";
import type { MapProps } from "./MapView";

const LeafletMap = lazy(() => import("./MapView"));

/**
 * Maps are browser-only and comparatively heavy, so Leaflet is loaded on
 * demand and never during prerendering. Everywhere else imports this wrapper.
 */
export function MapView(props: MapProps) {
  const hydrated = useHydrated();
  const placeholder = <div className={`skeleton size-full ${props.className ?? ""}`} />;
  if (!hydrated) return placeholder;
  return (
    <Suspense fallback={placeholder}>
      <LeafletMap {...props} />
    </Suspense>
  );
}
