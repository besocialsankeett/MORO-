import { createContext, useContext, useEffect } from "react";
import { brand } from "../brand";
import { img } from "../data/images";
import { paths } from "./routes";
import { WEEKDAYS } from "./time";
import type { Salon } from "../types";

/**
 * Per-page metadata.
 *
 * Each page renders one <Seo>. At build time the prerenderer collects it
 * through SeoContext and writes real tags into that page's HTML; in the
 * browser the same data keeps <head> in sync during client-side navigation.
 */
export interface SeoData {
  title: string;
  description: string;
  /** Path of the canonical URL, e.g. "/salons/verde-koramangala". */
  path: string;
  /** Photo reference for social cards. */
  image?: string;
  /** Private and utility pages are kept out of search indexes. */
  noindex?: boolean;
  jsonLd?: object[];
}

export const SeoContext = createContext<{ current: SeoData | null } | null>(null);

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const abs = (path: string) => `${brand.siteUrl}${path === "/" ? "/" : path}`;
export const fullTitle = (t: string) => (t.includes(brand.name) ? t : `${t} | ${brand.name}`);

/** The exact tags for a page, as HTML. Used by the prerenderer and mirrored by the client effect. */
export function headHtml(d: SeoData) {
  const title = fullTitle(d.title);
  const image = img(d.image ?? "roomMirrors", 1200, 630);
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(d.description)}" data-seo />`,
    `<link rel="canonical" href="${esc(abs(d.path))}" data-seo />`,
    `<meta name="robots" content="${d.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"}" data-seo />`,
    `<meta property="og:site_name" content="${esc(brand.name)}" data-seo />`,
    `<meta property="og:type" content="website" data-seo />`,
    `<meta property="og:title" content="${esc(title)}" data-seo />`,
    `<meta property="og:description" content="${esc(d.description)}" data-seo />`,
    `<meta property="og:url" content="${esc(abs(d.path))}" data-seo />`,
    `<meta property="og:image" content="${esc(image)}" data-seo />`,
    `<meta name="twitter:card" content="summary_large_image" data-seo />`,
    ...(d.jsonLd ?? []).map((j) => `<script type="application/ld+json" data-seo>${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`),
  ];
  return tags.join("\n    ");
}

export function Seo(props: SeoData) {
  const collector = useContext(SeoContext);
  if (collector) collector.current = props; // build-time collection

  const key = JSON.stringify(props);
  useEffect(() => {
    const tpl = document.createElement("template");
    tpl.innerHTML = headHtml(props);
    document.head.querySelectorAll("[data-seo]").forEach((n) => n.remove());
    const title = tpl.content.querySelector("title");
    if (title) document.title = title.textContent ?? brand.name;
    tpl.content.querySelectorAll("[data-seo]").forEach((n) => {
      // Scripts cloned from a template are inert, which is what we want for JSON-LD.
      document.head.appendChild(n);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

/* ── Structured data ────────────────────────────────────── */

const DAY_URI = WEEKDAYS.map((d) => `https://schema.org/${d}`);

/**
 * schema.org HairSalon for one listed business. Only fields the listing
 * actually holds are emitted. Ratings are deliberately left out: the demo's
 * review figures are sample data and must not be presented to search engines
 * as genuine.
 */
export function salonJsonLd(s: Salon, cityName: string) {
  const url = abs(paths.salon(s));
  return [
    {
      "@context": "https://schema.org",
      "@type": "HairSalon",
      "@id": `${url}#salon`,
      name: s.name,
      description: s.description,
      url,
      image: [s.cover, ...s.gallery].filter(Boolean).map((p) => img(p, 1200)),
      address: { "@type": "PostalAddress", streetAddress: s.address, addressLocality: cityName, addressCountry: "IN" },
      geo: { "@type": "GeoCoordinates", latitude: s.coords[0], longitude: s.coords[1] },
      priceRange: s.services.length ? `₹${Math.min(...s.services.map((x) => x.price))}–₹${Math.max(...s.services.map((x) => x.price))}` : undefined,
      currenciesAccepted: "INR",
      openingHoursSpecification: s.hours.flatMap((h, i) => (h ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: DAY_URI[i], opens: h.open, closes: h.close }] : [])),
      makesOffer: s.services.map((x) => ({
        "@type": "Offer",
        price: x.price,
        priceCurrency: "INR",
        itemOffered: { "@type": "Service", name: x.name, description: x.description || undefined },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: brand.name, item: abs("/") },
        { "@type": "ListItem", position: 2, name: "Salons", item: abs(paths.salons) },
        { "@type": "ListItem", position: 3, name: s.name, item: url },
      ],
    },
  ];
}

export const siteJsonLd = () => [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: abs("/"),
    description: brand.description,
    potentialAction: { "@type": "SearchAction", target: `${abs(paths.salons)}?q={search_term_string}`, "query-input": "required name=search_term_string" },
  },
];
