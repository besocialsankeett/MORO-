import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Triptych } from "../components/Triptych";
import { fromPrice, NextSlot } from "../components/SalonCard";
import { SearchDesk, type DeskValue } from "../components/SearchBar";
import { Button, cx, Img, Mirror, Rating, Reveal } from "../components/ui";
import { brand } from "../brand";
import { categories, cityById } from "../data/catalogue";
import { paths } from "../lib/routes";
import { Seo, siteJsonLd } from "../lib/seo";
import { useStore } from "../lib/store";
import { distanceKm, fmtDuration, fmtKm, inr } from "../lib/time";
import type { Salon } from "../types";

const delay = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;
const pad = (n: number) => String(n).padStart(2, "0");

/* ── Hero ───────────────────────────────────────────────── */

function Hero({ local, cityName }: { local: Salon[]; cityName: string }) {
  const [desk, setDesk] = useState<DeskValue>({ area: null, service: null, date: null });
  const [active, setActive] = useState<number | null>(null);

  // The mirror shows where you might be about to go: the three best matches for the desk.
  // Left wing, centre, right wing — the strongest match takes the centre.
  const shown = useMemo(() => {
    const match = local.filter((s) => (!desk.area || s.area === desk.area) && (!desk.service || s.services.some((x) => x.category === desk.service)));
    const rest = local.filter((s) => !match.includes(s));
    const top = [...match, ...rest].slice(0, 3);
    while (top.length && top.length < 3) top.push(top[top.length - 1]);
    return top.length ? [top[1], top[0], top[2]] : [];
  }, [local, desk.area, desk.service]);

  const panels = useMemo(() => shown.map((s) => ({ photo: s.cover, label: `Inside ${s.name}, ${s.area}`, href: paths.salon(s) })), [shown]);

  return (
    <section className="relative" aria-label="Find a salon">
      <div className="shell flex flex-col items-center pt-8 pb-8 lg:h-[clamp(560px,calc(100svh-160px),860px)] lg:pt-9 lg:pb-6">
        <h1 className="text-center">
          <span className="t-eyebrow anim-fade mb-5 block">Salons &amp; barbers — {cityName}</span>
          <span className="t-display-1 anim-fade-up block !text-[clamp(2.9rem,6.3vw,6.5rem)]" style={delay(0.05)}>
            Look forward <br className="sm:hidden" />
            to the <em>mirror.</em>
          </span>
        </h1>
        <p className="anim-fade-up mt-4 max-w-xl text-center text-[1.0625rem] text-ink-2" style={delay(0.2)}>
          {brand.name} finds you a good salon nearby and holds an exact time. Real prices, live availability, no phone calls.
        </p>

        {/* The mirror. Each panel is a salon; the labels beneath are the same three as plain links. */}
        <div className="mt-5 w-full max-w-[46rem] flex-1 lg:mt-3 lg:min-h-0">{panels.length === 3 && <Triptych panels={panels} active={active} onActive={setActive} className="aspect-[6/5] w-full lg:aspect-auto lg:h-full" />}</div>

        {/* One label per panel — the same three salons as real links, for touch, keyboard and crawlers. */}
        <ul className="anim-fade-up mt-2 grid w-full max-w-[46rem] border-t border-ink/20 sm:grid-cols-3 sm:divide-x sm:divide-ink/15" style={delay(0.55)}>
          {shown.map((s, i) => (
            <li key={`${s.id}-${i}`} className="max-sm:border-b max-sm:border-ink/15">
              <Link
                to={paths.salon(s)}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className={cx("group relative flex items-center justify-between gap-3 px-1 py-3.5 transition-colors sm:block sm:px-4 sm:py-4 sm:text-center", active === i && "bg-card")}
              >
                <span aria-hidden className={cx("absolute inset-x-0 -top-px h-px bg-accent transition-transform duration-500 ease-out-soft max-sm:hidden", active === i ? "scale-x-100" : "scale-x-0")} />
                <span className="min-w-0">
                  <span className="font-display block truncate text-[1.25rem] leading-tight">{s.name}</span>
                  <span className="mt-1 block truncate text-sm text-mute">
                    {s.area} · from {inr(fromPrice(s))}
                  </span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-mute sm:hidden" />
              </Link>
            </li>
          ))}
        </ul>

      </div>

      <div className="anim-fade-up relative z-30" style={delay(0.65)}>
        <SearchDesk value={desk} onChange={setDesk} />
      </div>
    </section>
  );
}

