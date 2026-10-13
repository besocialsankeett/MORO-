import { ArrowRight, ChevronDown, LocateFixed } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { categories, cities, cityById } from "../data/catalogue";
import { useMediaQuery } from "../lib/hooks";
import { paths } from "../lib/routes";
import { useStore } from "../lib/store";
import { fmtRelDay, upcomingDays } from "../lib/time";
import { cx, MenuItem, Popover } from "./ui";

export interface DeskValue {
  area: string | null;
  service: string | null;
  date: string | null;
}

function Segment({ label, value, placeholder, up, children, wide }: { label: string; value: string | null; placeholder: string; up: boolean; wide?: boolean; children: (close: () => void) => ReactNode }) {
  return (
    <Popover
      side={up ? "top" : "bottom"}
      className={cx("w-full", wide ? "sm:w-80" : "sm:w-64")}
      trigger={({ open, toggle }) => (
        <button type="button" onClick={toggle} aria-expanded={open} className={cx("group flex h-[76px] w-full items-center gap-4 px-5 text-left transition-colors lg:h-[88px] lg:px-7", open ? "bg-card" : "hover:bg-card")}>
          <span className="min-w-0 flex-1">
            <span className="t-eyebrow block">{label}</span>
            <span className={cx("mt-1.5 block truncate text-[1.0625rem] lg:text-lg", value ? "font-semibold text-ink" : "text-ink-2")}>{value ?? placeholder}</span>
          </span>
          <ChevronDown className={cx("size-4 shrink-0 text-mute transition-transform duration-200", open && "rotate-180")} />
        </button>
      )}
    >
      {children}
    </Popover>
  );
}

/**
 * The booking desk: where, what, when — one ruled strip at the foot of the hero.
 * It reports its selection upward so the mirror can reflect a matching salon.
 */
export function SearchDesk({ value, onChange }: { value: DeskValue; onChange: (v: DeskValue) => void }) {
  const { city, geo, setCity, setGeo } = useStore();
  const navigate = useNavigate();
  const up = useMediaQuery("(min-width: 1024px)");
  const [typed, setTyped] = useState("");
  const [locating, setLocating] = useState<"idle" | "busy" | "denied">("idle");
  const c = cityById(city);
  const set = (patch: Partial<DeskValue>) => onChange({ ...value, ...patch });

  // Manual entry: type any neighbourhood or city we cover.
  const places = useMemo(() => {
    const all = cities.flatMap((ct) => [{ city: ct.id, area: null as string | null, label: `Anywhere in ${ct.name}`, hay: ct.name }, ...ct.areas.map((a) => ({ city: ct.id, area: a as string | null, label: `${a}, ${ct.name}`, hay: `${a} ${ct.name}` }))]);
    const needle = typed.trim().toLowerCase();
    const list = needle ? all.filter((p) => p.hay.toLowerCase().includes(needle)) : all.filter((p) => p.city === city);
    return list.slice(0, 8);
  }, [typed, city]);

  const locate = (close: () => void) => {
    if (!navigator.geolocation) return setLocating("denied");
    setLocating("busy");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGeo([p.coords.latitude, p.coords.longitude]);
        set({ area: null });
        setLocating("idle");
        close();
      },
      () => setLocating("denied"),
      { timeout: 8000 },
    );
  };

  const go = () => {
    const p = new URLSearchParams();
    if (value.area) p.set("area", value.area);
    if (value.service) p.set("service", value.service);
    if (value.date) p.set("date", value.date);
    navigate(`${paths.salons}${p.size ? `?${p}` : ""}`);
  };

  return (
    <form onSubmit={(e) => (e.preventDefault(), go())} role="search" aria-label="Find a salon" className="grid border-y border-ink bg-paper lg:grid-cols-[1.25fr_1fr_1fr_auto] lg:divide-x lg:divide-ink/15 max-lg:divide-y max-lg:divide-ink/15">
      <Segment label="Where" value={value.area ? `${value.area}, ${c.name}` : geo ? "Near me" : null} placeholder={`Anywhere in ${c.name}`} up={up} wide>
        {(close) => (
          <div>
            <input
              className="field mb-1.5"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type a neighbourhood or city"
              aria-label="Neighbourhood or city"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && places[0]) {
                  e.preventDefault();
                  setCity(places[0].city);
                  set({ area: places[0].area });
                  setTyped("");
                  close();
                }
              }}
            />
            {places.map((p) => (
              <MenuItem
                key={p.label}
                active={p.city === city && p.area === value.area && !geo}
                onClick={() => {
                  if (p.city !== city || geo) setCity(p.city);
                  set({ area: p.area });
                  setTyped("");
                  close();
                }}
              >
                {p.label}
              </MenuItem>
            ))}
            {places.length === 0 && <p className="px-3 py-2.5 text-[0.9375rem] text-mute">We’re not there yet. Try Mumbai, Pune or Bengaluru.</p>}
            <div className="mx-3 my-1.5 border-t border-line-2" />
            <button type="button" onClick={() => locate(close)} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[0.9375rem] hover:bg-ink/6">
              <LocateFixed className={cx("size-4", geo && "text-accent")} />
              {locating === "busy" ? "Finding you…" : geo ? "Using your location" : "Use my current location"}
            </button>
            {locating === "denied" && <p className="px-3 pb-2 text-sm text-mute">We couldn’t read your location. Pick a neighbourhood instead.</p>}
          </div>
        )}
      </Segment>

      <Segment label="Service" value={categories.find((x) => x.id === value.service)?.name ?? null} placeholder="Any service" up={up}>
        {(close) => (
          <>
            <MenuItem active={!value.service} onClick={() => (set({ service: null }), close())}>
              Any service
            </MenuItem>
            {categories.map((x) => (
              <MenuItem key={x.id} active={x.id === value.service} onClick={() => (set({ service: x.id }), close())}>
                {x.name}
              </MenuItem>
            ))}
          </>
        )}
      </Segment>

      <Segment label="When" value={value.date ? fmtRelDay(value.date) : null} placeholder="Any day" up={up}>
        {(close) => (
          <>
            <MenuItem active={!value.date} onClick={() => (set({ date: null }), close())}>
              Any day
            </MenuItem>
            {upcomingDays(7).map((d) => (
              <MenuItem key={d} active={d === value.date} onClick={() => (set({ date: d }), close())}>
                {fmtRelDay(d)}
              </MenuItem>
            ))}
          </>
        )}
      </Segment>

      <button type="submit" className="group flex h-[72px] items-center justify-center gap-3 bg-ink px-10 text-[1.0625rem] font-semibold text-paper transition-colors hover:bg-accent lg:h-auto">
        Find salons
        <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
      </button>
    </form>
  );
}
