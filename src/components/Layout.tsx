import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, ChevronDown, LocateFixed, LogOut, MapPin, Menu, Store, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { brand } from "../brand";
import { cities, cityById } from "../data/catalogue";
import { paths } from "../lib/routes";
import { useStore } from "../lib/store";
import { Avatar, Button, cx, EASE, Field, Logo, MenuItem, Modal, Popover } from "./ui";

/* ── Location selector ──────────────────────────────────── */

function LocationMenu({ close }: { close: () => void }) {
  const { city, geo, setCity, setGeo } = useStore();
  const [locating, setLocating] = useState<"idle" | "busy" | "denied">("idle");
  const locate = () => {
    if (!navigator.geolocation) return setLocating("denied");
    setLocating("busy");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGeo([p.coords.latitude, p.coords.longitude]);
        setLocating("idle");
        close();
      },
      () => setLocating("denied"),
      { timeout: 8000 },
    );
  };
  return (
    <div className="w-64">
      <p className="t-eyebrow px-3 pt-2.5 pb-2">Choose a city</p>
      {cities.map((c) => (
        <MenuItem key={c.id} active={c.id === city} onClick={() => (setCity(c.id), close())}>
          {c.name}
        </MenuItem>
      ))}
      <div className="mx-3 my-1.5 border-t border-line-2" />
      <button type="button" onClick={locate} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[0.9375rem] hover:bg-ink/6">
        <LocateFixed className={cx("size-4", geo && "text-accent")} />
        {locating === "busy" ? "Finding you…" : geo ? "Using your location" : "Use my current location"}
      </button>
      {locating === "denied" && <p className="px-3 pb-2 text-sm text-mute">We couldn’t access your location. Distances are measured from the city centre instead.</p>}
    </div>
  );
}

function LocationButton({ className }: { className?: string }) {
  const { city } = useStore();
  return (
    <Popover
      className="!p-1.5"
      trigger={({ open, toggle }) => (
        <button type="button" onClick={toggle} aria-expanded={open} className={cx("inline-flex h-10 items-center gap-1.5 rounded-sm px-3 text-[0.9375rem] font-medium transition-colors hover:bg-ink/6", className)}>
          <MapPin className="size-4 text-accent" />
          {cityById(city).name}
          <ChevronDown className={cx("size-4 text-mute transition-transform duration-200", open && "rotate-180")} />
        </button>
      )}
    >
      {(close) => <LocationMenu close={close} />}
    </Popover>
  );
}

/* ── Sign in (name + phone only; no passwords in this demo) ── */

export function SignInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signIn } = useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const valid = name.trim().length > 1 && phone.replace(/\D/g, "").length >= 10;
  return (
    <Modal open={open} onClose={onClose} title={`Welcome to ${brand.name}`}>
      <p className="-mt-2 mb-6 text-ink-2">Tell us who’s booking. We’ll use this to hold your appointments and keep them in one place.</p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          signIn({ name: name.trim(), phone: phone.trim() });
          onClose();
        }}
      >
        <Field label="Your name">
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoComplete="name" autoFocus />
        </Field>
        <Field label="Mobile number">
          <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" inputMode="tel" autoComplete="tel" />
        </Field>
        <Button type="submit" size="lg" full disabled={!valid}>
          Continue
        </Button>
        <p className="text-center text-sm text-mute">This is a portfolio demo — details stay in your browser.</p>
      </form>
    </Modal>
  );
}

/* ── Navigation ─────────────────────────────────────────── */

const navLink = ({ isActive }: { isActive: boolean }) =>
  cx("relative py-2 text-[0.9375rem] font-medium transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:bg-ink after:transition-transform after:duration-300", isActive ? "text-ink after:scale-x-100" : "text-ink-2 after:scale-x-0 hover:text-ink hover:after:scale-x-100");

