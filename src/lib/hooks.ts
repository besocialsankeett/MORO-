import { useEffect, useState, useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * False on the server and during hydration, true straight after.
 * Anything that depends on the clock, the device or stored state waits for
 * this, so prerendered HTML and the first client render always agree.
 */
export const useHydrated = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}