/* ── The index: nearby salons as a ruled list, not a row of cards ── */

function SalonIndex({ salons, cityName, total }: { salons: Salon[]; cityName: string; total: number }) {
  const { origin } = useStore();
  const [active, setActive] = useState(0);
  const shown = salons[Math.min(active, salons.length - 1)];
  if (!shown) return null;
  return (
    <section className="shell pt-20 md:pt-32" aria-labelledby="near-you">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div>
          <p className="t-eyebrow mb-4">Nearest to you — {cityName}</p>
          <h2 id="near-you" className="t-display-2">
            Open chairs, <em>close by</em>
          </h2>
        </div>
        <Link to={paths.salons} className="group inline-flex items-center gap-2 border-b border-ink pb-1 text-[0.9375rem] font-semibold">
          All {total} salons in {cityName}
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="mt-10 grid gap-x-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <ol className="border-t border-ink">
          {salons.map((s, i) => (
            <li key={s.id} className="border-b border-ink/15">
              <Link
                to={paths.salon(s)}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className={cx("group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 py-5 transition-colors md:grid-cols-[3.5rem_minmax(0,1fr)_9.5rem_12.5rem] md:gap-x-6 md:py-6", i === active && "lg:bg-card")}
              >
                <span className="font-mono text-[0.8125rem] text-mute max-md:hidden md:pl-3">{pad(i + 1)}</span>
                <Img src={s.cover} alt="" w={160} h={200} className="aspect-[4/5] w-16 md:hidden" />
                <span className="min-w-0">
                  <span className={cx("t-display-3 block transition-[font-style]", i === active && "lg:italic")}>{s.name}</span>
                  <span className="mt-1.5 block text-[0.9375rem] text-ink-2">
                    {s.area} <span className="text-mute">· {fmtKm(distanceKm(origin, s.coords))}</span>
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 md:hidden">
                    <span className="text-[0.9375rem]">
                      <span className="text-mute">From</span> <span className="font-semibold">{inr(fromPrice(s))}</span>
                    </span>
                    <NextSlot salon={s} />
                  </span>
                </span>
                <span className="max-md:hidden">
                  <Rating value={s.rating} count={s.reviews || undefined} />
                  <span className="mt-1 block text-[0.9375rem]">
                    <span className="text-mute">From</span> <span className="font-semibold tabular-nums">{inr(fromPrice(s))}</span>
                  </span>
                </span>
                <span className="flex items-center justify-end gap-5 md:pr-3">
                  <NextSlot salon={s} className="max-md:hidden" />
                  <ArrowUpRight className="size-5 text-mute transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink" />
                </span>
              </Link>
            </li>
          ))}
        </ol>

        {/* The hovered salon, in the mirror shape. Desktop only: rows carry their own photo on mobile. */}
        <div className="hidden lg:block">
          <div className="sticky top-28">
            {/* All five photos are stacked and cross-faded, so moving down the list never shows an empty frame. */}
            <Link to={paths.salon(shown)} tabIndex={-1} aria-hidden className="block">
              <Mirror className="aspect-[2/3]">
                {salons.map((s, i) => (
                  <Img key={s.id} src={s.cover} alt="" w={680} h={1020} className={cx("!absolute inset-0 !bg-transparent transition-opacity duration-500", s.id === shown.id ? "opacity-100" : "opacity-0")} eager={i === 0} />
                ))}
              </Mirror>
            </Link>
            <p className="mt-4 text-[0.9375rem] text-ink-2">{shown.tagline}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Services: six panels that open like a fan ──────────── */

function Services({ local, cityName }: { local: Salon[]; cityName: string }) {
  const [open, setOpen] = useState(0);
  const rows = categories.map((c) => {
    const offering = local.filter((s) => s.services.some((x) => x.category === c.id));
    // Proper appointments only: a 15-minute fringe trim would make the headline price misleading.
    const prices = offering.flatMap((s) => s.services.filter((x) => x.category === c.id && x.duration >= 25).map((x) => x.price));
    return { ...c, count: offering.length, from: prices.length ? Math.min(...prices) : null };
  });
  return (
    <section id="services" className="shell scroll-mt-24 pt-20 md:pt-32" aria-labelledby="services-title">
      <div className="grid gap-6 md:grid-cols-2 md:items-end">
        <div>
          <p className="t-eyebrow mb-4">By service</p>
          <h2 id="services-title" className="t-display-2">
            What are you <em>in for?</em>
          </h2>
        </div>
        <p className="t-lead md:max-w-md md:justify-self-end">Start with what you need. We’ll show who does it well in {cityName}, what it costs, and when they’re free.</p>
      </div>

      <ul className="mt-10 flex flex-col gap-2 md:h-[520px] md:flex-row">
        {rows.map((c, i) => {
          const on = i === open;
          return (
            <li key={c.id} className={cx("relative min-w-0 overflow-hidden transition-[flex-grow] duration-700 ease-out-soft md:basis-0", on ? "md:grow-[5]" : "md:grow")} onMouseEnter={() => setOpen(i)}>
              <Link to={`${paths.salons}?service=${c.id}`} onFocus={() => setOpen(i)} className="group relative flex h-28 items-end bg-ink text-paper md:h-full">
                <span className={cx("absolute inset-0 transition-opacity duration-700 max-md:opacity-55", on ? "md:opacity-90" : "md:opacity-40")}>
                  <Img src={c.photo} alt="" w={900} className="size-full !bg-ink" imgClassName="group-hover:scale-[1.03]" />
                </span>
                <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(10_16_20/0.85),transparent_60%)]" />
                <span className="relative flex w-full items-end justify-between gap-4 p-5 md:p-6">
                  <span className="min-w-0">
                    <span className="font-mono block text-[0.75rem] tracking-[0.08em] text-paper/60">{pad(i + 1)}</span>
                    <span className={cx("t-display-3 mt-1 block whitespace-nowrap", !on && "md:rotate-180 md:[writing-mode:vertical-rl]")}>{c.name}</span>
                    <span className={cx("mt-2 block text-[0.9375rem] text-paper/75 transition-opacity duration-500", on ? "md:opacity-100" : "md:pointer-events-none md:absolute md:opacity-0")}>
                      {c.blurb}
                      {c.count > 0 && c.from != null && (
                        <>
                          {" · "}
                          {c.count} {c.count === 1 ? "salon" : "salons"} from {inr(c.from)}
                        </>
                      )}
                    </span>
                  </span>
                  <ArrowUpRight className={cx("size-6 shrink-0 transition-opacity duration-500", on ? "opacity-100" : "md:opacity-0")} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ── Page ───────────────────────────────────────────────── */

export default function Home() {
  const { city, salons, origin } = useStore();
  const c = cityById(city);
  const local = useMemo(() => salons.filter((s) => s.city === city).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)), [salons, city]);
  const near = useMemo(() => [...local].sort((a, b) => distanceKm(origin, a.coords) - distanceKm(origin, b.coords)).slice(0, 5), [local, origin]);
  const featured = local.find((s) => s.badge === "Editor's pick") ?? local[0];

  return (
    <>
      <Seo title={`${brand.name} — ${brand.tagline}`} description={brand.description} path="/" image={local[0]?.cover} jsonLd={siteJsonLd()} />

      <Hero local={local} cityName={c.name} />
      <SalonIndex salons={near} cityName={c.name} total={local.length} />
      <Services local={local} cityName={c.name} />

      {/* ── The pick: one salon, given room ── */}
      {featured && (
        <section className="mt-20 bg-ink text-paper md:mt-32" aria-labelledby="pick-title">
          <div className="shell grid gap-x-16 gap-y-10 py-16 md:py-24 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-end">
            <Reveal>
              <Link to={paths.salon(featured)} className="group block">
                <Mirror onDark frame={8} className="mx-auto aspect-[2/3] max-w-[420px]">
                  <Img src={featured.cover} alt={`Inside ${featured.name}, ${featured.area}`} w={840} h={1260} className="size-full !bg-transparent" imgClassName="group-hover:scale-[1.03]" />
                </Mirror>
              </Link>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="t-eyebrow !text-paper/55">
                The {brand.name} pick — {featured.area}
              </p>
              <h2 id="pick-title" className="t-display-1 mt-5 !text-[clamp(3rem,6.6vw,7rem)]">
                {featured.name}
              </h2>
              <p className="mt-7 max-w-xl text-[1.0625rem] leading-relaxed text-paper/75">{featured.description}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-paper">
                <Rating value={featured.rating} count={featured.reviews} className="[&_.text-mute]:!text-paper/55" />
                <NextSlot salon={featured} className="!text-glint" />
              </div>
              <ul className="mt-9 max-w-xl border-t border-paper/25">
                {featured.services.slice(0, 3).map((s) => (
                  <li key={s.id} className="flex items-baseline justify-between gap-6 border-b border-paper/15 py-3.5">
                    <span>
                      {s.name} <span className="font-mono ml-2 text-[0.8125rem] text-paper/50">{fmtDuration(s.duration)}</span>
                    </span>
                    <span className="font-semibold tabular-nums">{inr(s.price)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Button to={paths.book(featured)} variant="accent" size="lg">
                  Book {featured.name}
                </Button>
                <Link to={paths.salon(featured)} className="text-[0.9375rem] font-semibold underline decoration-paper/35 underline-offset-[6px] hover:decoration-paper">
                  See the full menu
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── How it works, and a word to owners ── */}
      <section className="shell grid gap-x-16 gap-y-16 pt-20 md:pt-32 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]" aria-labelledby="how-title">
        <div>
          <p className="t-eyebrow mb-4">How it works</p>
          <h2 id="how-title" className="t-display-2">
            Booked in <em>a minute</em>
          </h2>
          <ol className="mt-10 border-t border-ink">
            {[
              ["Find your place", "Search by neighbourhood or service. Every salon shows its photos, menu and prices upfront."],
              ["Pick an exact time", "See what’s free over the next two weeks. Choose your stylist, or leave it open."],
              ["Just turn up", "Your slot is held the moment you confirm. Pay at the salon; cancel free if plans change."],
            ].map(([t, d], i) => (
              <li key={t} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-2 border-b border-ink/15 py-6 md:grid-cols-[3.5rem_minmax(0,14rem)_minmax(0,1fr)] md:gap-x-6">
                <span className="pt-1.5 text-[0.8125rem] tabular-nums text-mute">{pad(i + 1)}</span>
                <h3 className="t-title">{t}</h3>
                <p className="text-ink-2 max-md:col-start-2 max-md:mt-2">{d}</p>
              </li>
            ))}
          </ol>
        </div>
        <aside className="flex flex-col justify-end border-t border-ink pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12" aria-labelledby="owners-title">
          <p className="t-eyebrow mb-4">For salon owners</p>
          <h2 id="owners-title" className="t-display-3">
            Run a salon? Let clients book while your hands are busy.
          </h2>
          <p className="mt-4 text-ink-2">Set your menu and hours once. {brand.name} takes appointments around the clock.</p>
          <div className="mt-7">
            <Button to={paths.partners} size="lg">
              List your salon <ArrowRight className="size-[18px]" />
            </Button>
          </div>
        </aside>
      </section>
    </>
  );
}
