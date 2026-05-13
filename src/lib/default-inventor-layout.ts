import type { Layout, RibbonButton } from "./layout-types";

const b = (
  id: string,
  label: string,
  iconName: string,
  variant: RibbonButton["variant"] = "small",
  extra: Partial<RibbonButton> = {},
): RibbonButton => ({
  id,
  label,
  icon: { type: "lucide", name: iconName },
  variant,
  ...extra,
});

const buttons: RibbonButton[] = [
  // Sketch (on Model tab) — links to the Sketch tab
  b("start-2d-sketch", "Start\n2D Sketch", "PencilRuler", "split-large", { linkToTabId: "sketch-tab" }),
  // Create
  b("extrude", "Extrude", "Box", "large"),
  b("revolve", "Revolve", "RotateCw", "large"),
  b("sweep", "Sweep", "Waypoints", "small"),
  b("loft", "Loft", "Layers", "small"),
  b("coil", "Coil", "Spline", "small"),
  b("emboss", "Emboss", "Stamp", "small"),
  b("derive", "Derive", "GitBranch", "small"),
  b("rib", "Rib", "Slice", "small"),
  b("decal", "Decal", "ImageDown", "small"),
  b("import", "Import", "Download", "small"),
  b("unwrap", "Unwrap", "PackageOpen", "small"),
  // Modify
  b("hole", "Hole", "CircleDot", "large"),
  b("fillet", "Fillet", "Circle", "split-large"),
  b("chamfer", "Chamfer", "Hexagon", "small"),
  b("shell", "Shell", "Boxes", "small"),
  b("draft", "Draft", "Pencil", "small"),
  b("thread", "Thread", "Wrench", "small"),
  b("combine", "Combine", "Combine", "small"),
  b("thicken-offset", "Thicken/ Offset", "Layers", "small"),
  b("split", "Split", "Scissors", "small"),
  b("direct", "Direct", "ArrowRightLeft", "small"),
  b("delete-face", "Delete Face", "Eraser", "small"),
  // Explore
  b("mark", "Mark", "MapPin", "small"),
  b("finish", "Finish", "CheckCircle2", "small"),
  // Work Features
  b("plane", "Plane", "Square", "split-large"),
  b("axis", "Axis", "ArrowUp", "split-small"),
  b("point", "Point", "Dot", "split-small"),
  b("ucs", "UCS", "Move3d", "small"),
  // Pattern
  b("rectangular", "Rectangular", "Grid3x3", "small"),
  b("circular", "Circular", "RefreshCw", "small"),
  b("mirror", "Mirror", "FlipHorizontal2", "small"),
  b("sketch-driven", "Sketch Driven", "Pencil", "small"),
  // Shape Generator
  b("shape-generator", "Shape\nGenerator", "Sparkles", "large"),
  // Create Freeform
  b("freeform-box", "Box", "FileBox", "large"),
  b("freeform-plane", "Plane", "Square", "small"),
  b("freeform-convert", "Convert", "Repeat", "small"),
  // Surface
  b("stitch", "Stitch", "Sparkles", "small"),
  b("patch", "Patch", "Square", "small"),
  b("sculpt", "Sculpt", "Mountain", "small"),
  b("ruled-surface", "Ruled Surface", "Layers", "small"),
  b("trim", "Trim", "Scissors", "small"),
  b("extend", "Extend", "Maximize2", "small"),
  b("replace-face", "Replace Face", "Replace", "small"),
  b("repair-bodies", "Repair Bodies", "Wrench", "small"),
  b("fit-mesh-face", "Fit Mesh Face", "Grid2x2", "small"),
  // Simulation
  b("stress-analysis", "Stress\nAnalysis", "Activity", "large"),
  // Convert
  b("convert-sheet-metal", "Convert to\nSheet Metal", "ShieldCheck", "large"),

  // ---- Sketch tab ----
  b("sk-line", "Line", "Minus", "large"),
  b("sk-circle", "Circle", "Circle", "split-large"),
  b("sk-arc", "Arc", "Spline", "split-small"),
  b("sk-rectangle", "Rectangle", "Square", "split-small"),
  b("sk-polygon", "Polygon", "Hexagon", "small"),
  b("sk-spline", "Spline", "Spline", "small"),
  b("sk-fillet", "Fillet", "Circle", "small"),
  b("sk-trim", "Trim", "Scissors", "small"),
  b("sk-extend", "Extend", "Maximize2", "small"),
  b("sk-offset", "Offset", "Copy", "small"),
  b("sk-mirror", "Mirror", "FlipHorizontal2", "small"),
  b("sk-pattern", "Pattern", "Grid3x3", "small"),
  b("sk-dimension", "Dimension", "Ruler", "large"),
  b("sk-constrain-h", "Horizontal", "MoveHorizontal", "small"),
  b("sk-constrain-v", "Vertical", "MoveVertical", "small"),
  b("sk-constrain-c", "Coincident", "Dot", "small"),
  b("sk-finish", "Finish\nSketch", "CheckCircle2", "large", { linkToTabId: "model" }),
];

