import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Ban, CalendarDays, Check, Clock3, Inbox, LayoutDashboard, ListChecks, Lock, LogOut, PartyPopper, Plus, Scissors, Store, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { HoursEditor, LocationEditor, PhotoEditor, ProfileEditor, ServicesEditor } from "../../components/OwnerEditors";
import { Avatar, Button, cx, EASE, Empty, Logo, StatusBadge } from "../../components/ui";
import { paths } from "../../lib/routes";
import { Seo } from "../../lib/seo";
import { useStore } from "../../lib/store";
import { addDays, dateKey, fmtDateLong, fmtDuration, fmtRelDay, fmtTime, fmtWeekday, fromMin, hoursUntil, inr, parseKey, SLOT_STEP, todayKey, toMin, upcomingDays, WEEKDAYS } from "../../lib/time";
import type { Booking, Salon } from "../../types";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "bookings", label: "Bookings", icon: ListChecks },
  { id: "availability", label: "Availability", icon: CalendarDays },
  { id: "services", label: "Services", icon: Scissors },
  { id: "hours", label: "Hours", icon: Clock3 },
  { id: "profile", label: "Profile", icon: Store },
] as const;
type TabId = (typeof TABS)[number]["id"];

const at = (b: Booking) => parseKey(b.date).getTime() + toMin(b.time) * 6e4;

function PageHead({ title, lead, action }: { title: string; lead?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="t-display-3">{title}</h1>
        {lead && <p className="mt-2 max-w-xl text-ink-2">{lead}</p>}
      </div>
      {action}
    </div>
  );
}

function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-xl border border-line bg-card p-5 md:p-7", className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="t-title !text-[1.5rem]">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/* ── One booking, with the actions that make sense for its state ── */

