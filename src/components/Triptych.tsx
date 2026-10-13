import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { img } from "../data/images";
import { cx } from "./ui";

export interface TriptychPanel {
  /** Photo reference (see data/images.ts). */
  photo: string;
  /** What the panel shows, for alt text. */
  label: string;
  /** Where clicking the panel goes. */
  href: string;
}

const photoUrl = (ref: string) => img(ref, 720, 1080);

/** Wing angles, in degrees from flat. */
const REST = 30; // how the mirror stands
const SHUT = 84; // almost edge-on: where the wings wait behind the page intro
const FOLDED = 54; // where scrolling takes them
const LIFT = 11; // a hovered wing opens this much flatter, toward you

/** Where the streak of light sits on each pane at rest (see --gl in styles.css). */
const GLARE = [64, 38, 26];
const LEAVES = ["tri-left", "tri-centre", "tri-right"];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * The hero mirror: a three-panel vanity mirror (left wing, centre, right wing), each pane showing a salon.
 *
 * It is built from ordinary elements and CSS 3D transforms, so it needs no WebGL and looks the same on
 * every device. The panes are real links. What ships in the HTML is the mirror standing at rest; once the
 * page is interactive, a small animation loop drives a handful of CSS variables (see styles.css):
 *
 *   • the whole mirror tilts toward the pointer, and breathes when left alone;
 *   • what each pane reflects slides the other way, and the light on the glass and frame moves with it;
 *   • on a first visit the wings swing open as the page intro clears; scrolling folds them in;
 *   • the active pane steps forward and the others dim.
 *
 * With reduced motion the mirror stands still; only the active pane's emphasis changes.
 */
export function Triptych({ panels, active, onActive, className }: { panels: TriptychPanel[]; active: number | null; onActive: (i: number | null) => void; className?: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const wanted = useRef(active);
  wanted.current = active;

  useEffect(() => {
    const el = stage.current;
    const rig = el?.querySelector<HTMLElement>(".tri-rig");
    if (!el || !rig) return;
    const leaves = Array.from(el.querySelectorAll<HTMLElement>(".tri-leaf"));
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    let scroll = 0;
    const onScroll = () => {
      scroll = clamp(window.scrollY / Math.max(1, window.innerHeight * 0.85), 0, 1);
    };

    // On a first visit the page arrives behind the intro (index.html): wait shut, and open as it clears.
    const w = window as Window & { __moroIntroOpen?: boolean };
    const behindIntro = !calm && document.documentElement.classList.contains("intro") && !w.__moroIntroOpen;
    let open = behindIntro ? 0 : 1; // 0 shut → 1 standing open
    let opening = false;
    const onIntro = () => (opening = true);
    if (behindIntro) window.addEventListener("moro:intro-open", onIntro, { once: true });

    let ry = 0;
    let rx = 0;
    let wing = behindIntro ? SHUT : REST;
    const lift = [0, 0, 0];
    const shade = [0, 0, 0];
    let elapsed = 0;
    let last = 0;
    let raf = 0;
    let visible = true;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;
      const ease = calm ? 1 : 1 - Math.exp(-dt * 5);
      const act = wanted.current;

      // Wings: open on arrival, fold as the page scrolls away.
      if (opening) open = Math.min(1, open + dt / 1.6);
      const opened = 1 - Math.pow(1 - open, 3);
      const wingTarget = SHUT + (REST - SHUT) * opened + (calm ? 0 : scroll * (FOLDED - REST));
      wing += (wingTarget - wing) * (open < 1 ? 1 : ease);

      // The whole mirror turns toward the pointer (about 14° either way, 5° up and down).
      const targetY = calm ? 0 : pointer.x * 14 + Math.sin(elapsed * 0.35) * 0.7;
      const targetX = calm ? 0 : -pointer.y * 5;
      ry += (targetY - ry) * ease;
      rx += (targetX - rx) * ease;
      rig.style.setProperty("--ry", ry.toFixed(2) + "deg");
      rig.style.setProperty("--rx", rx.toFixed(2) + "deg");

      leaves.forEach((leaf, i) => {
        const side = i - 1;
        lift[i] += ((act === i ? 1 : 0) - lift[i]) * ease;
        shade[i] += ((act == null || act === i ? 0 : 0.4) - shade[i]) * ease;
        const angle = wing - lift[i] * LIFT;
        // How far this pane has turned from its resting pose. A mirror that turns shows you a different
        // part of the room, so the photograph slides the other way and the light travels across the glass.
        const yaw = ry - side * (angle - REST);
        const s = leaf.style;
        if (side !== 0) s.setProperty("--wing", angle.toFixed(2) + "deg");
        s.setProperty("--lift", lift[i].toFixed(3));
        s.setProperty("--shade", shade[i].toFixed(3));
        s.setProperty("--sx", clamp(-yaw * 0.42, -8, 8).toFixed(2) + "%");
        s.setProperty("--sy", clamp(rx * 0.5, -6, 6).toFixed(2) + "%");
        s.setProperty("--gl", clamp(GLARE[i] - yaw * 1.3 - lift[i] * 14, 0, 100).toFixed(1) + "%");
      });
    };
    const start = () => {
      if (!raf && visible && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    // Only spend frames while the mirror is on screen and the tab is in front.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(el);
    const onVisibility = () => (document.hidden ? stop() : start());

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    onScroll();
    start();
    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("moro:intro-open", onIntro);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={stage} className={cx("relative", className)}>
      <div className="tri-scene">
        <span aria-hidden className="tri-ground" />
        <div className="tri-rig">
          {panels.map((p, i) => (
            <Link key={i} to={p.href} tabIndex={-1} onMouseEnter={() => onActive(i)} onMouseLeave={() => onActive(null)} className={cx("tri-leaf", LEAVES[i])}>
              <span className="tri-frame mirror-frame">
                <span className="tri-glass mirror-glass">
                  <img key={p.photo} src={photoUrl(p.photo)} alt={p.label} fetchPriority={i === 1 ? "high" : undefined} decoding="async" className="anim-fade" />
                </span>
              </span>
              {/* The slab's outer side, seen as a wing turns toward you. */}
              {i !== 1 && <span aria-hidden className="tri-edge" />}
              {i === 1 && (
                <>
                  <span aria-hidden className="tri-hinge" style={{ left: -3, top: "38%" }} />
                  <span aria-hidden className="tri-hinge" style={{ left: -3, top: "80%" }} />
                  <span aria-hidden className="tri-hinge" style={{ right: -3, top: "38%" }} />
                  <span aria-hidden className="tri-hinge" style={{ right: -3, top: "80%" }} />
                </>
              )}
              <span aria-hidden className="tri-contact" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
