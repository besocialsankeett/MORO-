import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { cityById } from "../data/catalogue";
import { seedSalons } from "../data/salons";
import type { Block, Booking, BookingStatus, Salon } from "../types";
import { findSalon } from "./routes";
import { addDays, dateKey, fromMin, toMin } from "./time";

/**
 * App state lives in one object persisted to localStorage. There is no
 * backend: this is the whole "database", shared by the customer and owner
 * sides so a booking made on one shows up on the other.
 */
interface State {
  city: string;
  /** Set when the visitor shares their location; otherwise the city default is used. */
  geo: [number, number] | null;
  user: { name: string; phone: string } | null;
  bookings: Booking[];
  blocks: Block[];
  /** Salons created or edited by an owner, keyed by id. Overrides seed data. */
  salonEdits: Record<string, Salon>;
  ownerSalonId: string | null;
}

const KEY = "moro:v1";
const initial: State = { city: "mumbai", geo: null, user: null, bookings: [], blocks: [], salonEdits: {}, ownerSalonId: null };

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...initial, ...JSON.parse(raw) } : initial;
  } catch {
    return initial;
  }
}

// Layout effects do not run on the server; this keeps the prerender quiet about it.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type NewBooking = Omit<Booking, "id" | "code" | "createdAt" | "status" | "source">;

interface Store extends State {
  salons: Salon[];
  /** Look a salon up by its URL slug or its id. */
  salon: (idOrSlug?: string) => Salon | undefined;
  origin: [number, number];
  setCity: (id: string) => void;
  setGeo: (g: [number, number] | null) => void;
  signIn: (u: { name: string; phone: string }) => void;
  signOut: () => void;
  createBooking: (b: NewBooking) => Booking;
  setStatus: (id: string, status: BookingStatus) => void;
  toggleBlock: (b: Block) => void;
  setDayBlocked: (salonId: string, date: string, times: string[], blocked: boolean) => void;
  saveSalon: (s: Salon) => void;
  becomeOwner: (salonId: string, withDemoBookings?: boolean) => void;
  leaveOwner: () => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);
const code = () => `MO-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;

const DEMO_NAMES = ["Aarav Shah", "Meera Pillai", "Kunal Desai", "Fatima Sheikh", "Rishi Kapoor", "Neha Joshi", "Aditya Rao", "Simran Gill", "Varun Nair", "Pooja Hegde", "Zain Merchant", "Ira Banerjee"];

/** Give a claimed demo salon a believable week of appointments. */
function demoBookings(salon: Salon): Booking[] {
  const out: Booking[] = [];
  let n = 0;
  for (let offset = -2; offset <= 4; offset++) {
    const d = addDays(new Date(), offset);
    const hours = salon.hours[d.getDay()];
    if (!hours) continue;
    let t = toMin(hours.open) + 60;
    const perDay = offset === 0 ? 5 : 3;
    for (let i = 0; i < perDay; i++) {
      const service = salon.services[(n * 3 + i) % salon.services.length];
      if (t + service.duration > toMin(hours.close)) break;
      const status: BookingStatus = offset < 0 ? "completed" : offset === 0 ? "confirmed" : n % 3 === 0 ? "pending" : "confirmed";
      out.push({
        id: `demo-${uid()}`,
        code: code(),
        salonId: salon.id,
        serviceIds: [service.id],
        serviceNames: [service.name],
        stylistId: salon.stylists.length ? salon.stylists[n % salon.stylists.length].id : null,
        date: dateKey(d),
        time: fromMin(t),
        duration: service.duration,
        total: service.price,
        customer: { name: DEMO_NAMES[n % DEMO_NAMES.length], phone: `+91 98${String(20000000 + n * 713377).slice(0, 8)}` },
        status,
        createdAt: Date.now() - (10 - n) * 36e5,
        source: "demo",
      });
      n++;
      t += Math.ceil(service.duration / 30) * 30 + (i % 2 ? 90 : 60);
    }
  }
  return out;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  // First render always uses the defaults so it matches the prerendered HTML;
  // saved state is applied straight after, before the browser paints.
  const [state, setState] = useState<State>(initial);
  useIsoLayoutEffect(() => setState(load()), []);

  useEffect(() => {
    if (state === initial) return; // nothing loaded or changed yet — don't overwrite what's stored
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable — the session still works in memory */
    }
  }, [state]);

  const patch = useCallback((fn: (s: State) => Partial<State>) => setState((s) => ({ ...s, ...fn(s) })), []);

  const salons = useMemo(() => {
    const seedIds = new Set(seedSalons.map((s) => s.id));
    return [...seedSalons.map((s) => state.salonEdits[s.id] ?? s), ...Object.values(state.salonEdits).filter((s) => !seedIds.has(s.id))];
  }, [state.salonEdits]);

  const store = useMemo<Store>(() => {
    const city = cityById(state.city);
    return {
      ...state,
      salons,
      salon: (idOrSlug) => findSalon(salons, idOrSlug),
      origin: state.geo ?? city.you,
      setCity: (id) => patch(() => ({ city: id, geo: null })),
      setGeo: (geo) => patch(() => ({ geo })),
      signIn: (user) => patch(() => ({ user })),
      signOut: () => patch(() => ({ user: null })),
      createBooking: (b) => {
        const salon = salons.find((s) => s.id === b.salonId);
        const booking: Booking = {
          ...b,
          id: uid(),
          code: code(),
          createdAt: Date.now(),
          status: salon?.instantConfirm ? "confirmed" : "pending",
          source: "you",
        };
        patch((s) => ({ bookings: [...s.bookings, booking], user: s.user ?? b.customer }));
        return booking;
      },
      setStatus: (id, status) => patch((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, status } : b)) })),
      toggleBlock: (b) =>
        patch((s) => {
          const has = s.blocks.some((x) => x.salonId === b.salonId && x.date === b.date && x.time === b.time);
          return { blocks: has ? s.blocks.filter((x) => !(x.salonId === b.salonId && x.date === b.date && x.time === b.time)) : [...s.blocks, b] };
        }),
      setDayBlocked: (salonId, date, times, blocked) =>
        patch((s) => {
          const rest = s.blocks.filter((x) => !(x.salonId === salonId && x.date === date));
          return { blocks: blocked ? [...rest, ...times.map((time) => ({ salonId, date, time }))] : rest };
        }),
      saveSalon: (salon) => patch((s) => ({ salonEdits: { ...s.salonEdits, [salon.id]: salon } })),
      becomeOwner: (salonId, withDemo) =>
        patch((s) => {
          const salon = salons.find((x) => x.id === salonId);
          const already = s.bookings.some((b) => b.salonId === salonId && b.source === "demo");
          return {
            ownerSalonId: salonId,
            bookings: withDemo && salon && !already ? [...s.bookings, ...demoBookings(salon)] : s.bookings,
          };
        }),
      leaveOwner: () => patch(() => ({ ownerSalonId: null })),
      reset: () => setState({ ...initial }),
    };
  }, [state, salons, patch]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside <StoreProvider>");
  return s;
}
