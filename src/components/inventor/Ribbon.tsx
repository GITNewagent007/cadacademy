import { Fragment } from "react";
import { ChevronDown } from "lucide-react";
import { useInventorSim } from "./store";
import { IconRender } from "./IconRender";
import type { RibbonButton, RibbonGroup, RibbonTab } from "@/lib/layout-types";
import { cn } from "@/lib/utils";
import { useIconsReady } from "@/hooks/useIconsReady";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const LARGE_DEFAULT_W = 56;
const LARGE_HEIGHT = 70;
const SMALL_DEFAULT_W = 96;
const SMALL_HEIGHT = 22;

function isLargeVariant(v: RibbonButton["variant"]) {
  return v === "large" || v === "split-large";
}

function LargeButton({ btn, active, ready, onClick }: { btn: RibbonButton; active: boolean; ready: boolean; onClick: () => void }) {
  const isSplit = btn.variant === "split-large";
  const w = btn.customWidth ?? LARGE_DEFAULT_W;
  const showIcon = !btn.hideIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      title={btn.label.replace(/\n/g, " ")}
      style={{ width: w, height: LARGE_HEIGHT }}
      className={cn(
        "flex flex-col items-center justify-start pt-1 pb-0.5 rounded-sm",
        "text-[11px] leading-[1.1] text-inventor-text",
        "hover:bg-inventor-button-hover transition-colors",
        active && "bg-inventor-button-active",
        btn.outlined && "border border-inventor-ribbon-border rounded-none",
      )}
    >
      {showIcon && (ready ? (
        <IconRender icon={btn.icon} size={28} />
      ) : (
        <Skeleton className="rounded-sm" style={{ width: 28, height: 28 }} />
      ))}
      <div className={cn("flex items-center justify-center gap-0.5 px-0.5 w-full", showIcon ? "mt-1" : "flex-1")}>
        {ready ? (
          <span className="text-center whitespace-pre-line line-clamp-2">{btn.label}</span>
        ) : (
          <Skeleton className="h-2 w-3/4" />
        )}
        {ready && isSplit && <ChevronDown className="h-2.5 w-2.5 shrink-0 text-inventor-text-muted" />}
      </div>
    </button>
  );
}

function SmallButton({ btn, active, ready, onClick }: { btn: RibbonButton; active: boolean; ready: boolean; onClick: () => void }) {
  const isSplit = btn.variant === "split-small";
  const w = btn.customWidth ?? SMALL_DEFAULT_W;
  const h = btn.customHeight ?? SMALL_HEIGHT;
  const showIcon = !btn.hideIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      title={btn.label.replace(/\n/g, " ")}
      style={{ width: w, height: h }}
      className={cn(
        "flex items-center gap-1 px-1 rounded-sm text-[11px] text-inventor-text text-left",
        "hover:bg-inventor-button-hover transition-colors",
        active && "bg-inventor-button-active",
        btn.outlined && "border border-inventor-ribbon-border rounded-none",
      )}
    >
      {showIcon && (ready ? (
        <IconRender icon={btn.icon} size={14} />
      ) : (
        <Skeleton className="rounded-sm shrink-0" style={{ width: 14, height: 14 }} />
      ))}
      {ready ? (
        <span className="truncate flex-1">{btn.label.replace(/\n/g, " ")}</span>
      ) : (
        <Skeleton className="h-2 flex-1" />
      )}
      {ready && isSplit && <ChevronDown className="h-2.5 w-2.5 text-inventor-text-muted shrink-0" />}
    </button>
  );
}

function Column({
  ids,
  buttons,
  activeId,
  ready,
  onClick,
}: {
  ids: string[];
  buttons: Record<string, RibbonButton>;
  activeId: string | null;
  ready: boolean;
  onClick: (id: string) => void;
}) {
  if (ids.length === 0) return null;
  const first = buttons[ids[0]];
  if (!first) return null;
  // If the first button is large and there's only one, render large.
  if (ids.length === 1 && isLargeVariant(first.variant)) {
    return <LargeButton btn={first} active={activeId === first.id} ready={ready} onClick={() => onClick(first.id)} />;
  }
  return (
    <div className="flex flex-col gap-px py-0.5">
      {ids.map((id) => {
        const b = buttons[id];
        if (!b) return null;
        return <SmallButton key={id} btn={b} active={activeId === id} ready={ready} onClick={() => onClick(id)} />;
      })}
    </div>
  );
}

