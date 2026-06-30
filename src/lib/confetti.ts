import confetti from "canvas-confetti";

// Brand palette captured from the previous confettipage.com config.
const COLORS = ["#f2f2f2", "#1474bb", "#433a45", "#77c2ea", "#303a7a"];

const BASE: confetti.Options = {
  colors: COLORS,
  particleCount: 60,
  scalar: 1.4,
  spread: 70,
  startVelocity: 35,
  gravity: 0.9,
  decay: 0.94,
  ticks: 300,
  shapes: ["square", "circle"],
  disableForReducedMotion: true,
};

function getScopedFire(): ((opts: confetti.Options) => void) | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  const host = document.querySelector<HTMLElement>("[data-confetti-root]");
  if (!host) return null;

  // Overlay the canvas on the host's *visible* area using fixed positioning
  // so confetti stays in view even when the user has scrolled inside the host.
  let canvas = document.body.querySelector<HTMLCanvasElement>(":scope > canvas[data-confetti-canvas]");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.setAttribute("data-confetti-canvas", "");
    Object.assign(canvas.style, {
      position: "fixed",
      pointerEvents: "none",
      zIndex: "10",
    } as CSSStyleDeclaration);
    document.body.appendChild(canvas);
  }
  const el = canvas;

  const sync = () => {
    const r = host.getBoundingClientRect();
    el.style.left = `${r.left}px`;
    el.style.top = `${r.top}px`;
    el.style.width = `${r.width}px`;
    el.style.height = `${r.height}px`;
  };
  sync();

  // Keep the overlay aligned with the host while particles are in flight.
  const onChange = () => sync();
  window.addEventListener("scroll", onChange, true);
  window.addEventListener("resize", onChange);
  window.setTimeout(() => {
    window.removeEventListener("scroll", onChange, true);
    window.removeEventListener("resize", onChange);
  }, 5000);

  return confetti.create(el, { resize: true, useWorker: true });
}

export function fireConfetti() {
  const fire = getScopedFire();
  const run = fire ?? ((opts: confetti.Options) => confetti(opts));

  const burst = (angle: number, origin: { x: number; y: number }, extra?: confetti.Options) =>
    run({ ...BASE, angle, origin, ...extra });

  // Origins pushed closer to the edges of the scoped tab.
  burst(300, { x: 0.02, y: 0.08 });                       // top-left
  setTimeout(() => burst(240, { x: 0.98, y: 0.08 }), 60); // top-right
  setTimeout(() => burst(90,  { x: 0.5,  y: 1.0  }, { spread: 100 }), 180); // bottom-center
}