function BookingRow({ b, salon, showDate }: { b: Booking; salon: Salon; showDate?: boolean }) {
  const { setStatus } = useStore();
  const stylist = salon.stylists.find((s) => s.id === b.stylistId);
  const started = hoursUntil(b.date, b.time) <= 0;
  return (
    <motion.li layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="w-24 shrink-0">
        <p className="text-[1.0625rem] font-semibold tabular-nums">{fmtTime(b.time)}</p>
        <p className="t-meta">{showDate ? fmtRelDay(b.date) : fmtDuration(b.duration)}</p>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <Avatar name={b.customer.name} />
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {b.customer.name}
            {b.source === "you" && <span className="ml-2 rounded-sm bg-accent-tint px-2 py-0.5 text-[0.8125rem] font-medium text-accent-deep">Via app</span>}
          </p>
          <p className="truncate text-[0.9375rem] text-ink-2">
            {b.serviceNames.join(" + ")} · {stylist ? stylist.name.split(" ")[0] : "Any"} · {inr(b.total)}
          </p>
          {b.note && <p className="mt-0.5 truncate text-sm text-mute">“{b.note}”</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:justify-end">
        {b.status === "pending" ? (
          <>
            <Button size="sm" variant="outline" onClick={() => setStatus(b.id, "declined")}>
              Decline
            </Button>
            <Button size="sm" onClick={() => setStatus(b.id, "confirmed")}>
              <Check className="size-4" /> Accept
            </Button>
          </>
        ) : b.status === "confirmed" ? (
          <>
            <StatusBadge status={b.status} owner />
            {started ? (
              <Button size="sm" variant="outline" onClick={() => setStatus(b.id, "completed")}>
                Mark done
              </Button>
            ) : (
              <button type="button" onClick={() => setStatus(b.id, "cancelled")} aria-label={`Cancel booking for ${b.customer.name}`} title="Cancel booking" className="grid size-9 place-items-center rounded-full text-mute hover:bg-bad-tint hover:text-bad">
                <X className="size-4" />
              </button>
            )}
          </>
        ) : (
          <StatusBadge status={b.status} owner />
        )}
      </div>
    </motion.li>
  );
}

function BookingList({ items, salon, showDate, empty }: { items: Booking[]; salon: Salon; showDate?: boolean; empty: ReactNode }) {
  if (!items.length) return <>{empty}</>;
  return (
    <ul className="divide-y divide-line-2">
      <AnimatePresence initial={false}>
        {items.map((b) => (
          <BookingRow key={b.id} b={b} salon={salon} showDate={showDate} />
        ))}
      </AnimatePresence>
    </ul>
  );
}

/* ── Overview ───────────────────────────────────────────── */

function Overview({ salon, mine, welcome, go }: { salon: Salon; mine: Booking[]; welcome: boolean; go: (t: TabId) => void }) {
  const today = todayKey();
  const todays = mine.filter((b) => b.date === today && b.status !== "cancelled" && b.status !== "declined").sort((a, b) => at(a) - at(b));
  const pending = mine.filter((b) => b.status === "pending").sort((a, b) => at(a) - at(b));
  const weekEnd = dateKey(addDays(new Date(), 6));
  const week = mine.filter((b) => b.date >= today && b.date <= weekEnd && (b.status === "confirmed" || b.status === "completed"));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stats = [
    { label: "Today", value: String(todays.length), sub: todays.length === 1 ? "appointment" : "appointments" },
    { label: "Awaiting your reply", value: String(pending.length), sub: pending.length === 1 ? "request" : "requests", alert: pending.length > 0 },
    { label: "Booked this week", value: inr(week.reduce((n, b) => n + b.total, 0)), sub: `${week.length} confirmed` },
  ];

  return (
    <>
      {welcome && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="mb-8 flex flex-wrap items-center gap-4 rounded-xl bg-ok-tint p-5 text-ok">
          <PartyPopper className="size-6 shrink-0" />
          <p className="flex-1 text-[1.0625rem]">
            <span className="font-semibold">{salon.name} is live.</span> Clients in {salon.area} can find and book you right now.
          </p>
          <Button to={paths.salon(salon)} size="sm" className="!bg-ok">
            See your page <ArrowUpRight className="size-4" />
          </Button>
        </motion.div>
      )}
      <PageHead title={`${greeting}.`} lead={`${fmtDateLong(today)} at ${salon.name}`} />
      <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-card p-5 md:p-7">
            <p className="t-eyebrow flex items-center gap-2">
              {s.alert && <span className="size-2 rounded-full bg-accent" />}
              {s.label}
            </p>
            <p className="mt-5 font-display text-[3.25rem] leading-none tabular-nums">{s.value}</p>
            <p className="t-meta mt-1.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel
          title="Today’s chair"
          action={
            <button type="button" onClick={() => go("availability")} className="text-[0.9375rem] font-medium underline decoration-line underline-offset-4 hover:decoration-ink">
              Block time
            </button>
          }
        >
          <BookingList items={todays} salon={salon} empty={<p className="py-8 text-center text-ink-2">{salon.hours[new Date().getDay()] ? "Nothing booked yet today." : "You’re closed today. Enjoy it."}</p>} />
        </Panel>
        <Panel
          title="Requests"
          action={
            <button type="button" onClick={() => go("bookings")} className="text-[0.9375rem] font-medium underline decoration-line underline-offset-4 hover:decoration-ink">
              All bookings
            </button>
          }
        >
          <BookingList
            items={pending}
            salon={salon}
            showDate
            empty={
              <div className="flex flex-col items-center py-8 text-center">
                <Inbox className="size-7 text-mute" strokeWidth={1.5} />
                <p className="mt-3 text-ink-2">{salon.instantConfirm ? "You confirm bookings instantly, so nothing waits here." : "You’re all caught up."}</p>
              </div>
            }
          />
        </Panel>
      </div>
    </>
  );
}

/* ── Bookings ───────────────────────────────────────────── */