function Group({ group, buttons, activeId, ready, onClick }: { group: RibbonGroup; buttons: Record<string, RibbonButton>; activeId: string | null; ready: boolean; onClick: (id: string) => void }) {
  const dropdownIds = (group.dropdown ?? []).filter((id) => buttons[id]);
  const hasDropdown = dropdownIds.length > 0;
  return (
    <div className="flex flex-col">
      <div className="flex items-stretch gap-0.5 px-1.5 pt-1 flex-1">
        {group.columns.map((col, i) => (
          <Fragment key={i}>
            <Column ids={col} buttons={buttons} activeId={activeId} ready={ready} onClick={onClick} />
            {(group.separators ?? []).includes(i) && i < group.columns.length - 1 && (
              <div className="w-px bg-inventor-ribbon-border self-center h-12 mx-0.5" />
            )}
          </Fragment>
        ))}
      </div>
      {hasDropdown ? (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center justify-center gap-0.5 text-[10px] text-inventor-text-muted",
                "border-t border-inventor-ribbon-border/60 mt-0.5 py-[1px] px-2",
                "hover:bg-inventor-button-hover hover:text-inventor-text transition-colors",
              )}
            >
              <span>{group.name}</span>
              <ChevronDown className="h-2.5 w-2.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={0}
            className="w-auto min-w-[180px] p-1 rounded-none border border-inventor-ribbon-border bg-inventor-ribbon"
          >
            <div className="flex flex-col gap-px">
              {dropdownIds.map((id) => {
                const b = buttons[id];
                if (!b) return null;
                return (
                  <SmallButton
                    key={id}
                    btn={b}
                    active={activeId === id}
                    ready={ready}
                    onClick={() => onClick(id)}
                  />
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <div className="text-center text-[10px] text-inventor-text-muted border-t border-inventor-ribbon-border/60 mt-0.5 py-[1px] px-2">
          {group.name}
        </div>
      )}
    </div>
  );
}

export function Ribbon({
  showAllTabs = false,
  onButtonClick,
  onTabClick,
}: {
  showAllTabs?: boolean;
  onButtonClick?: (id: string) => void;
  onTabClick?: (id: string) => void;
} = {}) {
  const { layout, activeButtonId, open, activeTabId, setActiveTab } = useInventorSim();
  const ready = useIconsReady(layout);
  const visibleTabs = showAllTabs ? layout.tabs : layout.tabs.filter((t) => t.enabled);
  const currentTab: RibbonTab | undefined =
    layout.tabs.find((t) => t.id === activeTabId) ?? visibleTabs[0] ?? layout.tabs[0];
  const handleClick = (id: string) => {
    if (onButtonClick) onButtonClick(id);
    else open(id);
  };
  const handleTab = (id: string) => {
    if (onTabClick) onTabClick(id);
    setActiveTab(id);
  };

  return (
    <div className="border-b border-inventor-ribbon-border bg-inventor-ribbon select-none">
      <div className="flex items-end gap-0 border-b border-inventor-ribbon-border px-2 pt-1 text-[11px]">
        {visibleTabs.map((t) => {
          const active = t.id === currentTab?.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTab(t.id)}
              className={cn(
                "px-2.5 py-1 cursor-pointer",
                active
                  ? "bg-inventor-tab-active text-inventor-text border-x border-t border-inventor-ribbon-border rounded-t -mb-px"
                  : "text-inventor-text-muted hover:text-inventor-text",
                showAllTabs && !t.enabled && "italic opacity-60",
              )}
              title={showAllTabs && !t.enabled ? "Tab is disabled in viewer" : undefined}
            >
              {t.name}
            </button>
          );
        })}
      </div>

      <div className="flex items-stretch overflow-x-auto min-h-[88px]">
        {currentTab?.groups.map((group, gi) => (
          <Fragment key={group.id}>
            <Group group={group} buttons={layout.buttons} activeId={activeButtonId} ready={ready} onClick={handleClick} />
            {gi < currentTab.groups.length - 1 && (
              <div className="w-px bg-inventor-ribbon-border my-1" />
            )}
          </Fragment>
        ))}
        {currentTab && currentTab.groups.length === 0 && (
          <div className="px-4 py-6 text-xs text-inventor-text-muted italic">
            This tab has no groups yet.
          </div>
        )}
      </div>
    </div>
  );
}
