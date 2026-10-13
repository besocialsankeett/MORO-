import { motion } from "motion/react";
import { ArrowRight, CalendarCheck, Clock3, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, EASE, Img, Reveal } from "../../components/ui";
import { brand } from "../../brand";
import { paths } from "../../lib/routes";
import { Seo } from "../../lib/seo";
import { useStore } from "../../lib/store";

export default function Partners() {
  const { ownerSalonId, salon, becomeOwner, city, salons } = useStore();
  const navigate = useNavigate();
  const mine = salon(ownerSalonId ?? undefined);
  // The demo is most convincing on a salon that is open today, so there is a live diary to look at.
  const today = new Date().getDay();
  const demo = salons.find((s) => s.city === city && s.hours[today]) ?? salons.find((s) => s.city === city) ?? salons[0];

  const tryDemo = () => {
    becomeOwner(demo.id, true);
    navigate("/partners/dashboard");
  };

  return (
    <>
      <Seo
        title={`List your salon on ${brand.name} — online booking for salons and barbers`}
        description={`Put your salon in front of people nearby who are ready to book. Set your menu and hours once and take appointments around the clock with ${brand.name}.`}
        path={paths.partners}
        image="roomBarbers"
      />
      <section className="bg-ink text-paper">
        <div className="shell grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2">
          <motion.div initial={false}>
            <p className="t-eyebrow !text-paper/50">{brand.name} for salons</p>
            <h1 className="t-display-1 mt-6 !text-[clamp(3rem,6.2vw,6.25rem)]">
              Your chairs, <em>always full.</em>
            </h1>
            <p className="mt-7 max-w-lg text-[1.125rem] leading-relaxed text-paper/70">Put your salon in front of people nearby who are ready to book. Set your menu and hours once — we’ll take appointments around the clock, so you can keep your hands on the work.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              {mine ? (
                <Button to="/partners/dashboard" variant="accent" size="lg">
                  Open {mine.name || "your"} dashboard <ArrowRight className="size-[18px]" />
                </Button>
              ) : (
                <Button to="/partners/setup" variant="accent" size="lg">
                  List your salon <ArrowRight className="size-[18px]" />
                </Button>
              )}
              <Button variant="outline" size="lg" className="!border-paper/25 !text-paper hover:!border-paper" onClick={tryDemo}>
                Explore a demo dashboard
              </Button>
            </div>
            <p className="mt-5 text-sm text-paper/45">Setup takes about five minutes. No card, no contract.</p>
          </motion.div>
          <motion.div className="relative" initial={false}>
            <Img src="roomBarbers" alt="Barbers at work in a bright, modern shop" w={1100} priority className="aspect-[5/4]" />
          </motion.div>
        </div>
      </section>

      <section className="shell py-16 md:py-24">
        <Reveal>
          <p className="t-eyebrow mb-4">Why owners use it</p>
          <h2 className="t-display-2 max-w-3xl">
            Built for small salons, <em>not IT departments.</em>
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
          {[
            [Store, "A profile worth visiting", "Photos, menu, prices and a map pin. Clients see exactly what you offer before they walk in."],
            [CalendarCheck, "Bookings that manage themselves", "Clients pick from your real availability. Accept instantly, or approve each request yourself."],
            [Clock3, "Your time, protected", "Lunch, a supplier visit, a quiet Tuesday — block any slot in one tap and it disappears from the app."],
          ].map(([Icon, t, d], i) => {
            const I = Icon as typeof Store;
            return (
              <Reveal key={t as string} delay={i * 0.08} className="bg-paper">
                <div className="h-full p-7 md:p-10">
                  <I className="size-7 text-accent" strokeWidth={1.5} />
                  <h3 className="t-title mt-10 md:mt-14">{t as string}</h3>
                  <p className="mt-2.5 text-ink-2">{d as string}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="shell">
        <Reveal className="grid items-center gap-10 rounded-xl bg-sand/70 p-8 md:grid-cols-[1fr_auto] md:p-14">
          <div>
            <h2 className="t-display-3">Four short steps, then you’re live.</h2>
            <ol className="mt-6 grid gap-x-10 gap-y-3 text-[1.0625rem] sm:grid-cols-2">
              {["Tell us about your salon", "Drop a pin on the map", "Add services and prices", "Set your opening hours"].map((s, i) => (
                <li key={s} className="flex items-baseline gap-3">
                  <span className="font-mono text-[0.8125rem] text-accent">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
          <Button to={mine ? "/partners/dashboard" : "/partners/setup"} size="lg">
            {mine ? "Go to dashboard" : "Get started"}
          </Button>
        </Reveal>
      </section>
    </>
  );
}
