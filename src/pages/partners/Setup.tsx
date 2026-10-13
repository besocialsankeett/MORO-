import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HoursEditor, LocationEditor, PhotoEditor, ProfileEditor, ServicesEditor } from "../../components/OwnerEditors";
import { Button, cx, EASE, Logo } from "../../components/ui";
import { cityById } from "../../data/catalogue";
import { paths } from "../../lib/routes";
import { Seo } from "../../lib/seo";
import { useStore } from "../../lib/store";
import type { Salon } from "../../types";

const STEPS = [
  { name: "Your salon", title: "Tell us about your salon", lead: "This is what clients read first. You can change any of it later." },
  { name: "Location", title: "Where can clients find you?", lead: "Search for your address, then fine-tune the pin." },
  { name: "Services", title: "What’s on the menu?", lead: "Start with a few favourites. Prices and timings are yours to set." },
  { name: "Hours", title: "When are you open?", lead: "We’ll only offer appointments inside these hours." },
];

function blank(cityId: string): Salon {
  const c = cityById(cityId);
  return {
    id: `my-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    tagline: "",
    description: "",
    city: c.id,
    area: c.areas[0],
    address: "",
    phone: "",
    coords: c.you,
    rating: null,
    reviews: 0,
    cover: "roomMirrors",
    gallery: ["roomCorner", "styleBlowdry", "barberComb"],
    hours: Array.from({ length: 7 }, (_, i) => (i === 1 ? null : { open: "10:00", close: "20:00" })),
    services: [],
    stylists: [],
    instantConfirm: true,
    cancelHours: 3,
    busy: 0,
    badge: "New",
  };
}

export default function Setup() {
  const { city, saveSalon, becomeOwner } = useStore();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Salon>(() => blank(city));
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [publishing, setPublishing] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const patch = (p: Partial<Salon>) => setDraft((d) => ({ ...d, ...p }));

  const valid = [
    draft.name.trim().length > 1 && !!draft.cover,
    draft.address.trim().length > 4,
    draft.services.length > 0 && draft.services.every((s) => s.name.trim() && s.price > 0),
    draft.hours.some(Boolean),
  ][step];
  const hint = ["Add a name to continue.", "Add your street address to continue.", "Add at least one named, priced service.", "Open on at least one day."][step];

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    top.current?.scrollIntoView();
  };
  const publish = () => {
    setPublishing(true);
    setTimeout(() => {
      const salon: Salon = {
        ...draft,
        name: draft.name.trim(),
        tagline: draft.tagline.trim() || `A new salon in ${draft.area}.`,
        description: draft.description.trim() || `${draft.name.trim()} has just joined us in ${draft.area}. Book in and be one of the first to visit.`,
      };
      saveSalon(salon);
      becomeOwner(salon.id);
      navigate("/partners/dashboard?welcome=1", { replace: true });
    }, 900);
  };

  return (
    <div className="min-h-dvh pb-32" ref={top}>
      <Seo title="List your salon" description="Set up your salon profile." path={paths.setup} noindex />
      <header className="sticky top-0 z-40 border-b border-line bg-paper">
        <div className="shell flex h-[72px] items-center justify-between gap-4">
          <Logo />
          <ol className="hidden items-center gap-2 md:flex">
            {STEPS.map((s, i) => (
              <li key={s.name} className="flex items-center gap-2">
                <button type="button" disabled={i >= step} onClick={() => go(i)} className={cx("flex items-center gap-2 text-[0.9375rem] disabled:cursor-default", i === step ? "font-semibold" : i < step ? "text-ink-2 hover:text-ink" : "text-mute")}>
                  <span className={cx("grid size-6 place-items-center rounded-full text-[0.8125rem] font-semibold", i < step ? "bg-ink text-paper" : i === step ? "bg-accent text-white" : "border border-line")}>{i < step ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}</span>
                  {s.name}
                </button>
                {i < STEPS.length - 1 && <span className="mx-1.5 h-px w-8 bg-line" />}
              </li>
            ))}
          </ol>
          <p className="text-[0.9375rem] font-medium md:hidden">
            Step {step + 1} of {STEPS.length}
          </p>
          <Link to="/partners" aria-label="Exit setup" className="grid size-10 place-items-center rounded-full hover:bg-ink/6">
            <X className="size-5" />
          </Link>
        </div>
        <div className="h-0.5 bg-line-2 md:hidden">
          <motion.div className="h-full bg-accent" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.5, ease: EASE }} />
        </div>
      </header>

      <div className="mx-auto w-full max-w-[760px] px-5 pt-10 md:pt-16">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, x: dir * 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -28 }} transition={{ duration: 0.32, ease: EASE }}>
            <p className="t-eyebrow mb-4">
              Step {step + 1} · {STEPS[step].name}
            </p>
            <h1 className="t-display-2">{STEPS[step].title}</h1>
            <p className="t-lead mt-3">{STEPS[step].lead}</p>
            <div className="mt-10">
              {step === 0 && (
                <>
                  <ProfileEditor salon={draft} onChange={patch} />
                  <h2 className="t-title mt-12 mb-2">Photos</h2>
                  <PhotoEditor salon={draft} onChange={patch} />
                </>
              )}
              {step === 1 && <LocationEditor salon={draft} onChange={patch} />}
              {step === 2 && <ServicesEditor salon={draft} onChange={patch} />}
              {step === 3 && <HoursEditor salon={draft} onChange={patch} />}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper">
        <div className="mx-auto flex w-full max-w-[760px] items-center justify-between gap-4 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => go(step - 1)}>
              <ArrowLeft className="size-4" /> Back
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-4">
            {!valid && <span className="hidden text-sm text-mute sm:inline">{hint}</span>}
            {step < STEPS.length - 1 ? (
              <Button size="lg" disabled={!valid} onClick={() => go(step + 1)}>
                Continue <ArrowRight className="size-[18px]" />
              </Button>
            ) : (
              <Button size="lg" variant="accent" disabled={!valid} loading={publishing} onClick={publish}>
                Publish salon
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
