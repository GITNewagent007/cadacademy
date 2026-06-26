Make the iPad scroll animation play out more gradually by switching to a **sticky, extended-range scroll** model.

Currently the animation is tied to the `ContainerScroll` div itself (`h-[55rem] md:h-[65rem]`), so `scrollYProgress` hits 0→1 in one quick pass. To spread it across surrounding sections we will:

1. **Wrap `SimulatorScrollShowcase` in a tall scroll runway**
   - A new outer wrapper div with significantly more height (e.g. `h-[100rem] md:h-[140rem]`). This is invisible scroll distance — it does not add padding around the visual content.
   - The inner content (title + iPad) becomes `sticky top-0` so it stays pinned in the viewport while the user scrolls through this runway.

2. **Retarget `useScroll` to the tall wrapper**
   - In `ContainerScroll`, change `useScroll({ target: containerRef })` so `containerRef` points to the tall outer wrapper instead of the content box.
   - `scrollYProgress` now goes 0→1 over the full runway height, making the rotate/scale/translate transitions far more gradual.

3. **Keep visual layout unchanged**
   - The iPad and title remain the same size and centered on screen while pinned.
   - No extra visible padding is added around the iPad itself — the extra height is empty scroll space above/below the sticky content.

4. **Optionally soften the animation ranges**
   - Reduce `rotate` from `[25, 0]` to `[15, 0]` and `scale` from `[1.0, 1.1]` / `[0.7, 0.95]` to `[1.0, 1.03]` / `[0.8, 0.95]` so the same extended scroll produces an even subtler, smoother effect.

This satisfies "spread the scrolling" and "based on position relative to sections before and after" because the scroll runway can be sized to start while the Hero is still visible and end while How It Works is entering, linking the animation progress to overall page position rather than the iPad section alone.