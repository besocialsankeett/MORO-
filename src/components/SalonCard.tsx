import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { categoryName } from "../data/catalogue";
import { useHydrated } from "../lib/hooks";
import { paths } from "../lib/routes";
import { useStore } from "../lib/store";
import { distanceKm, fmtKm, fmtRelDay, fmtTime, inr, nextAvailable } from "../lib/time";
import type { Salon } from "../types";
import { cx, Img, Rating } from "./ui";

/** Cheapest proper appointment — quick add-ons like a fringe trim would make the "from" price misleading. */
export const fromPrice = (s: Salon) => {
  const main = s.services.filter((x) => x.duration >= 25);
  const pool = main.length ? main : s.services;
  return pool.length ? Math.min(...pool.map((x) => x.price)) : 0;
};
export const salonCategories = (s: Salon) => [...new Set(s.services.map((x) => x.category))];

/**
 * Next bookable time. Depends on the clock and on stored bookings, so it is
 * worked out in the browser only — never baked into prerendered HTML.
 */
export function NextSlot({ salon, className, bare }: { salon: Salon; className?: string; bare?: boolean }) {
  const { bookings, blocks } = useStore();
  const hydrated = useHydrated();
  if (!hydrated) return <span className={cx("inline-block h-[1em] w-24", className)} aria-hidden />;
  const next = nextAvailable(salon, { bookings, blocks });
  if (!next) return <span className={cx("text-sm text-mute", className)}>Fully booked this week</span>;
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-sm font-medium", !bare && "text-ok", className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {fmtRelDay(next.date)}, {fmtTime(next.time)}
    </span>
  );
}

/** The one salon card used in listings. */
export function SalonCard({ salon, active, onHover, priority }: { salon: Salon; active?: boolean; onHover?: (id: string | null) => void; priority?: boolean }) {
  const { origin, city } = useStore();
  const cats = salonCategories(salon).slice(0, 3).map(categoryName);
  return (
    <Link to={paths.salon(salon)} onMouseEnter={() => onHover?.(salon.id)} onMouseLeave={() => onHover?.(null)} className="group block focus-visible:outline-offset-8">
      <div className="relative">
        <Img src={salon.cover} alt={`Inside ${salon.name}, ${salon.area}`} w={640} h={800} priority={priority} className={cx("aspect-[4/5] transition-shadow duration-300", active && "ring-2 ring-accent ring-offset-4 ring-offset-paper")} imgClassName="group-hover:scale-[1.04]" />
        {salon.badge && <span className="t-eyebrow absolute top-0 left-0 bg-paper px-2.5 py-2 !text-ink">{salon.badge}</span>}
        <span className="absolute right-0 bottom-0 grid size-11 place-items-center bg-accent text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <ArrowUpRight className="size-5" />
        </span>
      </div>
      <div className="mt-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="t-title">{salon.name}</h3>
          <Rating value={salon.rating} count={salon.reviews || undefined} className="mt-0.5 shrink-0" />
        </div>
        <p className="mt-2 text-[0.9375rem] text-ink-2">
          {salon.area}
          {salon.city === city && <span className="text-mute"> · {fmtKm(distanceKm(origin, salon.coords))}</span>}
        </p>
        <p className="truncate text-[0.9375rem] text-mute">{cats.join(" · ")}</p>
        <div className="mt-3.5 flex items-center justify-between gap-4 border-t border-ink/15 pt-3">
          <p className="text-[0.9375rem]">
            <span className="text-mute">From</span> <span className="font-semibold tabular-nums">{inr(fromPrice(salon))}</span>
          </p>
          <NextSlot salon={salon} />
        </div>
      </div>
    </Link>
  );
}

export function SalonCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="skeleton aspect-[4/5]" />
      <div className="skeleton mt-4 h-7 w-2/3" />
      <div className="skeleton mt-2 h-4 w-1/2" />
      <div className="skeleton mt-6 h-4 w-full" />
    </div>
  );
}
