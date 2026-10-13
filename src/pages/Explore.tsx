import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, LayoutGrid, Map as MapIcon, Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MapView } from "../components/Map";
import { fromPrice, SalonCard, SalonCardSkeleton } from "../components/SalonCard";
import { Button, Chip, cx, EASE, Empty, MenuItem, Modal, Popover } from "../components/ui";
import { categories, cities, cityById } from "../data/catalogue";
import { brand } from "../brand";
import { paths } from "../lib/routes";
import { Seo } from "../lib/seo";
import { useStore } from "../lib/store";
import { distanceKm, fmtRelDay, getSlots, inr, SLOT_STEP, upcomingDays } from "../lib/time";

const PRICE = [
  { id: "1", label: "Under ₹500", test: (p: number) => p < 500 },
  { id: "2", label: "₹500 – ₹1,000", test: (p: number) => p >= 500 && p <= 1000 },
  { id: "3", label: "₹1,000 +", test: (p: number) => p > 1000 },
];
const RATING = [
  { id: "4.5", label: "4.5 and up" },
  { id: "4", label: "4.0 and up" },
];
const SORT = [
  { id: "relevance", label: "Recommended" },
  { id: "distance", label: "Nearest" },
  { id: "rating", label: "Top rated" },
  { id: "price", label: "Price: low to high" },
];

type Opt = { id: string; label: string };

/** Desktop filter: a pill that opens a short list. */
function FilterPill({ label, value, options, onChange }: { label: string; value: string | null; options: Opt[]; onChange: (v: string | null) => void }) {
  const current = options.find((o) => o.id === value);
  return (
    <Popover
      trigger={({ open, toggle }) => (
        <Chip active={!!current} onClick={toggle} aria-expanded={open}>
          {current ? current.label : label}
          {current ? (
            <X
              className="-mr-1 size-4 opacity-70 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            />
          ) : (
            <ChevronDown className={cx("-mr-1 size-4 text-mute transition-transform", open && "rotate-180")} />
          )}
        </Chip>
      )}
    >
      {(close) => (
        <>
          <MenuItem active={!value} onClick={() => (onChange(null), close())}>
            Any
          </MenuItem>
          {options.map((o) => (
            <MenuItem key={o.id} active={o.id === value} onClick={() => (onChange(o.id), close())}>
              {o.label}
            </MenuItem>
          ))}
        </>
      )}
    </Popover>
  );
}

