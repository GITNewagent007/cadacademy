## Problem

In `src/components/ui/container-scroll-animation.tsx`, `useScroll({ target: containerRef })` defaults to the offset `["start start", "end end"]`. Because the container is roughly viewport-height, `scrollYProgress` only advances while the container is fully filling the viewport — which is a near-zero scroll distance. That's why the tilt finishes almost instantly.

The fix is to change *what* drives progress, not the section height.

## Fix

Switch the `useScroll` offset so progress is driven by the section's position relative to the viewport, not internal scroll through the section:

```ts
const { scrollYProgress } = useScroll({
  target: containerRef,
  offset: ["start end", "end start"],
});
```

With this offset:
- progress = 0 when the top of the section first enters the bottom of the viewport
- progress = 1 when the bottom of the section leaves the top of the viewport
- total scroll distance ≈ viewport height + section height (roughly 2× viewport)

This means the tilt animation now spans the entire time the iPad section is anywhere on screen — starting while the Hero is still partly visible and finishing as How It Works is scrolling in. No height/padding changes, no sticky layout.

## Tuning the animation window

With the wider scroll range, the current `[0, 1]` mapping would make the iPad finish flattening when it's centered on screen, then start tilting backward as it scrolls away. We remap the transforms so the motion plays out only while the section is approaching and centered:

```ts
const rotate    = useTransform(scrollYProgress, [0, 0.5], [25, 0]);
const scale     = useTransform(scrollYProgress, [0, 0.5], scaleDimensions());
const translate = useTransform(scrollYProgress, [0, 0.5], [0, -80]);
```

After 0.5 (section centered), the iPad sits flat for the rest of its time on screen instead of reversing.

## Files

- `src/components/ui/container-scroll-animation.tsx` — add `offset` to `useScroll`, change the three `useTransform` input ranges from `[0, 1]` to `[0, 0.5]`. No other files touched.