const buttonsMap = Object.fromEntries(buttons.map((b) => [b.id, b]));

export const defaultInventorLayout: Layout = {
  buttons: buttonsMap,
  theme: {},
  tabs: [
    { id: "file", name: "File", enabled: false, groups: [] },
    {
      id: "model",
      name: "3D Model",
      enabled: true,
      groups: [
        { id: "sketch", name: "Sketch", columns: [["start-2d-sketch"]] },
        {
          id: "create",
          name: "Create",
          columns: [
            ["extrude"],
            ["revolve"],
            ["sweep", "loft", "coil"],
            ["emboss", "derive", "rib"],
            ["decal", "import", "unwrap"],
          ],
        },
        {
          id: "modify",
          name: "Modify",
          columns: [
            ["hole"],
            ["fillet"],
            ["chamfer", "shell", "draft"],
            ["thread", "combine", "thicken-offset"],
            ["split", "direct", "delete-face"],
          ],
        },
        { id: "explore", name: "Explore", columns: [["mark", "finish"]] },
        { id: "work-features", name: "Work Features", columns: [["plane"], ["axis", "point", "ucs"]] },
        {
          id: "pattern",
          name: "Pattern",
          columns: [["rectangular", "circular"], ["mirror", "sketch-driven"]],
        },
        { id: "shape-generator", name: "Shape Generator", columns: [["shape-generator"]] },
        {
          id: "create-freeform",
          name: "Create Freeform",
          columns: [["freeform-box"], ["freeform-plane", "freeform-convert"]],
        },
        {
          id: "surface",
          name: "Surface",
          columns: [
            ["stitch", "patch", "sculpt"],
            ["ruled-surface", "trim", "extend"],
            ["replace-face", "repair-bodies", "fit-mesh-face"],
          ],
        },
        { id: "simulation", name: "Simulation", columns: [["stress-analysis"]] },
        { id: "convert", name: "Convert", columns: [["convert-sheet-metal"]] },
      ],
    },
    {
      id: "sketch-tab",
      name: "Sketch",
      enabled: true,
      groups: [
        {
          id: "sk-draw",
          name: "Draw",
          columns: [
            ["sk-line"],
            ["sk-circle"],
            ["sk-arc", "sk-rectangle"],
            ["sk-polygon", "sk-spline", "sk-fillet"],
          ],
        },
        {
          id: "sk-modify",
          name: "Modify",
          columns: [
            ["sk-trim", "sk-extend", "sk-offset"],
            ["sk-mirror", "sk-pattern"],
          ],
        },
        {
          id: "sk-constrain",
          name: "Constrain",
          columns: [["sk-dimension"], ["sk-constrain-h", "sk-constrain-v", "sk-constrain-c"]],
        },
        { id: "sk-exit", name: "Exit", columns: [["sk-finish"]] },
      ],
    },
    { id: "annotate", name: "Annotate", enabled: false, groups: [] },
    { id: "inspect", name: "Inspect", enabled: false, groups: [] },
    { id: "tools", name: "Tools", enabled: false, groups: [] },
    { id: "manage", name: "Manage", enabled: false, groups: [] },
    { id: "view", name: "View", enabled: false, groups: [] },
    { id: "environments", name: "Environments", enabled: false, groups: [] },
    { id: "get-started", name: "Get Started", enabled: false, groups: [] },
  ],
};
