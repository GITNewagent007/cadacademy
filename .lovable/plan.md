## Goal

Drop the external `confettipage.com` script entirely (it shows a "not licensed for this domain" popup) and reproduce its look using the already-installed `canvas-confetti` library, tuned to match the configuration that was rendering for `cadacademy.app`.

## What to match

From the script's own logged config we know the exact intended look:

- Palette: `#f2f2f2`, `#1474bb`, `#433a45`, `#77c2ea`, `#303a7a` (the CAD Academy blues + cream + charcoal)
- Spray origins: top-right, middle-right, bottom-middle (three simultaneous bursts)
- Style: "pop" (burst, not a steady fountain) but with a "fast" fall afterwards
- Small particles, "some" amount (medium density), high flip/rotation

## Implementation

Rewrite `src/lib/confetti.ts` only. No other files change. Public API stays `fireConfetti()` so `PracticeBrowser.tsx` and `TutorialsBrowser.tsx` keep working unchanged.

Inside `fireConfetti`:

1. Remove the external script injection and the watermark-hiding `MutationObserver`.
2. Use `canvas-confetti` to fire three near-simultaneous bursts at the three origins:
   - top-right: `{ x: 0.92, y: 0.15 }`, angle ~225° (aimed down-left into the page)
   - middle-right: `{ x: 0.95, y: 0.5 }`, angle ~180°
   - bottom-middle: `{ x: 0.5, y: 0.95 }`, angle ~90° (straight up)
3. Shared per-burst options to match the recorded style:
   - `colors: ["#f2f2f2", "#1474bb", "#433a45", "#77c2ea", "#303a7a"]`
   - `particleCount: ~60` per burst (≈180 total → "some")
   - `scalar: 0.7` (small particles, matching `size: 0.25`)
   - `spread: 70`, `startVelocity: 55` (fast)
   - `gravity: 1.4`, `decay: 0.92` (fast fall)
   - `ticks: 200`
   - `shapes: ["square", "circle"]` with high tumble (canvas-confetti flips squares by default → matches "flippingIntensity: high")
4. Stagger the three bursts by ~80 ms via `setTimeout` so it reads as one coordinated pop instead of a single circle.
5. Keep it a one-shot burst (the original `duration: "infinite"` setting is overkill for completion celebrations and was the reason the external script kept the popup visible).

## Result

Same on-brand confetti, fired on practice-problem and module completion, with zero third-party network calls, no licensing popup, and no watermark to scrub.
