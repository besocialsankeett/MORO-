// Single source of truth for the brand. Rename here, restyle in styles.css.
export const brand = {
  name: "MORO",
  tagline: "Find and book salons and barbers near you",
  description: "Find a salon you’ll like, see real prices, and book an exact time. No calls, no waiting.",
  locale: "en-IN",
  currency: "INR",
  supportEmail: "hello@moro.example",
  /**
   * Public origin used for canonical URLs, Open Graph and the sitemap.
   * Set VITE_SITE_URL at build time once the site has a real domain.
   */
  siteUrl: ((import.meta.env?.VITE_SITE_URL as string | undefined) ?? "https://moro.example").replace(/\/$/, ""),
};