export function Nav() {
  const { user, signOut, bookings } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [signIn, setSignIn] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const upcoming = bookings.filter((b) => b.source === "you" && (b.status === "confirmed" || b.status === "pending")).length;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setMenu(false), [pathname]);

  return (
    <>
      <header className={cx("sticky top-0 z-40 bg-paper transition-[border-color] duration-300", scrolled ? "border-b border-line" : "border-b border-transparent")}>
        <div className="shell flex h-[72px] items-center gap-6 lg:gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex lg:gap-7" aria-label="Primary">
            <NavLink to={paths.salons} className={navLink}>
              Salons
            </NavLink>
            <Link to="/#services" className={navLink({ isActive: false })}>
              Services
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <LocationButton />
            <Link to="/partners" className="hidden h-10 items-center rounded-sm px-3 text-[0.9375rem] text-ink-2 transition-colors hover:text-ink lg:inline-flex">
              For salons
            </Link>
            {user ? (
              <Popover
                align="right"
                trigger={({ toggle, open }) => (
                  <button type="button" onClick={toggle} aria-expanded={open} aria-label="Your account" className="relative hidden rounded-full md:block">
                    <Avatar name={user.name} className="!size-10 !bg-ink !text-paper" />
                    {upcoming > 0 && <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-paper bg-accent" />}
                  </button>
                )}
              >
                {(close) => (
                  <div className="w-60">
                    <div className="px-3 pt-2.5 pb-2">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-mute">{user.phone}</p>
                    </div>
                    <div className="mx-3 my-1 border-t border-line-2" />
                    <MenuItem onClick={() => (navigate("/appointments"), close())}>
                      <span className="flex items-center gap-2.5">
                        <CalendarDays className="size-4" /> My appointments
                      </span>
                    </MenuItem>
                    <MenuItem onClick={() => (signOut(), close())}>
                      <span className="flex items-center gap-2.5">
                        <LogOut className="size-4" /> Sign out
                      </span>
                    </MenuItem>
                  </div>
                )}
              </Popover>
            ) : (
              <button type="button" onClick={() => setSignIn(true)} className="hidden h-10 items-center rounded-sm px-3 text-[0.9375rem] font-medium hover:bg-ink/6 md:inline-flex">
                Sign in
              </button>
            )}
            <Button to={paths.salons} className="ml-1.5 max-sm:hidden">
              Find a salon
            </Button>
            <button type="button" onClick={() => setMenu(true)} aria-label="Open menu" className="grid size-10 place-items-center rounded-full hover:bg-ink/6 md:hidden">
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-50 flex flex-col bg-paper md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="shell flex h-[72px] items-center justify-between">
              <Logo />
              <button type="button" onClick={() => setMenu(false)} aria-label="Close menu" className="grid size-10 place-items-center rounded-full hover:bg-ink/6">
                <X className="size-5" />
              </button>
            </div>
            <nav className="shell flex flex-1 flex-col pt-6" aria-label="Mobile">
              {[
                ["Salons", paths.salons],
                ["Services", "/#services"],
                ["My appointments", "/appointments"],
                ["For salons", "/partners"],
              ].map(([label, to], i) => (
                <motion.div key={to} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.5, ease: EASE }}>
                  <Link to={to} className="t-display-3 block border-b border-line-2 py-4">
                    {label}
                  </Link>
                </motion.div>
              ))}
              <div className="mt-auto space-y-3 pb-8">
                {user ? (
                  <p className="text-ink-2">
                    Signed in as <span className="font-semibold text-ink">{user.name}</span> ·{" "}
                    <button type="button" className="underline underline-offset-4" onClick={signOut}>
                      Sign out
                    </button>
                  </p>
                ) : (
                  <Button variant="outline" size="lg" full onClick={() => (setMenu(false), setSignIn(true))}>
                    Sign in
                  </Button>
                )}
                <Button to={paths.salons} size="lg" full>
                  Find a salon
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
      <SignInModal open={signIn} onClose={() => setSignIn(false)} />
    </>
  );
}

/* ── Footer ─────────────────────────────────────────────── */

export function Footer() {
  const { setCity } = useStore();
  return (
    <footer className="mt-24 bg-ink text-paper md:mt-32">
      <div className="shell grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:py-20">
        <div>
          <Logo light className="!text-[1.75rem]" />
          <p className="mt-4 max-w-xs text-paper/60">Trusted local salons, clear prices and a time that suits you. No calls, no waiting.</p>
        </div>
        <div>
          <p className="t-eyebrow !text-paper/45">Discover</p>
          <ul className="mt-4 space-y-2.5 text-paper/80">
            <li><Link className="hover:text-paper" to={paths.salons}>All salons</Link></li>
            <li><Link className="hover:text-paper" to={`${paths.salons}?sort=rating`}>Top rated</Link></li>
            <li><Link className="hover:text-paper" to={`${paths.salons}?date=today`}>Available today</Link></li>
            <li><Link className="hover:text-paper" to="/appointments">My appointments</Link></li>
          </ul>
        </div>
        <div>
          <p className="t-eyebrow !text-paper/45">Cities</p>
          <ul className="mt-4 space-y-2.5 text-paper/80">
            {cities.map((c) => (
              <li key={c.id}>
                <Link className="hover:text-paper" to={`${paths.salons}?city=${c.id}`} onClick={() => setCity(c.id)}>
                  Salons in {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="t-eyebrow !text-paper/45">For salons</p>
          <ul className="mt-4 space-y-2.5 text-paper/80">
            <li><Link className="inline-flex items-center gap-2 hover:text-paper" to="/partners"><Store className="size-4" /> List your salon</Link></li>
            <li><Link className="hover:text-paper" to="/partners/dashboard">Owner dashboard</Link></li>
          </ul>
        </div>
      </div>
      {/* The wordmark, as large as the page allows. */}
      <div className="shell overflow-hidden" aria-hidden>
        <Logo light plain className="!block text-center !text-[24vw] !leading-[0.85] !tracking-[0.02em] 2xl:!text-[22rem]" />
      </div>
      <div className="shell mt-10 flex flex-col justify-between gap-2 border-t border-paper/12 py-6 text-sm text-paper/45 sm:flex-row">
        <p>© {new Date().getFullYear()} {brand.name}. A portfolio concept — salons shown are fictional.</p>
        <p>Photography via Unsplash.</p>
      </div>
    </footer>
  );
}

export default function Layout() {
  return (
    <>
      <Nav />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