function Bookings({ salon, mine }: { salon: Salon; mine: Booking[] }) {
  const [filter, setFilter] = useState<"upcoming" | "requests" | "past" | "cancelled">("upcoming");
  const groups = {
    upcoming: mine.filter((b) => b.status === "confirmed" && hoursUntil(b.date, b.time) > -b.duration / 60).sort((a, b) => at(a) - at(b)),
    requests: mine.filter((b) => b.status === "pending").sort((a, b) => at(a) - at(b)),
    past: mine.filter((b) => b.status === "completed" || (b.status === "confirmed" && hoursUntil(b.date, b.time) <= -b.duration / 60)).sort((a, b) => at(b) - at(a)),
    cancelled: mine.filter((b) => b.status === "cancelled" || b.status === "declined").sort((a, b) => at(b) - at(a)),
  };
  return (
    <>
      <PageHead title="Bookings" lead="Every appointment made with your salon, newest requests first." />
      <div className="no-scrollbar -mx-5 mb-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
        {(Object.keys(groups) as (keyof typeof groups)[]).map((k) => (
          <button key={k} type="button" onClick={() => setFilter(k)} className={cx("inline-flex h-10 shrink-0 items-center gap-2 rounded-sm border px-4 text-[0.9375rem] capitalize transition-colors", filter === k ? "border-ink bg-ink text-paper" : "border-line hover:border-ink")}>
            {k}
            <span className={cx("text-[0.8125rem] tabular-nums", filter === k ? "text-paper/60" : "text-mute")}>{groups[k].length}</span>
          </button>
        ))}
      </div>
      <Panel>
        <BookingList items={groups[filter]} salon={salon} showDate empty={<Empty icon={<Inbox className="size-6" />} title={`No ${filter} bookings`} body="When clients book, their appointments will appear here." />} />
      </Panel>
    </>
  );
}

/* ── Availability: block and unblock individual slots ───── */

