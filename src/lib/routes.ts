import type { Salon } from "../types";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Stable, readable public URL for a salon: /salons/brass-and-bone-lower-parel.
 * Owner-created salons carry their id as a suffix so two salons with the same
 * name in the same area cannot collide.
 */
export function salonSlug(s: Salon) {
  const base = [slugify(s.name), slugify(s.area)].filter(Boolean).join("-") || "salon";
  return s.id.startsWith("my-") ? `${base}-${s.id.slice(3)}` : base;
}

export const paths = {
  home: "/",
  salons: "/salons",
  salon: (s: Salon) => `/salons/${salonSlug(s)}`,
  book: (s: Salon, serviceIds: string[] = []) => `/salons/${salonSlug(s)}/book${serviceIds.length ? `?s=${serviceIds.join(",")}` : ""}`,
  booking: (id: string) => `/booking/${id}`,
  appointments: "/appointments",
  partners: "/partners",
  setup: "/partners/setup",
  dashboard: "/partners/dashboard",
};

/** Resolve a URL segment to a salon. Accepts the slug, or the raw id used by older links. */
export const findSalon = (salons: Salon[], param?: string) => (param ? salons.find((s) => salonSlug(s) === param || s.id === param) : undefined);
