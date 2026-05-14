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
  variant: ButtonVariant;
  customWidth?: number;
  customHeight?: number;
  /** If set, clicking this button switches to that tab instead of opening an article. */
  linkToTabId?: string;
  /** Centralized article reference. Multiple buttons can point at the same article id. */
  articleId?: string | null;
};

export type RibbonGroup = {
  id: string;
  name: string;
  columns: string[][];
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