function Availability({ salon, mine }: { salon: Salon; mine: Booking[] }) {
  const { blocks, toggleBlock, setDayBlocked } = useStore();
  const days = useMemo(() => upcomingDays(14), []);
  const [date, setDate] = useState(days[0]);
  const hours = salon.hours[parseKey(date).getDay()];
  const cells = hours ? Array.from({ length: (toMin(hours.close) - toMin(hours.open)) / SLOT_STEP }, (_, i) => fromMin(toMin(hours.open) + i * SLOT_STEP)) : [];
  const dayBlocks = new Set(blocks.filter((b) => b.salonId === salon.id && b.date === date).map((b) => b.time));
  const dayBookings = mine.filter((b) => b.date === date && (b.status === "confirmed" || b.status === "pending"));
  const bookingAt = (t: string) => dayBookings.find((b) => toMin(t) >= toMin(b.time) && toMin(t) < toMin(b.time) + b.duration);
  const free = cells.filter((t) => !bookingAt(t));
  const allBlocked = free.length > 0 && free.every((t) => dayBlocks.has(t));

  return (
    <>
      <PageHead title="Availability" lead="Tap a time to take it off the app — for lunch, errands or a walk-in. Tap again to open it back up." />
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0">
        {days.map((d) => {
          const closed = !salon.hours[parseKey(d).getDay()];
          const n = blocks.filter((b) => b.salonId === salon.id && b.date === d).length;
          return (
            <button key={d} type="button" onClick={() => setDate(d)} aria-pressed={d === date} className={cx("relative flex h-[84px] w-[66px] shrink-0 flex-col items-center justify-center rounded-lg border transition-colors", d === date ? "border-ink bg-ink text-paper" : closed ? "border-line-2 text-mute/60" : "border-line hover:border-ink")}>
              <span className={cx("text-[0.8125rem]", d === date ? "text-paper/70" : "text-mute")}>{d === todayKey() ? "Today" : fmtWeekday(d)}</span>
              <span className="font-display text-[1.75rem] leading-tight">{parseKey(d).getDate()}</span>
              {n > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-accent" />}
            </button>
          );
        })}
      </div>

      <Panel className="mt-5" title={fmtDateLong(date)} action={hours ? <Button size="sm" variant="outline" onClick={() => setDayBlocked(salon.id, date, free, !allBlocked)}>{allBlocked ? "Reopen the day" : "Block the whole day"}</Button> : undefined}>
        {!hours ? (
          <p className="py-8 text-center text-ink-2">You’re closed on {WEEKDAYS[parseKey(date).getDay()]}s. Change this under Hours.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {cells.map((t) => {
                const b = bookingAt(t);
                const blocked = dayBlocks.has(t);
                if (b)
                  return (
                    <div key={t} className="flex h-16 flex-col justify-center rounded-md bg-ink px-3 text-paper" title={`${b.customer.name} — ${b.serviceNames.join(" + ")}`}>
                      <span className="text-sm tabular-nums text-paper/60">{fmtTime(t)}</span>
                      <span className="truncate text-[0.9375rem] font-medium">{b.customer.name.split(" ")[0]}</span>
                    </div>
                  );
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={blocked}
                    onClick={() => toggleBlock({ salonId: salon.id, date, time: t })}
                    className={cx("group flex h-16 flex-col justify-center rounded-md border px-3 text-left transition-colors", blocked ? "border-transparent bg-[repeating-linear-gradient(135deg,var(--color-sand)_0_6px,var(--color-line-2)_6px_12px)] text-ink-2" : "border-line bg-paper hover:border-ink")}
                  >
                    <span className="text-sm tabular-nums">{fmtTime(t)}</span>
                    <span className={cx("flex items-center gap-1 text-[0.9375rem]", blocked ? "font-medium" : "text-ok")}>
                      {blocked ? (
                        <>
                          <Lock className="size-3.5" /> Blocked
                        </>
                      ) : (
                        "Open"
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-sm border border-line bg-paper" /> Open to book
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-sm bg-ink" /> Booked
              </span>
              <span className="inline-flex items-center gap-2">
                <Ban className="size-3.5" /> Blocked by you
              </span>
            </div>
          </>
        )}
      </Panel>
    </>
  );
}

/* ── Team (lives on the Profile tab) ────────────────────── */

function TeamEditor({ salon, save }: { salon: Salon; save: (p: Partial<Salon>) => void }) {
  const set = (id: string, patch: { name?: string; role?: string }) => save({ stylists: salon.stylists.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  return (
    <div>
      <ul className="space-y-2.5">
        {salon.stylists.map((s) => (
          <li key={s.id} className="grid grid-cols-[1fr_auto] gap-2.5 sm:grid-cols-[1fr_1fr_auto]">
            <input className="field !h-11" value={s.name} onChange={(e) => set(s.id, { name: e.target.value })} placeholder="Name" aria-label="Name" />
            <input className="field col-start-1 !h-11 sm:col-start-2" value={s.role} onChange={(e) => set(s.id, { role: e.target.value })} placeholder="Role, e.g. Senior stylist" aria-label="Role" />
            <button type="button" onClick={() => save({ stylists: salon.stylists.filter((x) => x.id !== s.id) })} aria-label={`Remove ${s.name || "team member"}`} className="col-start-2 row-start-1 grid size-11 place-items-center rounded-full text-mute hover:bg-bad-tint hover:text-bad sm:col-start-3">
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" className="mt-4" onClick={() => save({ stylists: [...salon.stylists, { id: `${salon.id}-p${Math.random().toString(36).slice(2, 6)}`, name: "", role: "" }] })}>
        <Plus className="size-4" /> Add a team member
      </Button>
    </div>
  );
}

/* ── Shell ──────────────────────────────────────────────── */

export default function Dashboard() {
  const { ownerSalonId, salon: find, bookings, saveSalon, leaveOwner } = useStore();
  const [params, setParams] = useSearchParams();
  const salon = find(ownerSalonId ?? undefined);
  const tab = (TABS.find((t) => t.id === params.get("tab"))?.id ?? "overview") as TabId;
  const welcome = params.get("welcome") === "1";
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1600);
    return () => clearTimeout(t);
  }, [saved]);

  if (!salon) return <Navigate to="/partners" replace />;

  const mine = bookings.filter((b) => b.salonId === salon.id);
  const pending = mine.filter((b) => b.status === "pending").length;
  const go = (t: TabId) => {
    setParams(t === "overview" ? {} : { tab: t }, { replace: true });
    window.scrollTo(0, 0);
  };
  const save = (patch: Partial<Salon>) => {
    saveSalon({ ...salon, ...patch });
    setSaved(true);
  };

  return (
    <div className="min-h-dvh">
      <Seo title="Owner dashboard" description="Manage your salon, services and appointments." path={paths.dashboard} noindex />
      <header className="sticky top-0 z-40 border-b border-line bg-paper">
        <div className="shell flex h-[72px] items-center gap-4">
          <Logo />
          <span className="hidden rounded-sm border border-line px-2.5 py-1 text-[0.8125rem] font-medium text-ink-2 sm:inline">Owner</span>
          <AnimatePresence>
            {saved && (
              <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="hidden items-center gap-1.5 text-sm text-ok md:inline-flex">
                <Check className="size-4" /> Saved
              </motion.span>
            )}
          </AnimatePresence>
          <div className="ml-auto flex items-center gap-1.5">
            <Button to={paths.salon(salon)} variant="outline" size="sm">
              <span className="hidden sm:inline">View public page</span>
              <span className="sm:hidden">Preview</span>
              <ArrowUpRight className="size-4" />
            </Button>
            <Link to="/" onClick={leaveOwner} className="inline-flex h-9 items-center gap-2 rounded-sm px-3 text-sm text-ink-2 hover:bg-ink/6 hover:text-ink" title="Leave the owner dashboard">
              <LogOut className="size-4" /> <span className="hidden sm:inline">Exit</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="shell grid gap-x-12 pb-24 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="no-scrollbar sticky top-[72px] z-30 -mx-5 flex gap-1 overflow-x-auto border-b border-line-2 bg-paper px-5 py-3 lg:top-[104px] lg:mx-0 lg:flex-col lg:self-start lg:border-0 lg:px-0 lg:py-0 lg:pt-10" aria-label="Dashboard">
          <div className="mb-5 hidden lg:block">
            <p className="t-title truncate !text-[1.5rem]">{salon.name}</p>
            <p className="t-meta">{salon.area}</p>
          </div>
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => go(t.id)} aria-current={tab === t.id ? "page" : undefined} className={cx("relative flex h-11 shrink-0 items-center gap-3 rounded-sm px-4 text-[0.9375rem] transition-colors lg:rounded-md", tab === t.id ? "bg-ink font-medium text-paper" : "text-ink-2 hover:bg-ink/6 hover:text-ink")}>
              <t.icon className="size-[18px]" strokeWidth={1.75} />
              {t.label}
              {t.id === "bookings" && pending > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-sm bg-accent px-1.5 text-[0.75rem] font-semibold text-white">{pending}</span>}
            </button>
          ))}
        </nav>

        <main className="min-w-0 pt-8 lg:pt-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE }}>
              {tab === "overview" && <Overview salon={salon} mine={mine} welcome={welcome} go={go} />}
              {tab === "bookings" && <Bookings salon={salon} mine={mine} />}
              {tab === "availability" && <Availability salon={salon} mine={mine} />}
              {tab === "services" && (
                <>
                  <PageHead title="Services" lead="Your menu, as clients see it. Changes are saved as you type." />
                  <Panel>
                    <ServicesEditor salon={salon} onChange={save} />
                  </Panel>
                </>
              )}
              {tab === "hours" && (
                <>
                  <PageHead title="Opening hours" lead="Appointments are only offered inside these hours." />
                  <Panel>
                    <HoursEditor salon={salon} onChange={save} />
                  </Panel>
                </>
              )}
              {tab === "profile" && (
                <>
                  <PageHead title="Profile" lead="How your salon appears to clients. Changes are saved as you type." />
                  <div className="space-y-6">
                    <Panel title="About">
                      <ProfileEditor salon={salon} onChange={save} />
                    </Panel>
                    <Panel title="Photos">
                      <PhotoEditor salon={salon} onChange={save} />
                    </Panel>
                    <Panel title="Location">
                      <LocationEditor salon={salon} onChange={save} />
                    </Panel>
                    <Panel title="Team">
                      <TeamEditor salon={salon} save={save} />
                    </Panel>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
