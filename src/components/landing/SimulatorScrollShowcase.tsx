import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export function SimulatorScrollShowcase() {
  return (
    <section className="border-b border-border bg-background">
      <ContainerScroll
        titleComponent={
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Unleash the power of <br />
            <span className="text-blueprint mt-1 inline-block text-4xl md:text-[6rem] font-bold leading-none">
              Interactive Simulators
            </span>
          </h2>
        }
      >
        <iframe
          src="/learn/inventor?embed=1"
          title="Inventor simulator preview"
          className="h-full w-full border-0"
          loading="lazy"
        />
      </ContainerScroll>
    </section>
  );
}
