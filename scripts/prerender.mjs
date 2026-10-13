/**
 * Prerender: turns the client build in dist/ into static HTML for every
 * public route, and writes sitemap.xml and robots.txt.
 *
 * Runs after `vite build` (client) and `vite build --ssr` (server bundle):
 *
 *   dist/index.html                     home, prerendered
 *   dist/salons.html                    discovery, prerendered
 *   dist/salons/<slug>.html             one per salon, prerendered
 *   dist/partners.html                  owner page, prerendered
 *   dist/404.html                       not-found page (noindex)
 *   dist/app.html                       empty app shell for private, client-only
 *                                       routes (booking flow, account, dashboard)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const { render, publicRoutes, disallow, siteUrl } = await import(pathToFileURL(path.join(root, "dist-ssr", "entry-server.js")).href);

const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const SEO_BLOCK = /<!--seo-->[\s\S]*?<!--\/seo-->/;
if (!SEO_BLOCK.test(template) || !template.includes('<div id="root"></div>')) {
  throw new Error("index.html is missing the <!--seo--> block or the #root element");
}

function page(route, { stamp = route } = {}) {
  const { html, head } = render(route);
  return template.replace(SEO_BLOCK, head).replace('<div id="root"></div>', `<div id="root" data-prerendered="${stamp}">${html}</div>`);
}
function write(file, contents) {
  const out = path.join(dist, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, contents);
}

// The untouched shell, for routes that only make sense in the browser.
write("app.html", template.replace(SEO_BLOCK, `<title>MORO</title>\n    <meta name="robots" content="noindex, nofollow" data-seo />`));

for (const route of publicRoutes) {
  // /salons/verde-koramangala → salons/verde-koramangala.html: served at the clean URL by Vercel (cleanUrls), Netlify and vite preview alike.
  write(route === "/" ? "index.html" : `${route.slice(1)}.html`, page(route));
}
// Stamped with a path no URL has, so the client always renders it fresh for whatever URL was requested.
write("404.html", page("/this-page-does-not-exist", { stamp: "404" }));

const today = new Date().toISOString().slice(0, 10);
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicRoutes
    .map((r) => `  <url><loc>${siteUrl}${r}</loc><lastmod>${today}</lastmod><changefreq>${r === "/" || r === "/salons" ? "daily" : "weekly"}</changefreq></url>`)
    .join("\n")}\n</urlset>\n`,
);
write("robots.txt", `User-agent: *\nAllow: /\n${disallow.map((d) => `Disallow: ${d}`).join("\n")}\n\nSitemap: ${siteUrl}/sitemap.xml\n`);

fs.rmSync(path.join(root, "dist-ssr"), { recursive: true, force: true });
console.log(`prerendered ${publicRoutes.length} pages + 404, sitemap.xml, robots.txt  (site: ${siteUrl})`);
