// Shared types for the modular ribbon layout system.

export type IconRef =
  | { type: "lucide"; name: string }
  | { type: "image"; url: string };

export type ButtonVariant =
  | "large"
  | "small"
  | "split-large"
  | "split-small";

export type RibbonButton = {
  id: string;
  label: string;
  icon: IconRef;
  /** Optional dedicated icon for small placements (small / split-small). Falls back to `icon`. */
  iconSmall?: IconRef;
  variant: ButtonVariant;
  /** Width/height for LARGE placements (large / split-large or single-large column). */
  customWidth?: number;
  customHeight?: number;
  /** Width/height for SMALL placements (small / split-small, or large variant rendered in a multi-button column). */
  customWidthSmall?: number;
  customHeightSmall?: number;
  /** If set, clicking this button switches to that tab instead of opening an article.
   *  When `linkToDocSlug` is also set, this tab id refers to a tab in that other doc. */
  linkToTabId?: string;
  /** If set, clicking this button switches the active doc (program) at runtime
   *  — e.g. "inventor-iam" to jump from a Part to the Assembly simulator. */
  linkToDocSlug?: string;
  /** Centralized article reference. Multiple buttons can point at the same article id. */
  articleId?: string | null;
  /** Hide the icon entirely — render label only. */
  hideIcon?: boolean;
  /** Render with a border so it looks like a dropdown / combobox. */
  outlined?: boolean;
};

export type RibbonGroup = {
  id: string;
  name: string;
  columns: string[][];
  /** Optional list of button ids shown in a popover anchored to the group name. */
  dropdown?: string[];
  /** Column indices after which to render a short vertical separator (sub-group divider). */
  separators?: number[];
};

export type RibbonTab = {
  id: string;
  name: string;
  enabled: boolean;
  groups: RibbonGroup[];
};

/** Optional theme overrides — keys are CSS variable names without the leading `--`. */
export type ThemeOverrides = Partial<Record<
  | "inventor-viewport"
  | "inventor-ribbon"
  | "inventor-ribbon-border"
  | "inventor-tab-active"
  | "inventor-button-hover"
  | "inventor-button-active"
  | "inventor-tree"
  | "inventor-tree-border"
  | "inventor-text"
  | "inventor-text-muted"
  | "blueprint",
  string
>>;

export type Layout = {
  tabs: RibbonTab[];
  buttons: Record<string, RibbonButton>;
  theme?: ThemeOverrides;
};

export const THEME_KEYS: { key: keyof ThemeOverrides; label: string }[] = [
  { key: "inventor-viewport", label: "Viewport background" },
  { key: "inventor-ribbon", label: "Ribbon background" },
  { key: "inventor-ribbon-border", label: "Ribbon border" },
  { key: "inventor-tab-active", label: "Active tab" },
  { key: "inventor-button-hover", label: "Button hover" },
  { key: "inventor-button-active", label: "Button active" },
  { key: "inventor-tree", label: "Feature tree background" },
  { key: "inventor-tree-border", label: "Feature tree border" },
  { key: "inventor-text", label: "Text" },
  { key: "inventor-text-muted", label: "Muted text" },
  { key: "blueprint", label: "Accent (blueprint)" },
];
