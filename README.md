# MORO — salon discovery & booking

A portfolio concept: find a salon nearby, compare services and prices, and book an exact time. Customer side plus a salon-owner dashboard.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check, client build, prerender, sitemap + robots
npm run preview    # serve the built site on http://localhost:4173
```

## Creative direction: The Mirror

A salon is the one place you look at yourself for an hour, so MORO's signature is a mirror.

- **3D:** a three-panel vanity mirror on the homepage (`src/components/Triptych.tsx`, styles under "The hero mirror" in `src/styles.css`). It is built from ordinary elements and CSS 3D transforms: bronze frames, bevelled glass, hinges, the slab's thickness on the wings, and a shadow where it stands. Each pane reflects a different salon — the three best matches for whatever is set in the search desk. The mirror tilts toward the pointer, and what each pane reflects slides the other way while the light travels across the glass and frame. The wings swing open as the intro clears and fold as you scroll; hovering a pane brings it forward, and clicking it opens that salon.
- **Single mirrors:** the same frame and glass are used around the hovered-salon photo in the nearby list and the featured salon (`Mirror` in `src/components/ui.tsx`). The light on them follows the pointer.
- **Labels:** the same three salons sit under the mirror as ordinary links, synced with the panels. They are the touch, keyboard and crawler route to the same content.
- **Palette:** pale stone, near-black ink, and one accent — oxblood — kept to small moments (a chosen time slot, a focused field, the progress bar).
- **Type:** Bodoni Moda, regular weight and sentence case, for a few large lines; Geist for everything else. Emphasis is italic, never colour.
- **Shape:** hard edges everywhere. The only curve is the mirror's arch.

The mirror is confined to the homepage. Discovery, salon pages, the booking flow and the dashboard are ordinary HTML.

### Motion moments

- **Mirror line intro** (`index.html`): on the first page of a session, a dark room. A line of light draws across the middle of the screen, the lights come up, and the letters of MORO rise out of the line and stand on it while their reflection sinks into the polished surface below (a crisp layer where the letters touch, a downward-smeared one trailing away). Then the screen parts along the line, top half up and bottom half down, onto the page. About four seconds, CSS and a few lines of script, no images. It lives in the page shell so it covers the first paint, and waits for the typeface (1.5 s at most). Skipped on later loads in the same session, with reduced motion, and without scripts. To replay it, clear `moro:intro` from session storage.
- **Loader mark** (`ArchLoader` in `src/components/ui.tsx`): the arch drawing itself. Used inside buttons while they work and while a lazily loaded page arrives.
- **Booking confirmed** (`DateArch` in `src/pages/Booking.tsx`): the arch draws, fills from the floor up, the date settles in, a glint crosses, and the status is stamped on the corner. Plays once, straight after booking; the same arch is shown still when the booking is opened later.

### How the mirror degrades

The mirror needs no WebGL, so it looks the same on every device. The HTML ships it standing at rest, with the panes as real links; a small animation loop takes over once the page is interactive. With reduced motion it stands still (the active pane is still emphasised). Touch devices get the idle sway, the opening and the fold on scroll, but no pointer tilt. The loop pauses when the mirror is off screen or the tab is hidden.

## SEO

The app is a Vite SPA that is **prerendered at build time** (`scripts/prerender.mjs` + `src/entry-server.tsx`):

| Output | What |
| --- | --- |
| `dist/index.html`, `salons.html`, `partners.html` | home, discovery, owner page |
| `dist/salons/<slug>.html` | one page per seed salon, e.g. `/salons/brass-and-bone-lower-parel` |
| `dist/404.html` | not-found page (noindex) |
| `dist/app.html` | empty shell for private client-only routes |
| `dist/sitemap.xml`, `dist/robots.txt` | generated from the same route list |

- Each page sets its own title, description, canonical, Open Graph tags and robots directive through `<Seo>` (`src/lib/seo.tsx`).
- Salon pages carry `HairSalon` and `BreadcrumbList` JSON-LD built from the listing's own data. Ratings are deliberately excluded (see below).
- Booking, appointments, setup and dashboard pages are `noindex` and disallowed in `robots.txt`.
- Clock-dependent details ("open now", next free time) are computed in the browser, never baked into HTML.
- **Set `VITE_SITE_URL`** to the real origin before building; canonicals and the sitemap use `https://moro.example` until then.
- `vercel.json` has the clean-URL, redirect and rewrite rules for hosting on Vercel. Other hosts need the equivalent: serve `<path>.html` at `/<path>`, and send the private routes to `app.html`.

## Where things are

| Path | What it holds |
| --- | --- |
| `src/brand.ts` | Brand name, locale, currency, site URL. |
| `src/styles.css` | Design tokens (colour, type, radii, shadows, motion) and the type scale. |
| `src/components/Triptych.tsx` | The hero mirror and its animation loop. |
| `src/data/images.ts` | Every photograph, by key. Swap imagery or point to local files here. |
| `src/data/salons.ts`, `catalogue.ts` | Seed salons, the service menu, cities and neighbourhoods. |
| `src/data/reviews.ts` | Sample reviews (demo content). |
| `src/lib/store.tsx` | App state and actions, persisted to `localStorage` (`moro:v1`). |
| `src/lib/time.ts` | Availability, opening hours, formatting. |
| `src/lib/routes.ts`, `seo.tsx` | URL slugs and paths; metadata and structured data. |
| `src/pages/` | Home, Explore (discovery), Salon, Book, Booking, Appointments. |
| `src/pages/partners/` | Owner landing page, setup wizard, dashboard. |

## Demo behaviour worth knowing

- There is no backend. Bookings, blocked slots and owner edits live in the browser, shared by the customer and owner sides. Clear `moro:v1` to reset.
- Salons are fictional. Availability for seed salons is generated (stable per salon/day), then reduced by real bookings and owner-blocked slots.
- Review counts and the reviews on salon pages are sample data. They are labelled on the page and kept out of structured data.
- Salons created through the owner wizard exist only in that browser, so they are `noindex` and not in the sitemap.
- "Sign in" asks only for a name and phone number; there are no accounts or passwords.
- Photography is hot-linked from Unsplash; address search in the owner flow uses OpenStreetMap's Nominatim.
