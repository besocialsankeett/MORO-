import { motion } from "motion/react";
import { CalendarPlus, Check, Clock, Hourglass, Navigation, X } from "lucide-react";
import { useState, type ComponentType } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CancelDialog, downloadIcs, isUpcoming } from "../components/BookingBits";
import { Button, EASE, Empty, Img, StatusBadge } from "../components/ui";
import { paths } from "../lib/routes";
import { Seo } from "../lib/seo";
import { useStore } from "../lib/store";
import { fmtDateLong, fmtDuration, fmtTime, inr, parseKey } from "../lib/time";
import { directionsUrl } from "./Salon";

/**
 * The appointment, held in the mirror's shape. On a fresh booking the arch draws
 * itself, fills from the floor up, the date settles in, a glint crosses the glass,
 * and the status is stamped on the corner. Seen again later, it is simply there.
 */
function DateArch({ date, time, tone, Icon, live, animate }: { date: string; time: string; tone: string; Icon: ComponentType<{ className?: string; strokeWidth?: number }>; live: boolean; animate: boolean }) {
  const d = parseKey(date);
  const at = (delay: number, duration = 0.6) => ({ duration, ease: EASE, delay });
  const rise = (delay: number) => ({ initial: animate ? { opacity: 0, y: 12 } : (false as const), animate: { opacity: 1, y: 0 }, transition: at(delay, 0.55) });
  return (
    <div className="relative h-[13.5rem] w-36 text-ink md:h-[15.75rem] md:w-[10.5rem]">
      <motion.div
        className={`arch absolute inset-0 overflow-hidden ${live ? "bg-ink text-paper" : "bg-sand text-ink-2"}`}
        initial={animate ? { clipPath: "inset(100% 0% 0% 0%)" } : false}
        animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
        transition={at(0.6, 0.8)}
      >
        <div className="flex h-full flex-col items-center justify-end pb-6 text-center">
          <motion.span className="text-[0.75rem] font-medium tracking-[0.14em] uppercase opacity-60" {...rise(1.0)}>
            {d.toLocaleDateString("en-IN", { weekday: "long" })}
          </motion.span>
          <motion.span className={`font-display mt-1 text-[4.75rem] leading-[0.9] md:text-[5.5rem] ${live ? "" : "line-through decoration-1"}`} {...rise(1.08)}>
            {d.getDate()}
          </motion.span>
          <motion.span className="mt-1 text-[0.8125rem] font-medium tracking-[0.14em] uppercase" {...rise(1.16)}>
            {d.toLocaleDateString("en-IN", { month: "long" })}
          </motion.span>
          <motion.span className="mt-3 border-t border-current/25 px-3 pt-2.5 text-[0.9375rem] font-medium tabular-nums" {...rise(1.24)}>
            {fmtTime(time)}
          </motion.span>
        </div>
        {live && (
          <motion.span
            aria-hidden
            className="absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.18),transparent)]"
            initial={{ x: animate ? "-120%" : "320%" }}
            animate={{ x: "320%" }}
            transition={at(1.7, 0.9)}
          />
        )}
      </motion.div>
      <svg viewBox="0 0 100 150" fill="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        <motion.path d="M0.5 150V50a49.5 49.5 0 0 1 99 0v100" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" initial={animate ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={at(0.1, 0.85)} />
      </svg>
      <motion.span
        className={`absolute -right-4 -bottom-3 grid size-12 place-items-center rounded-full border-4 border-paper text-paper ${tone}`}
        initial={animate ? { scale: 0, rotate: -70 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 16, delay: animate ? 1.45 : 0 }}
      >
        <Icon className="size-5" strokeWidth={2.75} />
      </motion.span>
    </div>
  );
}

export default function Booking() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { bookings, salon: find } = useStore();
  const booking = bookings.find((b) => b.id === id);
  const salon = find(booking?.salonId);
  const [cancel, setCancel] = useState(false);
  const fresh = params.get("new") === "1";

  if (!booking || !salon) {
    return (
      <div className="shell py-24">
        <Empty title="We couldn’t find that booking" body="It may belong to a different browser, or the link is out of date." action={<Button to={paths.appointments}>My appointments</Button>} />
      </div>
    );
  }

  const stylist = salon.stylists.find((s) => s.id === booking.stylistId);
  const head = {
    confirmed: fresh ? ["You’re booked.", `${salon.name} is expecting you. We’ve saved this to your appointments.`] : ["Your appointment", `Confirmed with ${salon.name}.`],
    pending: ["Request sent.", `${salon.name} confirms each booking personally — you’ll usually hear back within the hour.`],
    cancelled: ["Appointment cancelled", "This slot has been released. You can book again whenever you’re ready."],
    declined: ["Request declined", `${salon.name} couldn’t take this booking. Try another time or a nearby salon.`],
    completed: ["Hope it went well.", `You visited ${salon.name}. Book again in a couple of taps.`],
  }[booking.status];
  const tone = booking.status === "confirmed" || booking.status === "completed" ? "bg-ok" : booking.status === "pending" ? "bg-warn" : "bg-bad";
  const Icon = booking.status === "pending" ? Hourglass : booking.status === "cancelled" || booking.status === "declined" ? X : Check;

  return (
    <div className="shell grid gap-x-16 gap-y-12 pt-10 md:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <Seo title={`Booking ${booking.code}`} description="Your appointment details." path={paths.booking(booking.id)} noindex />
      <div>
        <DateArch date={booking.date} time={booking.time} tone={tone} Icon={Icon} live={booking.status !== "cancelled" && booking.status !== "declined"} animate={fresh} />
        <motion.div initial={fresh ? { opacity: 0, y: 20 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: fresh ? 1.15 : 0 }}>
          <h1 className="t-display-1 mt-10 !text-[clamp(3rem,6vw,5.75rem)]">{head[0]}</h1>
          <p className="t-lead mt-5 max-w-md">{head[1]}</p>
          <p className="mt-8 text-[0.9375rem] text-mute">
            Booking reference <span className="ml-1 font-semibold tracking-wider text-ink">{booking.code}</span>
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {isUpcoming(booking) ? (
              <>
                <Button size="lg" onClick={() => downloadIcs(booking, salon)}>
                  <CalendarPlus className="size-[18px]" /> Add to calendar
                </Button>
                <Button size="lg" variant="outline" href={directionsUrl(salon)}>
                  <Navigation className="size-[18px]" /> Directions
                </Button>
              </>
            ) : (
              <Button size="lg" to={paths.book(salon, booking.serviceIds)}>
                Book again
              </Button>
            )}
          </div>
          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-2 text-[0.9375rem] font-medium">
            <Link to={paths.appointments} className="underline decoration-line underline-offset-[6px] hover:decoration-ink">
              View all appointments
            </Link>
            <Link to={paths.salons} className="underline decoration-line underline-offset-[6px] hover:decoration-ink">
              Keep exploring
            </Link>
          </div>
        </motion.div>
      </div>

      <motion.div className="overflow-hidden rounded-xl border border-line bg-card shadow-soft" initial={fresh ? { opacity: 0, y: 30 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: fresh ? 1.35 : 0 }}>
        <Link to={paths.salon(salon)} className="group block">
          <Img src={salon.cover} alt={`Inside ${salon.name}`} w={1000} eager className="aspect-[16/8]" imgClassName="group-hover:scale-[1.03]" />
        </Link>
        <div className="p-6 md:p-9">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="t-display-3">{salon.name}</h2>
              <p className="mt-1.5 text-ink-2">{salon.address}</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
            <div className="bg-card p-5">
              <p className="t-eyebrow">Date</p>
              <p className="mt-2.5 text-[1.0625rem] font-semibold">{fmtDateLong(booking.date)}</p>
            </div>
            <div className="bg-card p-5">
              <p className="t-eyebrow">Time</p>
              <p className="mt-2.5 flex items-center gap-2 text-[1.0625rem] font-semibold">
                {fmtTime(booking.time)}
                <span className="inline-flex items-center gap-1 text-sm font-normal text-mute">
                  <Clock className="size-3.5" /> {fmtDuration(booking.duration)}
                </span>
              </p>
            </div>
          </div>

          <dl className="mt-7 space-y-3 text-[0.9375rem]">
            {booking.serviceNames.map((n, i) => {
              const s = salon.services.find((x) => x.id === booking.serviceIds[i]);
              return (
                <div key={n} className="flex justify-between gap-4">
                  <dt>{n}</dt>
                  <dd className="tabular-nums">{s ? inr(s.price) : ""}</dd>
                </div>
              );
            })}
            <div className="flex justify-between gap-4 text-ink-2">
              <dt>Professional</dt>
              <dd>{stylist?.name ?? "First available"}</dd>
            </div>
            <div className="flex justify-between gap-4 text-ink-2">
              <dt>Booked for</dt>
              <dd>{booking.customer.name}</dd>
            </div>
            {booking.note && (
              <div className="rounded-md bg-sand/60 p-3.5 text-ink-2">
                <dt className="sr-only">Note</dt>
                <dd>“{booking.note}”</dd>
              </div>
            )}
          </dl>
          <div className="mt-6 flex items-baseline justify-between border-t border-line-2 pt-6">
            <span className="text-ink-2">Pay at the salon</span>
            <span className="font-display text-4xl tabular-nums">{inr(booking.total)}</span>
          </div>

          {isUpcoming(booking) && (
            <p className="mt-6 text-[0.9375rem] text-mute">
              Free cancellation until {salon.cancelHours} hours before.{" "}
              <button type="button" onClick={() => setCancel(true)} className="font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
                Cancel appointment
              </button>
            </p>
          )}
        </div>
      </motion.div>

      <CancelDialog booking={cancel ? booking : null} salon={salon} onClose={() => setCancel(false)} />
    </div>
  );
}
