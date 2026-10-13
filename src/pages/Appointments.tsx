import { AnimatePresence, motion } from "motion/react";
import { CalendarClock, History } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { CancelDialog, isUpcoming } from "../components/BookingBits";
import { Button, cx, EASE, Empty, Img, StatusBadge } from "../components/ui";
import { paths } from "../lib/routes";
import { Seo } from "../lib/seo";
import { useStore } from "../lib/store";
import { fmtDateLong, fmtDuration, fmtTime, inr, parseKey, toMin } from "../lib/time";
import type { Booking } from "../types";

const at = (b: Booking) => parseKey(b.date).getTime() + toMin(b.time) * 6e4;

export default function Appointments() {
  const { bookings, salon: find, user } = useStore();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [cancel, setCancel] = useState<Booking | null>(null);

  const mine = bookings.filter((b) => b.source === "you");
  const upcoming = mine.filter(isUpcoming).sort((a, b) => at(a) - at(b));
  const past = mine.filter((b) => !isUpcoming(b)).sort((a, b) => at(b) - at(a));
  const list = tab === "upcoming" ? upcoming : past;

  return (
    <div className="shell max-w-[980px]! pt-10 md:pt-16">
      <Seo title="Your appointments" description="Upcoming and past salon appointments." path={paths.appointments} noindex />
      <p className="t-eyebrow mb-4">{user ? `Hello, ${user.name.split(" ")[0]}` : "Your bookings"}</p>
      <h1 className="t-display-2">Appointments</h1>

      <div className="mt-9 flex gap-7 border-b border-line" role="tablist">
        {(
          [
            ["upcoming", "Upcoming", upcoming.length],
            ["past", "Past & cancelled", past.length],
          ] as const
        ).map(([id, label, n]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cx("relative pb-4 text-[1.0625rem] transition-colors", tab === id ? "font-semibold text-ink" : "text-mute hover:text-ink")}>
            {label} <span className="ml-1 text-[0.9375rem] font-normal text-mute tabular-nums">{n}</span>
            {tab === id && <motion.span layoutId="tab-line" className="absolute inset-x-0 -bottom-px h-0.5 bg-ink" transition={{ duration: 0.35, ease: EASE }} />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          {list.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-line">
              {tab === "upcoming" ? (
                <Empty icon={<CalendarClock className="size-6" />} title="Nothing in the diary" body="When you book a salon, your appointment will be waiting for you here." action={<Button to={paths.salons}>Find a salon</Button>} />
              ) : (
                <Empty icon={<History className="size-6" />} title="No history yet" body="Your past and cancelled appointments will be kept here so rebooking is quick." />
              )}
            </div>
          ) : (
            <ul className="mt-2 divide-y divide-line-2">
              {list.map((b) => {
                const salon = find(b.salonId);
                if (!salon) return null;
                const d = parseKey(b.date);
                return (
                  <li key={b.id} className="flex flex-col gap-5 py-7 sm:flex-row sm:items-center">
                    <Link to={paths.booking(b.id)} className="group flex min-w-0 flex-1 items-center gap-5">
                      <div className="grid h-[84px] w-[72px] shrink-0 place-items-center rounded-lg border border-line bg-card text-center">
                        <div>
                          <p className="text-[0.8125rem] text-mute uppercase">{d.toLocaleDateString("en-IN", { month: "short" })}</p>
                          <p className="font-display text-[2rem] leading-none">{d.getDate()}</p>
                        </div>
                      </div>
                      <Img src={salon.cover} alt="" w={240} className="hidden size-[84px] shrink-0 rounded-lg md:block" imgClassName="group-hover:scale-105" />
                      <div className="min-w-0">
                        <div className="mb-1.5">
                          <StatusBadge status={b.status} />
                        </div>
                        <p className="t-title truncate">{salon.name}</p>
                        <p className="mt-0.5 truncate text-[0.9375rem] text-ink-2">{b.serviceNames.join(" + ")}</p>
                        <p className="t-meta mt-0.5">
                          {fmtDateLong(b.date)} · {fmtTime(b.time)} · {fmtDuration(b.duration)} · {inr(b.total)}
                        </p>
                      </div>
                    </Link>
                    <div className="flex shrink-0 gap-2.5">
                      {isUpcoming(b) ? (
                        <>
                          <Button variant="outline" onClick={() => setCancel(b)}>
                            Cancel
                          </Button>
                          <Button to={paths.booking(b.id)}>View details</Button>
                        </>
                      ) : (
                        <Button variant="outline" to={paths.book(salon, b.serviceIds)}>
                          Book again
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>
      </AnimatePresence>

      <CancelDialog booking={cancel} salon={find(cancel?.salonId)} onClose={() => setCancel(null)} />
    </div>
  );
}