/** Mobile filter: the same options laid out as chips inside a sheet. */
function FilterGroup({ label, value, options, onChange }: { label: string; value: string | null; options: Opt[]; onChange: (v: string | null) => void }) {
  return (
    <div>
      <p className="mb-2.5 text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o.id} active={o.id === value} onClick={() => onChange(o.id === value ? null : o.id)}>
            {o.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

export default function Explore() {
  const { city, salons, origin, bookings, blocks, setCity } = useStore();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const c = cityById(city);

  const get = (k: string) => params.get(k);
  const set = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };

  // ?city= lets a link land on another city's list (used by the footer and the directory below).
  const cityParam = get("city");
  useEffect(() => {
    if (cityParam && cityParam !== city && cities.some((x) => x.id === cityParam)) setCity(cityParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityParam]);

  const q = get("q") ?? "";
  const service = get("service");
  const area = get("area");
  const price = get("price");
  const rating = get("rating");
  const rawDate = get("date");
  const days = useMemo(() => upcomingDays(7), []);
  const date = rawDate === "today" ? days[0] : rawDate && days.includes(rawDate) ? rawDate : null;
  const sort = get("sort") ?? "relevance";
  const view = get("view") === "map" ? "map" : "grid";

  const [sheet, setSheet] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

  // A brief skeleton whenever the result set changes makes filtering feel deliberate rather than jumpy.
  const signature = [city, q, service, area, price, rating, date, sort].join("|");
  // (Not on first load: the list is already in the prerendered page.)
  const [loading, setLoading] = useState(false);
  const first = useRef(true);
  const lastSignature = useRef(signature);
  useEffect(() => {
    if (lastSignature.current === signature) return;
    lastSignature.current = signature;
    first.current = false;
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 320);
    return () => clearTimeout(t);
  }, [signature]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = salons
      .filter((s) => s.city === city)
      .filter((s) => !area || s.area === area)
      .filter((s) => !service || s.services.some((x) => x.category === service))
      .filter((s) => !price || PRICE.find((p) => p.id === price)!.test(fromPrice(s)))
      .filter((s) => !rating || (s.rating ?? 0) >= Number(rating))
      .filter((s) => !date || getSlots(s, date, SLOT_STEP, { bookings, blocks }).some((x) => x.available))
      .filter((s) => {
        if (!needle) return true;
        const hay = [s.name, s.area, s.tagline, ...s.services.map((x) => x.name)].join(" ").toLowerCase();
        return hay.includes(needle);
      })
      .map((s) => ({ s, km: distanceKm(origin, s.coords) }));
    const score = (x: (typeof list)[number]) => (x.s.rating ?? 4.3) * 2 - x.km * 0.12 + Math.log10(x.s.reviews + 10) * 0.4;
    list.sort((a, b) => {
      if (sort === "distance") return a.km - b.km;
      if (sort === "rating") return (b.s.rating ?? 0) - (a.s.rating ?? 0) || b.s.reviews - a.s.reviews;
      if (sort === "price") return fromPrice(a.s) - fromPrice(b.s);
      return score(b) - score(a);
    });
    return list.map((x) => x.s);
  }, [salons, city, area, service, price, rating, date, q, sort, origin, bookings, blocks]);

  const areaOpts = c.areas.map((a) => ({ id: a, label: a }));
  const serviceOpts = categories.map((x) => ({ id: x.id, label: x.name }));
  const dateOpts = days.map((d) => ({ id: d, label: fmtRelDay(d) }));
  const filters: { key: string; label: string; value: string | null; options: Opt[] }[] = [
    { key: "service", label: "Service", value: service, options: serviceOpts },
    { key: "area", label: "Area", value: area, options: areaOpts },
    { key: "price", label: "Price", value: price, options: PRICE },
    { key: "rating", label: "Rating", value: rating, options: RATING },
    { key: "date", label: "Available on", value: date, options: dateOpts },
  ];
  const activeCount = filters.filter((f) => f.value).length;
  const clear = () => setParams(view === "map" ? { view: "map" } : {}, { replace: true });

  const title: ReactNode = service ? (
    <>
      {categories.find((x) => x.id === service)?.name} <em>in {area ?? c.name}</em>
    </>
  ) : (
    <>
      Salons <em>in {area ?? c.name}</em>
    </>
  );

  const grid = (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="skeleton" exit={{ opacity: 0 }} className={cx("grid gap-x-7 gap-y-12 sm:grid-cols-2", view === "grid" && "lg:grid-cols-3")}>
          {Array.from({ length: view === "grid" ? 6 : 4 }, (_, i) => (
            <SalonCardSkeleton key={i} />
          ))}
        </motion.div>
      ) : results.length === 0 ? (
        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-dashed border-ink/25">
          <Empty
            icon={<SearchX className="size-6" />}
            title="No salons match just yet"
            body={date ? "Nothing is free on that day with these filters. Try another date, or widen your search." : "Try removing a filter or searching a nearby neighbourhood."}
            action={
              <Button variant="outline" onClick={clear}>
                Clear all filters
              </Button>
            }
          />
        </motion.div>
      ) : (
        <motion.div key={signature} className={cx("grid gap-x-7 gap-y-12 sm:grid-cols-2", view === "grid" && "lg:grid-cols-3")}>
          {results.map((s, i) => (
            <motion.div key={s.id} initial={first.current ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE, delay: Math.min(i, 8) * 0.045 }}>
              <SalonCard salon={s} active={hover === s.id} onHover={view === "map" ? setHover : undefined} priority={i < 3} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="shell pt-8 md:pt-12">
      <Seo
        title={`Salons and barbers in ${c.name} — prices and live availability`}
        description={`Compare ${c.name}'s salons and barbershops on ${brand.name}: photos, service menus, prices and the next free appointment. Book an exact time online.`}
        path={paths.salons}
        image={results[0]?.cover}
      />
      <p className="t-eyebrow mb-4">Salons &amp; barbers</p>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="t-display-2">{title}</h1>
        <label className="relative block w-full sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-mute" />
          <input className="field !pl-11" placeholder="Search salons, areas or services" value={q} onChange={(e) => set("q", e.target.value || null)} aria-label="Search salons" />
        </label>
      </div>

      {/* Filter bar */}
      <div className="sticky top-[72px] z-30 -mx-5 mt-7 border-y border-ink/15 bg-paper px-5 py-3 md:-mx-10 md:px-10">
        <div className="flex items-center gap-2">
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {filters.map((f) => (
              <FilterPill key={f.key} label={f.label} value={f.value} options={f.options} onChange={(v) => set(f.key, v)} />
            ))}
            {activeCount > 0 && (
              <button type="button" onClick={clear} className="ml-1 text-[0.9375rem] text-ink-2 underline underline-offset-4 hover:text-ink">
                Clear all
              </button>
            )}
          </div>
          <Chip className="lg:hidden" active={activeCount > 0} onClick={() => setSheet(true)}>
            <SlidersHorizontal className="size-4" />
            Filters{activeCount > 0 && ` · ${activeCount}`}
          </Chip>

          <div className="ml-auto flex items-center gap-2">
            <Popover
              align="right"
              trigger={({ open, toggle }) => (
                <button type="button" onClick={toggle} aria-expanded={open} className="inline-flex h-10 items-center gap-1.5 rounded-sm px-3 text-[0.9375rem] hover:bg-ink/6">
                  <span className="hidden text-mute sm:inline">Sort</span>
                  <span className="font-medium">{SORT.find((o) => o.id === sort)?.label}</span>
                  <ChevronDown className={cx("size-4 text-mute transition-transform", open && "rotate-180")} />
                </button>
              )}
            >
              {(close) =>
                SORT.map((o) => (
                  <MenuItem key={o.id} active={o.id === sort} onClick={() => (set("sort", o.id === "relevance" ? null : o.id), close())}>
                    {o.label}
                  </MenuItem>
                ))
              }
            </Popover>
            <div className="flex rounded-sm border border-ink/25 p-0.5" role="group" aria-label="View">
              {(
                [
                  ["grid", LayoutGrid, "Grid"],
                  ["map", MapIcon, "Map"],
                ] as const
              ).map(([id, Icon, label]) => (
                <button key={id} type="button" aria-pressed={view === id} onClick={() => set("view", id === "map" ? "map" : null)} className={cx("inline-flex h-9 items-center gap-1.5 rounded-sm px-3 text-sm font-medium transition-colors", view === id ? "bg-ink text-paper" : "text-ink-2 hover:text-ink")}>
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="t-meta mt-6 mb-7" aria-live="polite">
        {loading ? "Finding salons…" : `${results.length} ${results.length === 1 ? "salon" : "salons"}${date ? ` with availability ${fmtRelDay(date).toLowerCase()}` : ""}`}
      </p>

      {view === "grid" ? (
        grid
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="order-2 lg:order-1">{grid}</div>
          <div className="order-1 lg:order-2">
            <div className="sticky top-[150px] h-[46vh] overflow-hidden border border-ink/20 lg:h-[calc(100dvh-180px)]">
              <MapView
                center={c.center}
                zoom={city === "mumbai" ? 11 : 12}
                pins={results.map((s) => ({ id: s.id, coords: s.coords, label: inr(fromPrice(s)) }))}
                activeId={hover}
                onPinClick={(id) => navigate(`${paths.salons}/${id}`)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Directory: every salon in every city, as plain links — for people changing city, and for crawlers. */}
      <nav className="mt-24 border-t border-ink pt-10" aria-labelledby="directory-title">
        <h2 id="directory-title" className="t-eyebrow">
          All salons on {brand.name}
        </h2>
        <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-3">
          {cities.map((ct) => (
            <div key={ct.id}>
              <Link to={`${paths.salons}?city=${ct.id}`} onClick={() => setCity(ct.id)} className="t-title hover:text-accent">
                {ct.name}
              </Link>
              <ul className="mt-3 space-y-1.5 text-[0.9375rem] text-ink-2">
                {salons
                  .filter((s) => s.city === ct.id)
                  .map((s) => (
                    <li key={s.id}>
                      <Link to={paths.salon(s)} className="hover:text-ink hover:underline hover:underline-offset-4">
                        {s.name}, {s.area}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <Modal open={sheet} onClose={() => setSheet(false)} title="Filters">
        <div className="space-y-7">
          {filters.map((f) => (
            <FilterGroup key={f.key} label={f.label} value={f.value} options={f.options} onChange={(v) => set(f.key, v)} />
          ))}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="lg" onClick={clear} disabled={!activeCount}>
              Clear
            </Button>
            <Button size="lg" full onClick={() => setSheet(false)}>
              Show {results.length} {results.length === 1 ? "salon" : "salons"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
