import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { SimplifiedInventorSim } from "./SimplifiedInventorSim";
import { ScrollAnimatedText } from "@/components/ui/scroll-animated-text";

export function SimulatorScrollShowcase() {
  return (
    <section className="border-b border-border bg-background">
      <ContainerScroll
        titleComponent={
          <div className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Unleash the power of an <br />
            <ScrollAnimatedText
              text="Interactive Simulator"
              gradientColors="linear-gradient(90deg, #2563eb, #60a5fa, #2563eb)"
              className="mt-1"
              textClassName="text-4xl md:text-[6rem] font-bold leading-none"
            />
          </div>
        }
      >
        <SimplifiedInventorSim />
      </ContainerScroll>
    </section>
  );
}
