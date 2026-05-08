import * as Lucide from "lucide-react";
import { HelpCircle, type LucideIcon } from "lucide-react";
import type { IconRef } from "@/lib/layout-types";
import { cn } from "@/lib/utils";

export function resolveLucide(name: string): LucideIcon {
  const Icon = (Lucide as unknown as Record<string, LucideIcon>)[name];
  return Icon ?? HelpCircle;
}

export function IconRender({
  icon,
  size = 20,
  className,
}: {
  icon: IconRef;
  size?: number;
  className?: string;
}) {
  if (icon.type === "image") {
    return (
      <img
        src={icon.url}
        alt=""
        style={{ width: size, height: size }}
        className={cn("object-contain", className)}
      />
    );
  }
  const Lc = resolveLucide(icon.name);
  return (
    <Lc
      style={{ width: size, height: size }}
      strokeWidth={1.6}
      className={cn("text-blueprint shrink-0", className)}
    />
  );
}
