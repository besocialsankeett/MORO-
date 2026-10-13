import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, CalendarX, Check, Plus, ShieldCheck, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Avatar, Button, cx, EASE, Empty, Field, Img } from "../components/ui";
import { categories } from "../data/catalogue";
import { paths } from "../lib/routes";
import { Seo } from "../lib/seo";
import { useStore } from "../lib/store";
import { fmtDateLong, fmtDuration, fmtTime, fmtWeekday, getSlots, inr, parseKey, toMin, todayKey, upcomingDays } from "../lib/time";
import type { Salon } from "../types";

const STEPS = ["Services", "Professional", "Time", "Confirm"] as const;

function OptionCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx("flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-all duration-200 sm:p-5", selected ? "border-ink bg-card shadow-[inset_0_0_0_1px_var(--color-ink)]" : "border-line hover:border-mute")}
    >
      {children}
      <span className={cx("ml-auto grid size-6 shrink-0 place-items-center rounded-full border transition-colors", selected ? "border-accent bg-accent text-white" : "border-line")}>{selected && <Check className="size-3.5" strokeWidth={3} />}</span>
    </button>
  );
}

function Summary({ salon, picked, stylistName, date, time, total, minutes }: { salon: Salon; picked: Salon["services"]; stylistName: string | null; date: string | null; time: string | null; total: number; minutes: number }) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <Img src={salon.cover} alt="" w={160} className="size-16 shrink-0 rounded-md" />
        <div className="min-w-0">
          <p className="t-title truncate !text-[1.5rem]">{salon.name}</p>
          <p className="t-meta truncate">{salon.area}</p>
        </div>
      </div>
      <dl className="mt-6 space-y-4 border-t border-line-2 pt-5 text-[0.9375rem]">
        <div>
          <dt className="t-eyebrow mb-2">Services</dt>
          {picked.length ? (
            picked.map((s) => (
              <dd key={s.id} className="flex justify-between gap-4 py-0.5">
                <span>{s.name}</span>
                <span className="tabular-nums">{inr(s.price)}</span>
              </dd>
            ))
          ) : (
            <dd className="text-mute">Not chosen yet</dd>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <dt className="t-eyebrow mb-2">With</dt>
            <dd className={stylistName === null ? "text-mute" : ""}>{stylistName ?? "—"}</dd>
          </div>
          <div>
            <dt className="t-eyebrow mb-2">When</dt>
            <dd className={date && time ? "" : "text-mute"}>
              {date && time ? (
                <>
                  {fmtDateLong(date)}
                  <br />
                  {fmtTime(time)}
                </>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </div>
      </dl>
      <div className="mt-5 flex items-baseline justify-between border-t border-line-2 pt-5">
        <span className="text-ink-2">Total{minutes ? ` · ${fmtDuration(minutes)}` : ""}</span>
        <span className="font-display text-3xl tabular-nums">{inr(total)}</span>
      </div>
    </div>
  );
}

export default function Book() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { salon: find, bookings, blocks, user, createBooking } = useStore();
  const salon = find(id);

  const [selected, setSelected] = useState<string[]>(() => (params.get("s") ?? "").split(",").filter(Boolean));
  const [step, setStep] = useState(() => (selected.length ? 1 : 0));
  const [dir, setDir] = useState(1);
  const [stylistId, setStylistId] = useState<string | null | undefined>(undefined);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  const picked = useMemo(() => (salon ? salon.services.filter((s) => selected.includes(s.id)) : []), [salon, selected]);
  const total = picked.reduce((n, s) => n + s.price, 0);
  const minutes = picked.reduce((n, s) => n + s.duration, 0);
  const days = useMemo(() => upcomingDays(14), []);
  const ctx = useMemo(() => ({ bookings, blocks }), [bookings, blocks]);

  const slots = useMemo(() => (salon && date && minutes ? getSlots(salon, date, minutes, ctx, stylistId ?? null) : []), [salon, date, minutes, ctx, stylistId]);

  // Land on the first day that actually has room.
  useEffect(() => {
    if (step !== 2 || !salon || !minutes) return;
    if (date && getSlots(salon, date, minutes, ctx, stylistId ?? null).some((s) => s.available)) return;
    const first = days.find((d) => getSlots(salon, d, minutes, ctx, stylistId ?? null).some((s) => s.available));
    setDate(first ?? days[0]);
    setTime(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // If the chosen time stops being valid (services or stylist changed), drop it.
  useEffect(() => {
    if (time && !slots.some((s) => s.time === time && s.available)) setTime(null);
  }, [slots, time]);

  if (!salon) {
    return (
      <div className="shell py-24">
        <Empty title="We couldn’t find that salon" body="The link might be out of date." action={<Button to={paths.salons}>Browse salons</Button>} />
      </div>
    );
  }

  const stylist = salon.stylists.find((p) => p.id === stylistId);
  const stylistName = stylistId === undefined ? null : (stylist?.name ?? "Any professional");
  const phoneOk = phone.replace(/\D/g, "").length >= 10;
  const nameOk = name.trim().length > 1;
  const canContinue = [picked.length > 0, stylistId !== undefined, !!(date && time), nameOk && phoneOk][step];

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    top.current?.scrollIntoView({ block: "start" });
  };
  const pickDate = (d: string) => {
    setDate(d);
    setTime(null);
    setLoadingSlots(true);
    setTimeout(() => setLoadingSlots(false), 280);
  };
  const confirm = () => {
    setTouched(true);
    if (!canContinue || !date || !time) return;
    setSubmitting(true);
    setTimeout(() => {
      const b = createBooking({
        salonId: salon.id,
        serviceIds: picked.map((s) => s.id),
        serviceNames: picked.map((s) => s.name),
        stylistId: stylistId ?? null,
        date,
        time,
        duration: minutes,
        total,
        customer: { name: name.trim(), phone: phone.trim() },
        note: note.trim() || undefined,
      });
      navigate(`${paths.booking(b.id)}?new=1`, { replace: true });
    }, 900);
  };
  const next = () => (step === 3 ? confirm() : go(step + 1));
  const cta = step === 3 ? (salon.instantConfirm ? "Confirm booking" : "Request booking") : "Continue";

  const periods = [
    { label: "Morning", items: slots.filter((s) => toMin(s.time) < 720) },
    { label: "Afternoon", items: slots.filter((s) => toMin(s.time) >= 720 && toMin(s.time) < 1020) },
    { label: "Evening", items: slots.filter((s) => toMin(s.time) >= 1020) },
  ].filter((p) => p.items.length);
  const anyFree = slots.some((s) => s.available);

  const groups = categories.map((c) => ({ ...c, services: salon.services.filter((s) => s.category === c.id) })).filter((g) => g.services.length);

  return (
    <div className="min-h-dvh pb-32 lg:pb-16" ref={top}>
      <Seo title={`Book ${salon.name}`} description={`Choose a service and time at ${salon.name}.`} path={paths.salon(salon)} noindex />
      {/* Flow header */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper">
        <div className="shell flex h-[72px] items-center justify-between gap-4">
          <button type="button" onClick={() => (step === 0 ? navigate(paths.salon(salon)) : go(step - 1))} className="inline-flex h-10 items-center gap-2 rounded-sm pr-3 text-[0.9375rem] font-medium hover:bg-ink/6 sm:pl-2">
            <ArrowLeft className="size-[18px]" /> <span className="hidden sm:inline">Back</span>
          </button>
          <ol className="hidden items-center gap-2 md:flex" aria-label="Progress">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <button type="button" disabled={i >= step} onClick={() => go(i)} aria-current={i === step ? "step" : undefined} className={cx("flex items-center gap-2 text-[0.9375rem] transition-colors disabled:cursor-default", i === step ? "font-semibold text-ink" : i < step ? "text-ink-2 hover:text-ink" : "text-mute")}>
                  <span className={cx("grid size-6 place-items-center rounded-full text-[0.8125rem] font-semibold transition-colors", i < step ? "bg-ink text-paper" : i === step ? "bg-accent text-white" : "border border-line")}>{i < step ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}</span>
                  {s}
                </button>
                {i < STEPS.length - 1 && <span className="mx-1.5 h-px w-8 bg-line" />}
              </li>
            ))}
          </ol>
          <p className="text-[0.9375rem] font-medium md:hidden">
            Step {step + 1} of {STEPS.length} <span className="text-mute">· {STEPS[step]}</span>
          </p>
          <Link to={paths.salon(salon)} aria-label="Close booking" className="grid size-10 place-items-center rounded-full hover:bg-ink/6">
            <X className="size-5" />
          </Link>
        </div>
        <div className="h-0.5 bg-line-2 md:hidden">
          <motion.div className="h-full bg-accent" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.5, ease: EASE }} />
        </div>
      </header>

      <div className="shell grid gap-x-16 pt-8 md:pt-12 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div key={step} custom={dir} initial={{ opacity: 0, x: dir * 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -28 }} transition={{ duration: 0.32, ease: EASE }}>
              {/* 1 · Services */}
              {step === 0 && (
                <>
                  <h1 className="t-display-2">Choose your services</h1>
                  <p className="t-lead mt-3">Add as many as you like — we’ll book them back to back.</p>
                  {groups.map((g) => (
                    <div key={g.id} className="mt-9">
                      <h2 className="t-eyebrow border-b border-line pb-3">{g.name}</h2>
                      <ul className="divide-y divide-line-2">
                        {g.services.map((s) => {
                          const on = selected.includes(s.id);
                          return (
                            <li key={s.id}>
                              <button type="button" aria-pressed={on} onClick={() => setSelected((c) => (on ? c.filter((x) => x !== s.id) : [...c, s.id]))} className="group flex w-full items-center gap-5 py-4.5 text-left">
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[1.0625rem] font-semibold">{s.name}</span>
                                  <span className="mt-1 flex items-center gap-3 text-[0.9375rem]">
                                    <span className="font-semibold tabular-nums">{inr(s.price)}</span>
                                    <span className="text-line">·</span>
                                    <span className="text-mute">{fmtDuration(s.duration)}</span>
                                  </span>
                                </span>
                                <span className={cx("grid size-10 shrink-0 place-items-center rounded-full border transition-all duration-300", on ? "border-accent bg-accent text-white" : "border-line group-hover:border-ink group-hover:bg-ink group-hover:text-paper")}>{on ? <Check className="size-[18px]" strokeWidth={2.5} /> : <Plus className="size-[18px]" />}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </>
              )}

              {/* 2 · Professional */}
              {step === 1 && (
                <>
                  <h1 className="t-display-2">Who would you like?</h1>
                  <p className="t-lead mt-3">Pick someone you know, or leave it open for the widest choice of times.</p>
                  <div className="mt-9 grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <OptionCard selected={stylistId === null} onClick={() => setStylistId(null)}>
                        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-paper">
                          <Sparkles className="size-5" />
                        </span>
                        <span>
                          <span className="block text-[1.0625rem] font-semibold">Any available professional</span>
                          <span className="t-meta">Most flexibility on times</span>
                        </span>
                      </OptionCard>
                    </div>
                    {salon.stylists.map((p) => (
                      <OptionCard key={p.id} selected={stylistId === p.id} onClick={() => setStylistId(p.id)}>
                        <Avatar name={p.name} className="!size-12" />
                        <span className="min-w-0">
                          <span className="block truncate text-[1.0625rem] font-semibold">{p.name}</span>
                          <span className="t-meta block truncate">{p.role}</span>
                        </span>
                      </OptionCard>
                    ))}
                  </div>
                </>
              )}

              {/* 3 · Time */}
              {step === 2 && (
                <>
                  <h1 className="t-display-2">Pick a time</h1>
                  <p className="t-lead mt-3">
                    {fmtDuration(minutes)} with {stylist ? stylist.name.split(" ")[0] : "the next available professional"}.
                  </p>
                  <div className="no-scrollbar -mx-5 mt-9 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0" role="listbox" aria-label="Date">
                    {days.map((d) => {
                      const closed = !salon.hours[parseKey(d).getDay()];
                      const on = d === date;
                      return (
                        <button
                          key={d}
                          type="button"
                          role="option"
                          aria-selected={on}
                          disabled={closed}
                          onClick={() => pickDate(d)}
                          className={cx(
                            "relative flex h-[84px] w-[66px] shrink-0 flex-col items-center justify-center rounded-lg border transition-colors duration-200",
                            on ? "border-ink bg-ink text-paper" : closed ? "border-line-2 text-mute/60" : "border-line hover:border-ink",
                          )}
                        >
                          <span className={cx("text-[0.8125rem]", on ? "text-paper/70" : "text-mute")}>{d === todayKey() ? "Today" : fmtWeekday(d)}</span>
                          <span className="font-display text-[1.75rem] leading-tight">{parseKey(d).getDate()}</span>
                          {closed && <span className="absolute bottom-1.5 text-[0.625rem] tracking-wide uppercase">Closed</span>}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-7 text-[1.0625rem] font-semibold">{date && fmtDateLong(date)}</p>

                  {loadingSlots ? (
                    <div className="mt-5 grid grid-cols-3 gap-2.5 sm:grid-cols-4 xl:grid-cols-5">
                      {Array.from({ length: 12 }, (_, i) => (
                        <div key={i} className="skeleton h-12 rounded-md" />
                      ))}
                    </div>
                  ) : !anyFree ? (
                    <div className="mt-5 rounded-xl border border-dashed border-line">
                      <Empty
                        icon={<CalendarX className="size-6" />}
                        title="Nothing free on this day"
                        body="This day is fully booked for the services you’ve chosen. Try another date."
                        action={
                          date && days.indexOf(date) < days.length - 1 ? (
                            <Button variant="outline" onClick={() => pickDate(days[days.indexOf(date) + 1])}>
                              Try the next day
                            </Button>
                          ) : undefined
                        }
                      />
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                      {periods.map((p) => (
                        <div key={p.label} className="mt-6">
                          <p className="t-eyebrow mb-3">{p.label}</p>
                          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 xl:grid-cols-5">
                            {p.items.map((s) => {
                              const on = s.time === time;
                              return (
                                <button
                                  key={s.time}
                                  type="button"
                                  disabled={!s.available}
                                  aria-pressed={on}
                                  onClick={() => setTime(s.time)}
                                  className={cx(
                                    "h-12 rounded-md border text-[0.9375rem] font-medium tabular-nums transition-all duration-200",
                                    on ? "border-accent bg-accent text-white" : s.available ? "border-line bg-card hover:border-ink" : "border-transparent bg-sand/50 text-mute/60 line-through",
                                  )}
                                >
                                  {fmtTime(s.time)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </>
              )}

              {/* 4 · Confirm */}
              {step === 3 && (
                <>
                  <h1 className="t-display-2">Review and confirm</h1>
                  <p className="t-lead mt-3">Almost there. Check the details and tell us who the booking is for.</p>
                  <div className="mt-8 rounded-xl border border-line bg-card p-6 lg:hidden">
                    <Summary salon={salon} picked={picked} stylistName={stylistName} date={date} time={time} total={total} minutes={minutes} />
                  </div>
                  <div className="mt-9 grid gap-5 sm:grid-cols-2">
                    <Field label="Your name" error={touched && !nameOk ? "Please enter your name." : undefined}>
                      <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoComplete="name" />
                    </Field>
                    <Field label="Mobile number" error={touched && !phoneOk ? "Enter a 10-digit mobile number." : undefined}>
                      <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" inputMode="tel" autoComplete="tel" />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Anything the salon should know?" hint="Optional">
                        <textarea className="field !h-28 resize-none py-3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Hair length, allergies, a reference photo you’ll bring…" />
                      </Field>
                    </div>
                  </div>
                  <div className="mt-8 flex gap-4 rounded-lg bg-sand/60 p-5">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-ink-2" />
                    <p className="text-[0.9375rem] text-ink-2">
                      <span className="font-semibold text-ink">Free cancellation</span> until {salon.cancelHours} hours before your appointment. You’ll pay {inr(total)} at the salon — nothing is charged now.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Summary (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 border border-ink bg-card p-7">
            <Summary salon={salon} picked={picked} stylistName={stylistName} date={date} time={time} total={total} minutes={minutes} />
            <Button size="lg" full className="mt-6" variant={step === 3 ? "accent" : "primary"} disabled={!canContinue && step !== 3} loading={submitting} onClick={next}>
              {cta}
              {!submitting && step < 3 && <ArrowRight className="size-[18px]" />}
            </Button>
          </div>
        </aside>
      </div>

      {/* Action bar (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold tabular-nums">{inr(total)}</p>
            <p className="t-meta truncate">{picked.length ? `${picked.length} ${picked.length === 1 ? "service" : "services"} · ${fmtDuration(minutes)}` : "No services yet"}</p>
          </div>
          <Button size="lg" variant={step === 3 ? "accent" : "primary"} disabled={!canContinue && step !== 3} loading={submitting} onClick={next}>
            {cta}
          </Button>
        </div>
      </div>
    </div>
  );
}
