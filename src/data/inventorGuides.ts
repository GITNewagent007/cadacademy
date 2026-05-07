import type { LucideIcon } from "lucide-react";
import {
  PencilRuler,
  Box,
  RotateCw,
  Waypoints,
  Layers,
  Spline,
  Stamp,
  GitBranch,
  Slice,
  ImageDown,
  Download,
  Square,
  Circle as CircleIcon,
  CircleDot,
  Hexagon,
  Boxes,
  Combine,
  Scissors,
  ArrowRightLeft,
  Eraser,
  MapPin,
  CheckCircle2,
  Square as SquareIcon,
  ArrowUp,
  Dot,
  Move3d,
  Grid3x3,
  RefreshCw,
  FlipHorizontal2,
  Pencil,
  PackageOpen,
  Repeat,
  Sparkles,
  Wrench,
  Replace,
  ShieldCheck,
  Grid2x2,
  Activity,
  FileBox,
  Mountain,
  Maximize2,
} from "lucide-react";

export type GuideModule = {
  id: string;
  title: string;
  body: string;
};

export type Guide = {
  id: string;
  label: string;
  group: string;
  icon: LucideIcon;
  description: string;
  modules: GuideModule[];
};

const placeholderModules = (label: string): GuideModule[] => [
  {
    id: "overview",
    title: "1. Overview",
    body: `What is ${label} and when do you use it? — Add your overview text here.`,
  },
  {
    id: "inputs",
    title: "2. Inputs & options",
    body: `Walk through the dialog options for ${label}. — Add your content here.`,
  },
  {
    id: "practice",
    title: "3. Practice",
    body: `A short hands-on exercise for ${label}. — Add your exercise here.`,
  },
  {
    id: "pitfalls",
    title: "4. Common pitfalls",
    body: `Mistakes beginners make with ${label}. — Add your tips here.`,
  },
];

const make = (
  id: string,
  label: string,
  group: string,
  icon: LucideIcon,
): Guide => ({
  id,
  label,
  group,
  icon,
  description: `Learn how to use the ${label} tool in Autodesk Inventor.`,
  modules: placeholderModules(label),
});

export const guides: Guide[] = [
  make("start-2d-sketch", "Start 2D Sketch", "Sketch", PencilRuler),

  make("extrude", "Extrude", "Create", Box),
  make("revolve", "Revolve", "Create", RotateCw),
  make("sweep", "Sweep", "Create", Waypoints),
  make("loft", "Loft", "Create", Layers),
  make("coil", "Coil", "Create", Spline),
  make("emboss", "Emboss", "Create", Stamp),
  make("derive", "Derive", "Create", GitBranch),
  make("rib", "Rib", "Create", Slice),
  make("decal", "Decal", "Create", ImageDown),
  make("import", "Import", "Create", Download),
  make("unwrap", "Unwrap", "Create", PackageOpen),

  make("hole", "Hole", "Modify", CircleDot),
  make("fillet", "Fillet", "Modify", CircleIcon),
  make("chamfer", "Chamfer", "Modify", Hexagon),
  make("shell", "Shell", "Modify", Boxes),
  make("draft", "Draft", "Modify", Pencil),
  make("combine", "Combine", "Modify", Combine),
  make("thicken-offset", "Thicken / Offset", "Modify", Layers),
  make("split", "Split", "Modify", Scissors),
  make("direct", "Direct", "Modify", ArrowRightLeft),
  make("delete-face", "Delete Face", "Modify", Eraser),

  make("mark", "Mark", "Explore", MapPin),
  make("finish", "Finish", "Explore", CheckCircle2),

  make("plane", "Plane", "Work Features", SquareIcon),
  make("axis", "Axis", "Work Features", ArrowUp),
  make("point", "Point", "Work Features", Dot),
  make("ucs", "UCS", "Work Features", Move3d),

  make("rectangular", "Rectangular Pattern", "Pattern", Grid3x3),
  make("circular", "Circular Pattern", "Pattern", RefreshCw),
  make("mirror", "Mirror", "Pattern", FlipHorizontal2),
  make("sketch-driven", "Sketch Driven Pattern", "Pattern", Pencil),

  make("freeform-box", "Freeform Box", "Create Freeform", FileBox),
  make("freeform-plane", "Freeform Plane", "Create Freeform", SquareIcon),
  make("freeform-convert", "Convert to Freeform", "Create Freeform", Repeat),

  make("stitch", "Stitch", "Surface", Sparkles),
  make("patch", "Patch", "Surface", SquareIcon),
  make("sculpt", "Sculpt", "Surface", Mountain),
  make("ruled-surface", "Ruled Surface", "Surface", Layers),
  make("trim", "Trim", "Surface", Scissors),
  make("extend", "Extend", "Surface", Maximize2),
  make("replace-face", "Replace Face", "Surface", Replace),
  make("repair-bodies", "Repair Bodies", "Surface", Wrench),
  make("fit-mesh-face", "Fit Mesh Face", "Surface", Grid2x2),

  make("stress-analysis", "Stress Analysis", "Simulation", Activity),

  make("convert-sheet-metal", "Convert to Sheet Metal", "Convert", ShieldCheck),
];

export const guidesById = Object.fromEntries(
  guides.map((g) => [g.id, g]),
) as Record<string, Guide>;

export type RibbonGroupDef = {
  name: string;
  guideIds: string[];
};

export const ribbonGroups: RibbonGroupDef[] = [
  { name: "Sketch", guideIds: ["start-2d-sketch"] },
  {
    name: "Create",
    guideIds: [
      "extrude",
      "revolve",
      "sweep",
      "loft",
      "coil",
      "emboss",
      "derive",
      "rib",
      "decal",
      "import",
      "unwrap",
    ],
  },
  {
    name: "Modify",
    guideIds: [
      "hole",
      "fillet",
      "chamfer",
      "shell",
      "draft",
      "combine",
      "thicken-offset",
      "split",
      "direct",
      "delete-face",
    ],
  },
  { name: "Explore", guideIds: ["mark", "finish"] },
  { name: "Work Features", guideIds: ["plane", "axis", "point", "ucs"] },
  {
    name: "Pattern",
    guideIds: ["rectangular", "circular", "mirror", "sketch-driven"],
  },
  {
    name: "Create Freeform",
    guideIds: ["freeform-box", "freeform-plane", "freeform-convert"],
  },
  {
    name: "Surface",
    guideIds: [
      "stitch",
      "patch",
      "sculpt",
      "ruled-surface",
      "trim",
      "extend",
      "replace-face",
      "repair-bodies",
      "fit-mesh-face",
    ],
  },
  { name: "Simulation", guideIds: ["stress-analysis"] },
  { name: "Convert", guideIds: ["convert-sheet-metal"] },
];

export const inventorTabs = [
  "File",
  "3D Model",
  "Sketch",
  "Annotate",
  "Inspect",
  "Tools",
  "Manage",
  "View",
  "Environments",
  "Get Started",
];
