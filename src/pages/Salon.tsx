import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Clock, Images, MapPin, Navigation, Phone, Plus, ShieldCheck, Star, X, Zap } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { MapView } from "../components/Map";
import { NextSlot } from "../components/SalonCard";
import { Avatar, Button, cx, EASE, Empty, Img, Rating } from "../components/ui";
import { sampleReviews } from "../data/reviews";
import { useHydrated } from "../lib/hooks";
import { paths } from "../lib/routes";
import { salonJsonLd, Seo } from "../lib/seo";
import { categories, cityById } from "../data/catalogue";
import { useStore } from "../lib/store";
import { distanceKm, fmtDuration, fmtKm, fmtTime, inr, openStatus, WEEKDAYS } from "../lib/time";
import type { Salon as SalonT, Service } from "../types";

export const directionsUrl = (s: SalonT) => `https://www.google.com/maps/dir/?api=1&destination=${s.coords[0]},${s.coords[1]}`;

function Lightbox({ photos, index, onClose, setIndex, name }: { photos: string[]; index: number | null; onClose: () => void; setIndex: (i: number) => void; name: string }) {
  useEffect(() => {
    if (index == null) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((index + 1) % photos.length);
      if (e.key === "ArrowLeft") setIndex((index - 1 + photos.length) % photos.length);
    };
    document.addEventListener("keydown", on);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", on);
      document.body.style.overflow = "";
    };
  }, [index, photos.length, onClose, setIndex]);

  return (
    <AnimatePresence>
      {index != null && (
        <motion.div className="fixed inset-0 z-[100] flex flex-col bg-ink text-paper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={`${name} photos`}>
          <div className="flex h-16 items-center justify-between px-5">
            <span className="text-sm text-paper/60 tabular-nums">
              {index + 1} / {photos.length}
            </span>
            <button type="button" onClick={onClose} aria-label="Close gallery" className="grid size-10 place-items-center rounded-full hover:bg-paper/10">
              <X className="size-5" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-8 md:px-20">
            <motion.div key={index} className="size-full" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: EASE }}>
              <Img src={photos[index]} alt={`${name}, photo ${index + 1}`} w={1600} eager className="size-full !bg-transparent" imgClassName="!object-contain" />
            </motion.div>
            {[
              ["left-3 md:left-6", ChevronLeft, -1, "Previous photo"] as const,
              ["right-3 md:right-6", ChevronRight, 1, "Next photo"] as const,
            ].map(([pos, Icon, d, label]) => (
              <button key={label} type="button" aria-label={label} onClick={() => setIndex((index + d + photos.length) % photos.length)} className={cx("absolute top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-paper/10 backdrop-blur-sm transition-colors hover:bg-paper/20", pos)}>
                <Icon className="size-5" />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ServiceRow({ service, selected, onToggle }: { service: Service; selected: boolean; onToggle: () => void }) {
  return (
    <li>
      <button type="button" onClick={onToggle} aria-pressed={selected} className="group flex w-full items-center gap-5 py-5 text-left">
        <span className="min-w-0 flex-1">
          <span className="block text-[1.0625rem] font-semibold">{service.name}</span>
          <span className="mt-0.5 block text-[0.9375rem] text-ink-2">{service.description}</span>
          <span className="mt-2 flex items-center gap-3 text-[0.9375rem]">
            <span className="font-semibold tabular-nums">{inr(service.price)}</span>
            <span className="text-line">·</span>
            <span className="text-mute">{fmtDuration(service.duration)}</span>
          </span>
        </span>
        <span
          className={cx(
            "grid size-11 shrink-0 place-items-center rounded-full border transition-all duration-300 ease-out-soft",
            selected ? "border-accent bg-accent text-white" : "border-line text-ink group-hover:border-ink group-hover:bg-ink group-hover:text-paper",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={selected ? "on" : "off"} initial={{ scale: 0.4, opacity: 0, rotate: -45 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ duration: 0.18 }}>
              {selected ? <Check className="size-5" strokeWidth={2.5} /> : <Plus className="size-5" />}
            </motion.span>
          </AnimatePresence>
        </span>
      </button>
    </li>
  );
}

export default function Salon() {
  const { id } = useParams();
  const { salon: find, origin, city } = useStore();
  const hydrated = useHydrated();
  const salon = find(id);
  const [selected, setSelected] = useState<string[]>([]);
  const [photo, setPhoto] = useState<number | null>(null);
  const [cat, setCat] = useState<string | null>(null);

  const groups = useMemo(() => (salon ? categories.map((c) => ({ ...c, services: salon.services.filter((s) => s.category === c.id) })).filter((g) => g.services.length) : []), [salon]);

  if (!salon) {
    return (
      <div className="shell py-24">
        <Seo title="Salon not found" description="This salon page doesn’t exist." path={paths.salons} noindex />
        <Empty title="We couldn’t find that salon" body="It may have been removed, or the link might be out of date." action={<Button to={paths.salons}>Browse salons</Button>} />
      </div>
    );
  }

  const photos = [salon.cover, ...salon.gallery];
  const picked = salon.services.filter((s) => selected.includes(s.id));
  const total = picked.reduce((n, s) => n + s.price, 0);
  const minutes = picked.reduce((n, s) => n + s.duration, 0);
  const status = hydrated ? openStatus(salon) : null;
  const bookUrl = paths.book(salon, selected);
  const reviews = sampleReviews(salon);
  const cityName = cityById(salon.city).name;
  const low = salon.services.length ? Math.min(...salon.services.map((s) => s.price)) : null;
  const toggle = (sid: string) => setSelected((cur) => (cur.includes(sid) ? cur.filter((x) => x !== sid) : [...cur, sid]));
  const today = hydrated ? new Date().getDay() : -1;

  return (
    <div className="shell pt-5 pb-28 md:pt-8 lg:pb-0">
      <Seo
        title={`${salon.name}, ${salon.area} — services, prices and booking`}
        description={`${salon.tagline} Book ${salon.name} in ${salon.area}, ${cityName}${low != null ? `: ${salon.services.length} services from ₹${low}` : ""}. See the menu, opening hours and free times.`.slice(0, 300)}
        path={paths.salon(salon)}
        image={salon.cover}
        noindex={salon.id.startsWith("my-")}
        jsonLd={salonJsonLd(salon, cityName)}
      />
      <Link to={paths.salons} className="inline-flex items-center gap-2 text-[0.9375rem] text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" /> All salons
      </Link>

      {/* Identity */}
      <header className="mt-6 flex flex-wrap items-end justify-between gap-x-10 gap-y-5 md:mt-8">
        <div>
          {salon.badge && <p className="t-eyebrow mb-4 !text-accent">{salon.badge}</p>}
          <h1 className="t-display-1 !text-[clamp(3rem,7vw,7rem)]">{salon.name}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.9375rem]">
            <Rating value={salon.rating} count={salon.reviews || undefined} className="!text-[0.9375rem]" />
            <span className="inline-flex items-center gap-1.5 text-ink-2">
              <MapPin className="size-4" /> {salon.area}
              {salon.city === city ? ` · ${fmtKm(distanceKm(origin, salon.coords))} away` : `, ${cityById(salon.city).name}`}
            </span>
            {status && (
              <span className={cx("inline-flex items-center gap-1.5", status.open ? "text-ok" : "text-ink-2")}>
                <span className={cx("size-1.5 rounded-full", status.open ? "bg-ok" : "bg-mute")} />
                {status.label}
              </span>
            )}
          </div>
        </div>
        <div className="hidden gap-2.5 lg:flex">
          <Button variant="outline" href={directionsUrl(salon)}>
            <Navigation className="size-4" /> Directions
          </Button>
          <Button to={bookUrl}>Book an appointment</Button>
        </div>
      </header>

      {/* Gallery */}
      <section className="relative mt-8 md:mt-10" aria-label="Photos">
        <div className="hidden h-[min(62vh,620px)] grid-cols-4 grid-rows-2 gap-3 md:grid">
          {photos.slice(0, 5).map((p, i) => (
            <button key={p} type="button" onClick={() => setPhoto(i)} className={cx("anim-fade-up group overflow-hidden", i === 0 && "col-span-2 row-span-2")} style={{ "--d": `${i * 0.06}s` } as CSSProperties} aria-label={`Open photo ${i + 1}`}>
              <Img src={p} alt={i === 0 ? `Inside ${salon.name}, ${salon.area}` : `${salon.name}, photo ${i + 1}`} w={i === 0 ? 1300 : 640} priority={i === 0} className="size-full" imgClassName="group-hover:scale-[1.04]" />
            </button>
          ))}
        </div>
        <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 md:hidden">
          {photos.map((p, i) => (
            <button key={p} type="button" onClick={() => setPhoto(i)} className="w-[86%] shrink-0 snap-center" aria-label={`Open photo ${i + 1}`}>
              <Img src={p} alt={`${salon.name}, photo ${i + 1}`} w={800} eager={i === 0} className="aspect-[4/3]" />
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setPhoto(0)} className="absolute right-4 bottom-4 hidden items-center gap-2 rounded-sm bg-paper px-4 py-2.5 text-sm font-medium shadow-soft transition-transform hover:scale-[1.03] md:inline-flex">
          <Images className="size-4" /> All {photos.length} photos
        </button>
      </section>

      <div className="mt-12 grid gap-x-16 gap-y-14 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0">
          {/* About */}
          <section>
            <p className="t-display-3 max-w-3xl">{salon.tagline}</p>
            <p className="t-lead mt-5 max-w-2xl">{salon.description}</p>
          </section>

          {/* Services */}
          <section className="mt-16" id="services">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="t-display-3">Services</h2>
              <p className="t-meta">Tap to add. You can book several together.</p>
            </div>
            {groups.length > 1 && (
              <div className="no-scrollbar -mx-5 mt-6 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
                <button type="button" onClick={() => setCat(null)} className={cx("h-10 shrink-0 rounded-sm border px-4 text-[0.9375rem] transition-colors", !cat ? "border-ink bg-ink text-paper" : "border-line hover:border-ink")}>
                  All
                </button>
                {groups.map((g) => (
                  <button key={g.id} type="button" onClick={() => setCat(g.id)} className={cx("h-10 shrink-0 rounded-sm border px-4 text-[0.9375rem] transition-colors", cat === g.id ? "border-ink bg-ink text-paper" : "border-line hover:border-ink")}>
                    {g.name}
                  </button>
                ))}
              </div>
            )}
            {groups.length === 0 && <p className="mt-6 text-ink-2">This salon hasn’t published its menu yet.</p>}
            <div className="mt-4">
              {groups
                .filter((g) => !cat || g.id === cat)
                .map((g) => (
                  <motion.div key={g.id} layout="position" className="mt-8">
                    <h3 className="t-eyebrow border-b border-line pb-3">{g.name}</h3>
                    <ul className="divide-y divide-line-2">
                      {g.services.map((s) => (
                        <ServiceRow key={s.id} service={s} selected={selected.includes(s.id)} onToggle={() => toggle(s.id)} />
                      ))}
                    </ul>
                  </motion.div>
                ))}
            </div>
          </section>

          {/* Team */}
          {salon.stylists.length > 0 && (
            <section className="mt-16">
              <h2 className="t-display-3">The team</h2>
              <ul className="mt-7 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {salon.stylists.map((p) => (
                  <li key={p.id} className="flex items-center gap-4 border-b border-line-2 pb-5">
                    <Avatar name={p.name} className="!size-14 !text-base" />
                    <div>
                      <p className="text-[1.0625rem] font-semibold">{p.name}</p>
                      <p className="t-meta">{p.role}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Visit */}
          <section className="mt-16">
            <h2 className="t-display-3">Visit</h2>
            <div className="mt-7 grid gap-8 md:grid-cols-2">
              <div>
                <div className="h-56 overflow-hidden border border-ink/20">
                  <MapView center={salon.coords} zoom={15} pins={[{ id: salon.id, coords: salon.coords, label: salon.name }]} interactive={false} />
                </div>
                <p className="mt-4 text-[1.0625rem]">{salon.address}</p>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem] font-medium">
                  <a href={directionsUrl(salon)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 underline decoration-line underline-offset-[6px] hover:decoration-ink">
                    <Navigation className="size-4" /> Get directions
                  </a>
                  <a href={`tel:${salon.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 underline decoration-line underline-offset-[6px] hover:decoration-ink">
                    <Phone className="size-4" /> {salon.phone}
                  </a>
                </div>
              </div>
              <div>
                <p className="t-eyebrow mb-3">Opening hours</p>
                <ul>
                  {WEEKDAYS.map((_, i) => {
                    const d = (i + 1) % 7; // Monday first
                    const h = salon.hours[d];
                    return (
                      <li key={d} className={cx("flex justify-between border-b border-line-2 py-2.5 text-[0.9375rem]", d === today ? "font-semibold" : "text-ink-2")}>
                        <span>
                          {WEEKDAYS[d]}
                          {d === today && <span className="ml-2 text-accent">Today</span>}
                        </span>
                        <span className="tabular-nums">{h ? `${fmtTime(h.open)} – ${fmtTime(h.close)}` : "Closed"}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>

          {/* Reviews — sample content, labelled as such */}
          {reviews.length > 0 && (
            <section className="mt-16" aria-labelledby="reviews-title">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 id="reviews-title" className="t-display-3">
                  What people say
                </h2>
                <p className="t-eyebrow">Sample reviews · demo content</p>
              </div>
              <ul className="mt-7 border-t border-ink">
                {reviews.map((r) => (
                  <li key={r.author} className="grid gap-x-8 gap-y-2 border-b border-ink/15 py-6 md:grid-cols-[11rem_minmax(0,1fr)]">
                    <div>
                      <p className="font-semibold">{r.author}</p>
                      <p className="mt-1 flex items-center gap-0.5" aria-label={`${r.rating} out of 5`}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={cx("size-3.5", n <= r.rating ? "fill-ink text-ink" : "fill-line text-line")} strokeWidth={0} />
                        ))}
                      </p>
                      <p className="t-meta mt-1">{r.when}</p>
                    </div>
                    <p className="text-[1.0625rem] leading-relaxed text-ink-2">{r.text}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Policy */}
          <section className="mt-14 grid gap-5 border border-ink/15 bg-card p-6 sm:grid-cols-2 md:p-8">
            <div className="flex gap-4">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-ink-2" />
              <div>
                <p className="font-semibold">Free cancellation</p>
                <p className="mt-1 text-[0.9375rem] text-ink-2">Cancel up to {salon.cancelHours} hours before your appointment at no charge.</p>
              </div>
            </div>
            <div className="flex gap-4">
              {salon.instantConfirm ? <Zap className="mt-0.5 size-5 shrink-0 text-ink-2" /> : <Clock className="mt-0.5 size-5 shrink-0 text-ink-2" />}
              <div>
                <p className="font-semibold">{salon.instantConfirm ? "Instant confirmation" : "Confirmed by the salon"}</p>
                <p className="mt-1 text-[0.9375rem] text-ink-2">{salon.instantConfirm ? "Your slot is held the moment you book. Pay at the salon." : "The salon reviews each request, usually within the hour. Pay at the salon."}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Booking card (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 border border-ink bg-card p-7">
            <p className="t-eyebrow">Next available</p>
            <NextSlot salon={salon} className="mt-2.5 !text-[1.0625rem]" />
            <div className="my-6 border-t border-line-2" />
            <AnimatePresence mode="popLayout" initial={false}>
              {picked.length === 0 ? (
                <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-ink-2">
                  Choose one or more services from the menu, or continue and pick as you go.
                </motion.p>
              ) : (
                <motion.div key="some" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ul className="space-y-3">
                    <AnimatePresence initial={false}>
                      {picked.map((s) => (
                        <motion.li key={s.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.25 }} className="flex items-start justify-between gap-4">
                          <span>
                            <span className="block font-medium">{s.name}</span>
                            <span className="t-meta">{fmtDuration(s.duration)}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="font-semibold tabular-nums">{inr(s.price)}</span>
                            <button type="button" onClick={() => toggle(s.id)} aria-label={`Remove ${s.name}`} className="grid size-7 place-items-center rounded-full text-mute hover:bg-ink/6 hover:text-ink">
                              <X className="size-4" />
                            </button>
                          </span>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                  <div className="mt-5 flex items-baseline justify-between border-t border-line-2 pt-5">
                    <span className="text-ink-2">Total · {fmtDuration(minutes)}</span>
                    <span className="font-display text-3xl tabular-nums">{inr(total)}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <Button to={bookUrl} size="lg" full className="mt-6">
              {picked.length ? "Choose a time" : "Book an appointment"}
              <ArrowRight className="size-[18px]" />
            </Button>
            <p className="mt-3.5 text-center text-sm text-mute">No payment needed to book</p>
          </div>
        </aside>
      </div>

      {/* Booking bar (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            {picked.length ? (
              <>
                <p className="font-semibold tabular-nums">{inr(total)}</p>
                <p className="t-meta truncate">
                  {picked.length} {picked.length === 1 ? "service" : "services"} · {fmtDuration(minutes)}
                </p>
              </>
            ) : (
              <>
                <p className="t-meta">Next available</p>
                <NextSlot salon={salon} />
              </>
            )}
          </div>
          <Button to={bookUrl} size="lg">
            {picked.length ? "Choose a time" : "Book now"}
          </Button>
        </div>
      </div>

      <Lightbox photos={photos} index={photo} setIndex={setPhoto} onClose={() => setPhoto(null)} name={salon.name} />
    </div>
  );
}
