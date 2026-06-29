import confetti from "canvas-confetti";

export function fireConfetti(opts?: confetti.Options) {
  const defaults: confetti.Options = {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
    ...opts,
  };
  confetti(defaults);
}
