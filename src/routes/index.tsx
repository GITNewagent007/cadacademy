import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  MousePointerClick,
  BookOpen,
  Wrench,
  Box,
  PencilRuler,
  Layers,
  Grid3x3,
  Sparkles,
  Compass,
} from "lucide-react";
import { SimulatorScrollShowcase } from "@/components/landing/SimulatorScrollShowcase";
import { ShinyButton } from "@/components/ui/ShinyButton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Learn Autodesk Inventor by clicking — CAD Academy" },
      {
        name: "description",
        content:
          "Interactive CAD learning platform. Click any tool inside a simulated Inventor UI to get a guided walkthrough. Fusion and SolidWorks coming next.",
      },
      { property: "og:title", content: "Learn Autodesk Inventor by clicking" },
      {
        property: "og:description",
        content:
          "Stop watching tutorials. Click the actual buttons and learn Inventor in context.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <SimulatorScrollShowcase />
      <HowItWorks />
      <Coverage />
      <Why />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
            <Compass className="h-5 w-5" />
          </div>
          <span className="font-mono-tech text-sm font-semibold tracking-tight">
            CAD/ACADEMY
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#coverage" className="hover:text-foreground">What's covered</a>
          <a href="#why" className="hover:text-foreground">Why</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">
            Sign in
          </Link>
          <Link
            to="/learn/inventor"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Open simulator <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage:
            "linear-gradient(var(--blueprint-grid) 1px, transparent 1px), linear-gradient(90deg, var(--blueprint-grid) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-mono-tech uppercase tracking-wider text-blueprint backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-blueprint" />
          v1 · Inventor Part Enviorment
        </div>
        <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          Learn Autodesk Inventor{" "}
          <span className="text-blueprint">by clicking it.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          A simulated Inventor interface in your browser. Click any tool to
          open a focused guide with text, images, video, right where the button
          actually lives. Built for engineering students and self-taught makers.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/learn/inventor"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Launch the simulator <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            How it works
          </a>
        </div>

        <div className="mt-14 grid grid-cols-3 gap-6 max-w-md font-mono-tech text-xs text-muted-foreground">
          <div>
            <div className="text-2xl font-semibold text-foreground">150+</div>
            <div>Tools mapped</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-foreground">50+</div>
            <div>Feature groups</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-foreground">10</div>
            <div>Ribbon tabs</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: MousePointerClick,
      title: "Pick a tool",
      desc: "Click any button in the simulated Inventor ribbon, just like in the real app.",
    },
    {
      icon: BookOpen,
      title: "Read the guide",
      desc: "A focused module appears in the viewport with steps, images and video.",
    },
    {
      icon: Wrench,
      title: "Practice in Inventor",
      desc: "Apply what you learned in the real software with our worked examples.",
    },
  ];
  return (
    <section id="how" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeader kicker="01 / Workflow" title="How it works" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="rounded-lg border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <s.icon className="h-6 w-6 text-blueprint" />
                <span className="font-mono-tech text-xs text-muted-foreground">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Coverage() {
  const model = [
    { name: "Sketch", icon: PencilRuler, count: 1 },
    { name: "Create", icon: Box, count: 11 },
    { name: "Modify", icon: Wrench, count: 11 },
    { name: "Explore", icon: Compass, count: 2 },
    { name: "Work Features", icon: Compass, count: 4 },
    { name: "Pattern", icon: Grid3x3, count: 4 },
    { name: "Shape Generator", icon: Sparkles, count: 1 },
    { name: "Create Freeform", icon: Box, count: 3 },
    { name: "Surface", icon: Layers, count: 9 },
    { name: "Simulation", icon: Sparkles, count: 1 },
    { name: "Convert", icon: Wrench, count: 1 },
  ];
  const sketch = [
    { name: "Draw", icon: PencilRuler, count: 7 },
    { name: "Modify", icon: Wrench, count: 5 },
    { name: "Constrain", icon: Compass, count: 4 },
    { name: "Exit", icon: ArrowRight, count: 1 },
  ];
  return (
    <section id="coverage" className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeader kicker="02 / Coverage" title="What's covered" />
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          v1 maps the Inventor 3D Model and Sketch tabs end-to-end. Every
          button opens a guide — including freeform, surface, simulation and
          sheet-metal conversion.
        </p>
        <h3 className="mt-10 font-mono-tech text-xs uppercase tracking-wider text-blueprint">
          3D Model tab
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {model.map((g) => (
            <GroupCard key={g.name} {...g} />
          ))}
        </div>
        <h3 className="mt-10 font-mono-tech text-xs uppercase tracking-wider text-blueprint">
          Sketch tab
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {sketch.map((g) => (
            <GroupCard key={g.name} {...g} />
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-mono-tech text-muted-foreground">
          <span className="rounded-full border border-dashed border-border px-3 py-1">
            <Sparkles className="mr-1 inline h-3 w-3" /> Fusion 360 — coming soon
          </span>
          <span className="rounded-full border border-dashed border-border px-3 py-1">
            <Sparkles className="mr-1 inline h-3 w-3" /> SolidWorks — coming soon
          </span>
        </div>
      </div>
    </section>
  );
}

function GroupCard({
  name,
  icon: Icon,
  count,
}: {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded bg-blueprint/10 text-blueprint">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-foreground">{name}</div>
        <div className="font-mono-tech text-xs text-muted-foreground">
          {count} tool{count !== 1 && "s"}
        </div>
      </div>
    </div>
  );
}

function Why() {
  return (
    <section id="why" className="border-b border-border">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <SectionHeader kicker="03 / Why" title="Tutorials are linear. CAD isn't." center />
        <p className="mt-6 text-base text-muted-foreground md:text-lg">
          You don't watch a 40-minute video to learn what one button does.
          You click the button. CAD/Academy puts the lesson exactly where
          your cursor already is — so you build muscle memory while you learn.
        </p>
        <div className="mt-8">
          <Link
            to="/learn/inventor"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Try it now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground md:flex-row">
        <div className="font-mono-tech">© {new Date().getFullYear()} CAD/ACADEMY</div>
        <div className="font-mono-tech">Built for engineering students.</div>
      </div>
    </footer>
  );
}

function SectionHeader({
  kicker,
  title,
  center,
}: {
  kicker: string;
  title: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "text-center" : ""}>
      <div className="font-mono-tech text-xs uppercase tracking-wider text-blueprint">
        {kicker}
      </div>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {title}
      </h2>
    </div>
  );
}
