import { Check, MapPin, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { catalogue, categories, cities, cityById } from "../data/catalogue";
import { ownerLibrary } from "../data/images";
import { fmtTime, fromMin, WEEKDAYS } from "../lib/time";
import type { CategoryId, Salon, Service } from "../types";
import { MapView } from "./Map";
import { ArchLoader, Button, cx, Field, Img } from "./ui";

/** Every editor takes the salon being edited and reports a partial update. */
export interface EditorProps {
  salon: Salon;
  onChange: (patch: Partial<Salon>) => void;
}

const uid = () => Math.random().toString(36).slice(2, 8);
const TIMES = Array.from({ length: 37 }, (_, i) => fromMin(360 + i * 30)); // 6:00 → 24:00
const DURATIONS = [15, 30, 45, 60, 75, 90, 120, 150, 180];

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cx("relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200", checked ? "bg-ink" : "bg-line")}>
      <span className={cx("absolute top-1 left-1 size-5 rounded-full bg-paper shadow-sm transition-transform duration-200 ease-out-soft", checked && "translate-x-5")} />
    </button>
  );
}

/* ── Profile ────────────────────────────────────────────── */

export function ProfileEditor({ salon, onChange }: EditorProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Salon name">
          <input className="field" value={salon.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="e.g. Studio Marigold" />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="One-line introduction" hint={`${salon.tagline.length}/80`}>
          <input className="field" maxLength={80} value={salon.tagline} onChange={(e) => onChange({ tagline: e.target.value })} placeholder="What should people know first?" />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="About your salon">
          <textarea className="field !h-32 resize-none py-3" value={salon.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="Your story, what you’re known for, what a first visit is like." />
        </Field>
      </div>
      <Field label="Contact number">
        <input className="field" value={salon.phone} onChange={(e) => onChange({ phone: e.target.value })} placeholder="+91" inputMode="tel" />
      </Field>
      <Field label="Free cancellation window">
        <select className="field" value={salon.cancelHours} onChange={(e) => onChange({ cancelHours: Number(e.target.value) })}>
          {[1, 2, 3, 6, 12, 24].map((h) => (
            <option key={h} value={h}>
              Up to {h} {h === 1 ? "hour" : "hours"} before
            </option>
          ))}
        </select>
      </Field>
      <div className="flex items-center justify-between gap-6 rounded-lg border border-line p-4 sm:col-span-2">
        <div>
          <p className="font-medium">Confirm bookings instantly</p>
          <p className="t-meta mt-0.5">Turn off to approve each request yourself before it’s confirmed.</p>
        </div>
        <Toggle checked={salon.instantConfirm} onChange={(v) => onChange({ instantConfirm: v })} label="Confirm bookings instantly" />
      </div>
    </div>
  );
}

/* ── Photos ─────────────────────────────────────────────── */

export function PhotoEditor({ salon, onChange }: EditorProps) {
  const chosen = [salon.cover, ...salon.gallery].filter(Boolean);
  const toggle = (key: string) => {
    const next = chosen.includes(key) ? chosen.filter((k) => k !== key) : [...chosen, key].slice(0, 5);
    onChange({ cover: next[0] ?? "", gallery: next.slice(1) });
  };
  return (
    <div>
      <p className="mb-4 text-[0.9375rem] text-ink-2">Choose up to five. The first one you pick becomes your cover photo.</p>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {ownerLibrary.map((key) => {
          const i = chosen.indexOf(key);
          return (
            <button key={key} type="button" onClick={() => toggle(key)} aria-pressed={i >= 0} className={cx("group relative overflow-hidden rounded-md transition-shadow", i >= 0 && "ring-2 ring-ink ring-offset-2 ring-offset-paper")}>
              <Img src={key} alt="" w={280} className="aspect-[4/3]" imgClassName="group-hover:scale-105" />
              {i >= 0 && (
                <span className="absolute top-1.5 left-1.5 inline-flex h-6 items-center gap-1 rounded-sm bg-ink px-2 text-[0.8125rem] font-medium text-paper">
                  {i === 0 ? "Cover" : <Check className="size-3.5" strokeWidth={3} />}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="t-meta mt-3">Demo library. In a live product this is where your own uploads would go.</p>
    </div>
  );
}

/* ── Location ───────────────────────────────────────────── */

interface Hit {
  display_name: string;
  lat: string;
  lon: string;
}

export function LocationEditor({ salon, onChange }: EditorProps) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const city = cityById(salon.city);

  const search = async () => {
    if (q.trim().length < 3) return;
    setBusy(true);
    setFailed(false);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=4&countrycodes=in&q=${encodeURIComponent(`${q}, ${city.name}`)}`);
      setHits(await r.json());
    } catch {
      setFailed(true);
      setHits(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="City">
        <select
          className="field"
          value={salon.city}
          onChange={(e) => {
            const c = cityById(e.target.value);
            onChange({ city: c.id, area: c.areas[0], coords: c.you });
            setHits(null);
          }}
        >
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Neighbourhood">
        <select className="field" value={salon.area} onChange={(e) => onChange({ area: e.target.value })}>
          {city.areas.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Street address">
          <input className="field" value={salon.address} onChange={(e) => onChange({ address: e.target.value })} placeholder="Shop, building, street" />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <p className="mb-1.5 text-sm font-medium">Pin your location</p>
        <div className="flex gap-2">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-mute" />
            <input className="field !pl-11" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())} placeholder={`Search a street or landmark in ${city.name}`} aria-label="Search for an address" />
          </label>
          <Button variant="outline" className="!h-12" onClick={search} disabled={q.trim().length < 3}>
            {busy ? <ArchLoader className="h-4" label="Searching" /> : "Find"}
          </Button>
        </div>
        {failed && <p className="mt-2 text-sm text-bad">Address search is unavailable right now. You can still drag the pin on the map.</p>}
        {hits && hits.length === 0 && <p className="mt-2 text-sm text-mute">No matches. Try a nearby landmark, or place the pin by hand.</p>}
        {hits && hits.length > 0 && (
          <ul className="mt-2 overflow-hidden rounded-lg border border-line bg-card">
            {hits.map((h) => (
              <li key={h.lat + h.lon} className="border-b border-line-2 last:border-0">
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-4 py-3 text-left text-[0.9375rem] hover:bg-ink/6"
                  onClick={() => {
                    onChange({ coords: [Number(h.lat), Number(h.lon)], address: salon.address || h.display_name.split(",").slice(0, 3).join(",") });
                    setHits(null);
                  }}
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
                  {h.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 h-72 overflow-hidden rounded-lg border border-line">
          <MapView center={salon.coords} zoom={15} picker={{ value: salon.coords, onChange: (coords) => onChange({ coords }) }} />
        </div>
        <p className="t-meta mt-2">Drag the pin or click the map to place it exactly on your doorstep.</p>
      </div>
    </div>
  );
}

/* ── Services ───────────────────────────────────────────── */

export function ServicesEditor({ salon, onChange }: EditorProps) {
  const [cat, setCat] = useState<CategoryId>("haircuts");
  const update = (id: string, patch: Partial<Service>) => onChange({ services: salon.services.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const remove = (id: string) => onChange({ services: salon.services.filter((s) => s.id !== id) });
  const add = (s: Service) => onChange({ services: [...salon.services, s] });
  const suggestions = catalogue.filter((c) => c.category === cat && !salon.services.some((s) => s.id === c.id));
  const mine = salon.services.filter((s) => s.category === cat);

  return (
    <div>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {categories.map((c) => {
          const n = salon.services.filter((s) => s.category === c.id).length;
          return (
            <button key={c.id} type="button" onClick={() => setCat(c.id)} className={cx("inline-flex h-10 shrink-0 items-center gap-2 rounded-sm border px-4 text-[0.9375rem] transition-colors", cat === c.id ? "border-ink bg-ink text-paper" : "border-line hover:border-ink")}>
              {c.name}
              {n > 0 && <span className={cx("text-[0.8125rem] tabular-nums", cat === c.id ? "text-paper/60" : "text-mute")}>{n}</span>}
            </button>
          );
        })}
      </div>

      <ul className="mt-5 space-y-2.5">
        {mine.map((s) => (
          <li key={s.id} className="grid grid-cols-[1fr_auto] items-center gap-2.5 rounded-lg border border-line bg-card p-3 sm:grid-cols-[1fr_130px_130px_auto]">
            <input className="field !h-11 !bg-transparent font-medium" value={s.name} onChange={(e) => update(s.id, { name: e.target.value })} placeholder="Service name" aria-label="Service name" />
            <button type="button" onClick={() => remove(s.id)} aria-label={`Remove ${s.name}`} className="grid size-10 place-items-center rounded-full text-mute hover:bg-bad-tint hover:text-bad sm:order-last">
              <Trash2 className="size-4" />
            </button>
            <select className="field !h-11" value={s.duration} onChange={(e) => update(s.id, { duration: Number(e.target.value) })} aria-label="Duration">
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </select>
            <label className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-mute">₹</span>
              <input className="field !h-11 !pl-8 tabular-nums" type="number" min={0} step={50} value={s.price || ""} onChange={(e) => update(s.id, { price: Math.max(0, Number(e.target.value)) })} aria-label="Price in rupees" />
            </label>
          </li>
        ))}
        {mine.length === 0 && <li className="rounded-lg border border-dashed border-line px-5 py-7 text-center text-ink-2">No {categories.find((c) => c.id === cat)!.name.toLowerCase()} on your menu yet. Add one below.</li>}
      </ul>

      <div className="mt-5">
        <p className="t-eyebrow mb-3">Quick add</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s.id} type="button" onClick={() => add(s)} className="inline-flex h-10 items-center gap-1.5 rounded-sm border border-dashed border-line px-4 text-[0.9375rem] text-ink-2 transition-colors hover:border-solid hover:border-ink hover:text-ink">
              <Plus className="size-4" /> {s.name}
            </button>
          ))}
          <button type="button" onClick={() => add({ id: `custom-${uid()}`, category: cat, name: "", description: "", duration: 30, price: 500 })} className="inline-flex h-10 items-center gap-1.5 rounded-sm bg-sand px-4 text-[0.9375rem] font-medium hover:bg-line">
            <Plus className="size-4" /> Custom service
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Opening hours ──────────────────────────────────────── */

export function HoursEditor({ salon, onChange }: EditorProps) {
  const set = (day: number, value: Salon["hours"][number]) => onChange({ hours: salon.hours.map((h, i) => (i === day ? value : h)) });
  const firstOpen = salon.hours.find(Boolean);
  return (
    <div>
      <ul className="divide-y divide-line-2 border-y border-line-2">
        {WEEKDAYS.map((_, i) => {
          const d = (i + 1) % 7; // Monday first
          const h = salon.hours[d];
          return (
            <li key={d} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5">
              <Toggle checked={!!h} onChange={(v) => set(d, v ? { open: firstOpen?.open ?? "10:00", close: firstOpen?.close ?? "20:00" } : null)} label={`Open on ${WEEKDAYS[d]}`} />
              <span className={cx("w-28 text-[1.0625rem]", h ? "font-medium" : "text-mute")}>{WEEKDAYS[d]}</span>
              {h ? (
                <div className="ml-auto flex items-center gap-2">
                  <select className="field !h-11 !w-[122px]" value={h.open} onChange={(e) => set(d, { ...h, open: e.target.value })} aria-label={`${WEEKDAYS[d]} opening time`}>
                    {TIMES.filter((t) => t < h.close).map((t) => (
                      <option key={t} value={t}>
                        {fmtTime(t)}
                      </option>
                    ))}
                  </select>
                  <span className="text-mute">to</span>
                  <select className="field !h-11 !w-[122px]" value={h.close} onChange={(e) => set(d, { ...h, close: e.target.value })} aria-label={`${WEEKDAYS[d]} closing time`}>
                    {TIMES.filter((t) => t > h.open && t < "24:00").map((t) => (
                      <option key={t} value={t}>
                        {fmtTime(t)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="ml-auto text-mute">Closed</span>
              )}
            </li>
          );
        })}
      </ul>
      <p className="t-meta mt-3">Clients can book in 30-minute steps inside these hours. Block one-off times from the Availability tab.</p>
    </div>
  );
}
