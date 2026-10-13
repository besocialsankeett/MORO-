import { AnimatePresence, motion } from "motion/react";
import { Star, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { brand } from "../brand";
import { img } from "../data/images";
import type { BookingStatus } from "../types";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const EASE = [0.22, 1, 0.36, 1] as const;

/* ── Logo ───────────────────────────────────────────────── */

/** The wordmark: didone capitals, set wide. */
export function Logo({ className, light, plain }: { className?: string; light?: boolean; plain?: boolean }) {
  const cls = cx("font-display inline-block text-[1.625rem] leading-none !tracking-[0.1em] uppercase", light ? "text-paper" : "text-ink", className);
  if (plain) return <span className={cls}>{brand.name}</span>;
  return (
    <Link to="/" aria-label={`${brand.name} home`} className={cls}>
      {brand.name}
    </Link>
  );
}

/* ── Loader ─────────────────────────────────────────────── */

/** MORO's one loading mark: the mirror's arch, drawing itself. Sized by its height; takes the current text colour. */
export function ArchLoader({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <svg role="status" aria-label={label} viewBox="0 0 24 34" fill="none" className={cx("arch-loader w-auto shrink-0", className)}>
      <path d="M2 33V12a10 10 0 0 1 20 0v21" pathLength={1} stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/* ── Button ─────────────────────────────────────────────── */

type Variant = "primary" | "accent" | "outline" | "ghost" | "light";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-accent active:bg-accent-deep",
  accent: "bg-accent text-white hover:bg-accent-deep",
  outline: "border border-ink/25 bg-transparent text-ink hover:border-ink",
  ghost: "text-ink hover:bg-ink/6",
  light: "bg-paper text-ink hover:bg-white",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-14 px-7 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  to?: string;
  href?: string;
  full?: boolean;
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", to, href, full, loading, className, children, disabled, ...rest }: ButtonProps) {
  const cls = cx(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-sm font-medium whitespace-nowrap transition-[background,border-color,color,opacity] duration-200",
    variants[variant],
    sizes[size],
    full && "w-full",
    (disabled || loading) && "pointer-events-none opacity-45",
    className,
  );
  const inner = loading ? (
    <>
      <ArchLoader className="h-[1.15em]" />
      {children}
    </>
  ) : (
    children
  );
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  if (href) return <a href={href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>;
  return (
    <button type="button" className={cls} disabled={disabled || loading} {...rest}>
      {inner}
    </button>
  );
}

/* ── Image with graceful load + fallback ────────────────── */

export function Img({ src, alt, w = 900, h, className, imgClassName, eager, priority }: { src: string; alt: string; w?: number; h?: number; className?: string; imgClassName?: string; eager?: boolean; priority?: boolean }) {
  // "idle" is the server/first-paint state: visible, no transition. Only an image that is
  // still loading once we are mounted gets hidden and faded in.
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [attempt, setAttempt] = useState(0);
  const ref = useRef<HTMLImageElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setState(el.complete && el.naturalWidth > 0 ? "ok" : "loading");
  }, [src, attempt]);
  // One quiet retry before giving up: a dropped request should not leave a hole in the layout.
  const onError = () => (attempt < 1 ? setTimeout(() => setAttempt(1), 700) : setState("error"));
  return (
    <div className={cx("relative overflow-hidden bg-sand", className)}>
      {state === "error" ? (
        <div role="img" aria-label={alt} className="absolute inset-0 grid place-items-center bg-[linear-gradient(135deg,var(--color-sand),var(--color-line))]">
          <span className="font-display text-6xl text-ink/20">{brand.name[0]}</span>
        </div>
      ) : (
        <img
          key={attempt}
          ref={ref}
          src={img(src, w, h)}
          srcSet={`${img(src, w, h)} 1x, ${img(src, Math.min(w * 2, 2400), h ? Math.round((Math.min(w * 2, 2400) / w) * h) : undefined)} 2x`}
          alt={alt}
          loading={eager || priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          onLoad={() => setState("ok")}
          onError={onError}
          className={cx("graded absolute inset-0 size-full object-cover transition-[opacity,transform] duration-700 ease-out-soft", state === "loading" ? "opacity-0" : "opacity-100", imgClassName)}
        />
      )}
    </div>
  );
}

/**
 * A single arched mirror: the hero mirror's bronze frame and bevelled glass around whatever it is given
 * (styles under "Mirror frame and glass" in styles.css). Give it a size through className; the children fill the glass.
 * The light on the frame and glass follows the pointer across it.
 */
export function Mirror({ children, className, frame = 7, onDark }: { children: ReactNode; className?: string; frame?: number; onDark?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let x = 0;
    const place = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight || !r.width) return;
      // 0 at the mirror's left edge, 1 at its right; the light moves the other way, as a reflection would.
      const t = Math.min(2, Math.max(-1, (x - r.left) / r.width));
      el.style.setProperty("--gl", `${(62 - t * 26).toFixed(1)}%`);
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      if (!raf) raf = requestAnimationFrame(place);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);
  return (
    <div ref={ref} className={cx("mirror-frame mirror-solo", onDark && "on-dark", className)} style={{ "--frame": `${frame}px` } as CSSProperties}>
      <div className="mirror-glass">{children}</div>
    </div>
  );
}

/* ── Small pieces ───────────────────────────────────────── */

export function Rating({ value, count, className }: { value: number | null; count?: number; className?: string }) {
  if (value == null) return <span className={cx("text-sm text-mute", className)}>New on {brand.name}</span>;
  return (
    <span className={cx("inline-flex items-center gap-1 text-sm", className)}>
      <Star className="size-[13px] fill-current" strokeWidth={0} />
      <span className="font-semibold tabular-nums">{value.toFixed(1)}</span>
      {count != null && <span className="text-mute">({count.toLocaleString(brand.locale)})</span>}
    </span>
  );
}

const statusStyle: Record<BookingStatus, [string, string]> = {
  pending: ["Awaiting salon", "bg-warn-tint text-warn"],
  confirmed: ["Confirmed", "bg-ok-tint text-ok"],
  completed: ["Completed", "bg-sand text-ink-2"],
  cancelled: ["Cancelled", "bg-bad-tint text-bad"],
  declined: ["Declined", "bg-bad-tint text-bad"],
};
export function StatusBadge({ status, owner }: { status: BookingStatus; owner?: boolean }) {
  const [label, cls] = statusStyle[status];
  return (
    <span className={cx("inline-flex h-6 items-center gap-1.5 rounded-sm px-2 text-[0.8125rem] font-medium", cls)}>
      <span className="size-1.5 rounded-full bg-current" />
      {owner && status === "pending" ? "Needs reply" : label}
    </span>
  );
}

export function Chip({ active, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cx(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-sm border px-3.5 text-[0.9375rem] transition-colors duration-200",
        active ? "border-ink bg-ink text-paper" : "border-ink/25 bg-transparent text-ink hover:border-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return <span className={cx("grid size-11 shrink-0 place-items-center rounded-full bg-sand text-sm font-semibold text-ink-2", className)}>{initials}</span>;
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-sm font-medium">
        {label}
        {hint && <span className="font-normal text-mute">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-sm text-bad">{error}</span>}
    </label>
  );
}

export function Empty({ title, body, action, icon }: { title: string; body: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
      {icon && <div className="mb-5 grid size-14 place-items-center rounded-full border border-line text-ink-2">{icon}</div>}
      <h3 className="t-title">{title}</h3>
      <p className="mt-2 text-ink-2">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Fades content up as it enters the viewport. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ── Modal: centred dialog on desktop, bottom sheet on mobile ── */

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div className="absolute inset-0 bg-ink/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={cx("relative max-h-[90dvh] w-full overflow-y-auto rounded-t-xl bg-paper p-6 shadow-lift sm:rounded-xl sm:p-8", wide ? "sm:max-w-2xl" : "sm:max-w-md")}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div className="mb-5 flex items-start justify-between gap-6">
              {title ? <h2 className="t-title">{title}</h2> : <span />}
              <button type="button" onClick={onClose} aria-label="Close" className="-mt-1 -mr-2 grid size-10 shrink-0 place-items-center rounded-full hover:bg-ink/6">
                <X className="size-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── Popover anchored to its trigger ────────────────────── */

export function Popover({ trigger, children, align = "left", side = "bottom", className }: { trigger: (p: { open: boolean; toggle: () => void }) => ReactNode; children: (close: () => void) => ReactNode; align?: "left" | "right"; side?: "top" | "bottom"; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: side === "top" ? 6 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: side === "top" ? 4 : -4 }}
            transition={{ duration: 0.18, ease: EASE }}
            className={cx("absolute z-50 min-w-56 rounded-md border border-ink/15 bg-card p-1.5 shadow-lift", side === "top" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]", align === "right" ? "right-0" : "left-0", className)}
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MenuItem({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cx("flex w-full items-center justify-between gap-6 rounded-md px-3 py-2.5 text-left text-[0.9375rem] transition-colors hover:bg-ink/6", active && "font-semibold")}>
      {children}
      {active && <span className="size-1.5 rounded-full bg-accent" />}
    </button>
  );
}
