// Shared types for the modular ribbon layout system.
// The full layout for a "program" (e.g. Inventor) is stored as JSON in
// programs.layout, so admins can rearrange/scale/rename buttons without
// code changes.

export type IconRef =
  | { type: "lucide"; name: string }
  | { type: "image"; url: string };

export type ButtonVariant =
  | "large"        // icon-on-top, 2-line label, full ribbon height
  | "small"        // icon-left, label-right, ~22px tall
  | "split-large"  // large + dropdown caret
  | "split-small"; // small + dropdown caret

export type RibbonButton = {
  id: string;          // stable id, also used as guides.button_id
  label: string;
  icon: IconRef;
  variant: ButtonVariant;
  customWidth?: number;   // px override
  customHeight?: number;  // px override (small only)
  description?: string;
};

export type RibbonGroup = {
  id: string;
  name: string;
  /**
   * Columns of button ids. Each column renders top-to-bottom.
   * - A column with 1 "large"/"split-large" button → full-height large button.
   * - A column with "small"/"split-small" buttons → stacked (up to 3).
   * Mixing variants in one column is allowed but rendered as a small stack.
   */
  columns: string[][];
};

export type RibbonTab = {
  id: string;
  name: string;
  enabled: boolean;
  groups: RibbonGroup[];
};

export type Layout = {
  tabs: RibbonTab[];
  /** All buttons in this program, keyed by id. */
  buttons: Record<string, RibbonButton>;
};
