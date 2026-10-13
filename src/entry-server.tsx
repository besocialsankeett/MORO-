import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { MotionConfig } from "motion/react";
import App from "./App";
import { brand } from "./brand";
import { seedSalons } from "./data/salons";
import { paths } from "./lib/routes";
import { headHtml, SeoContext, type SeoData } from "./lib/seo";
import { StoreProvider } from "./lib/store";

/**
 * Build-time entry. scripts/prerender.mjs imports this to turn each public
 * route into static HTML with its own metadata. Nothing here runs in the browser.
 */
export function render(url: string) {
  const seo: { current: SeoData | null } = { current: null };
  const html = renderToString(
    <StrictMode>
      <MotionConfig reducedMotion="user">
        <StaticRouter location={url}>
          <SeoContext.Provider value={seo}>
            <StoreProvider>
              <App />
            </StoreProvider>
          </SeoContext.Provider>
        </StaticRouter>
      </MotionConfig>
    </StrictMode>,
  );
  return { html, head: seo.current ? headHtml(seo.current) : "", noindex: !!seo.current?.noindex };
}

/** Every page worth indexing: the home page, discovery, the owner page and one page per seed salon. */
export const publicRoutes = [paths.home, paths.salons, paths.partners, ...seedSalons.map((s) => paths.salon(s))];

/** Private or utility areas, kept out of search engines. */
export const disallow = [paths.appointments, "/booking/", paths.setup, paths.dashboard, "/salons/*/book"];

export const siteUrl = brand.siteUrl;
