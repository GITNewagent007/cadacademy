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

  // Make sure the host can contain an absolutely-positioned canvas.
  const cs = window.getComputedStyle(host);
  if (cs.position === "static") host.style.position = "relative";

  let canvas = host.querySelector<HTMLCanvasElement>(":scope > canvas[data-confetti-canvas]");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.setAttribute("data-confetti-canvas", "");
    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      // Sit above page content but below app chrome/menus that use higher z.
      zIndex: "10",
    } as CSSStyleDeclaration);
    host.appendChild(canvas);
  }

  return confetti.create(canvas, { resize: true, useWorker: true });
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
