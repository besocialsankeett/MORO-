import { brand } from "../brand";
import type { Block, Booking, Salon } from "../types";

export const SLOT_STEP = 30;

export const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const fromMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parseKey = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};
export const todayKey = () => dateKey(new Date());
export const upcomingDays = (n: number) => Array.from({ length: n }, (_, i) => dateKey(addDays(new Date(), i)));

/* ── Formatting ─────────────────────────────────────────── */

export const inr = (n: number) =>
  new Intl.NumberFormat(brand.locale, { style: "currency", currency: brand.currency, maximumFractionDigits: 0 }).format(n);

export const fmtTime = (t: string) => {
  const m = toMin(t);
  const h = Math.floor(m / 60);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m % 60).padStart(2, "0")} ${suffix}`;
};

export const fmtDuration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr`;
};

const fmt = (k: string, o: Intl.DateTimeFormatOptions) => parseKey(k).toLocaleDateString(brand.locale, o);
export const fmtDateLong = (k: string) => fmt(k, { weekday: "long", day: "numeric", month: "long" });
export const fmtDateShort = (k: string) => fmt(k, { weekday: "short", day: "numeric", month: "short" });
export const fmtWeekday = (k: string) => fmt(k, { weekday: "short" });

/** "Today", "Tomorrow", otherwise "Sat 17 Oct". */
export const fmtRelDay = (k: string) => {
  if (k === todayKey()) return "Today";
  if (k === dateKey(addDays(new Date(), 1))) return "Tomorrow";
  return fmtDateShort(k);
};

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/* ── Opening hours ──────────────────────────────────────── */

export function openStatus(salon: Salon, now = new Date()): { open: boolean; label: string } {
  const h = salon.hours[now.getDay()];
  const mins = now.getHours() * 60 + now.getMinutes();
  if (h && mins >= toMin(h.open) && mins < toMin(h.close)) return { open: true, label: `Open · closes ${fmtTime(h.close)}` };
  if (h && mins < toMin(h.open)) return { open: false, label: `Closed · opens ${fmtTime(h.open)}` };
  for (let i = 1; i <= 7; i++) {
    const next = salon.hours[(now.getDay() + i) % 7];
    if (next) return { open: false, label: `Closed · opens ${i === 1 ? "tomorrow" : WEEKDAYS[(now.getDay() + i) % 7]} ${fmtTime(next.open)}` };
  }
  return { open: false, label: "Closed" };
}

/* ── Availability ───────────────────────────────────────── */

/** Small stable string hash, used to give demo salons believable busy slots. */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100;
}

export interface SlotCtx {
  bookings: Booking[];
  blocks: Block[];
}
export interface Slot {
  time: string;
  available: boolean;
}

const active = (b: Booking) => b.status === "pending" || b.status === "confirmed";

/**
 * Every bookable start time for a salon on a date.
 * Times that have already passed today are left out. A slot is unavailable when it overlaps a real booking,
 * is blocked by the owner, or is "taken" in the generated demo schedule.
 */
export function getSlots(salon: Salon, date: string, duration: number, ctx: SlotCtx, stylistId: string | null = null): Slot[] {
  const hours = salon.hours[parseKey(date).getDay()];
  if (!hours) return [];
  const open = toMin(hours.open);
  const close = toMin(hours.close);
  const now = new Date();
  const earliest = date === todayKey() ? now.getHours() * 60 + now.getMinutes() + 45 : -1;
  const dayBookings = ctx.bookings.filter((b) => b.salonId === salon.id && b.date === date && active(b));
  const dayBlocks = new Set(ctx.blocks.filter((b) => b.salonId === salon.id && b.date === date).map((b) => toMin(b.time)));

  const slots: Slot[] = [];
  for (let t = open; t + duration <= close; t += SLOT_STEP) {
    if (t < earliest) continue; // already gone today — not worth showing
    let available = true;
    for (let c = t; c < t + duration; c += SLOT_STEP) if (dayBlocks.has(c)) available = false;
    if (available) {
      available = !dayBookings.some((b) => {
        const s = toMin(b.time);
        const sameChair = !stylistId || !b.stylistId || b.stylistId === stylistId;
        return sameChair && t < s + b.duration && s < t + duration;
      });
    }
    if (available && salon.busy > 0) available = hash(`${salon.id}|${date}|${t}|${stylistId ?? ""}`) >= salon.busy;
    slots.push({ time: fromMin(t), available });
  }
  return slots;
}

export function nextAvailable(salon: Salon, ctx: SlotCtx, days = 7): { date: string; time: string } | null {
  for (const date of upcomingDays(days)) {
    const slot = getSlots(salon, date, SLOT_STEP, ctx).find((s) => s.available);
    if (slot) return { date, time: slot.time };
  }
  return null;
}

/** Whole hours from now until an appointment starts (negative once it has begun). */
export const hoursUntil = (date: string, time: string) => {
  const d = parseKey(date);
  d.setMinutes(toMin(time));
  return (d.getTime() - Date.now()) / 36e5;
};

/* ── Geography ──────────────────────────────────────────── */

export function distanceKm(a: [number, number], b: [number, number]) {
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
export const fmtKm = (km: number) => (km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`);
