import confetti from "canvas-confetti";

// Brand palette captured from the previous confettipage.com config so the
// burst matches the look the user already approved.
const COLORS = ["#f2f2f2", "#1474bb", "#433a45", "#77c2ea", "#303a7a"];

type Origin = { x: number; y: number };

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

function burst(angle: number, origin: Origin, extra?: confetti.Options) {
  confetti({ ...BASE, angle, origin, ...extra });
}

export function fireConfetti() {
  if (typeof window === "undefined") return;

  // Top-left — aimed down-right into the page.
  burst(45, { x: 0.08, y: 0.25 });

  // Top-right — aimed down-left into the page.
  setTimeout(() => burst(225, { x: 0.92, y: 0.15 }), 60);

  // Middle-right — aimed left.
  setTimeout(() => burst(180, { x: 0.95, y: 0.5 }), 120);

  // Bottom-middle — aimed straight up.
  setTimeout(() => burst(90, { x: 0.5, y: 0.95 }, { spread: 90 }), 180);
}
