import { forwardRef, useEffect, useRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number };

/** Textarea that grows to fit its content. Forwards ref so toolbars can read selection. */
export const AutoTextarea = forwardRef<HTMLTextAreaElement, Props>(function AutoTextarea(
  { className, minRows = 2, value, onChange, ...rest },
  ref,
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  function setRefs(el: HTMLTextAreaElement | null) {
    innerRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
  }

  function resize() {
    const el = innerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  useEffect(() => {
    resize();
  }, [value]);

  return (
    <textarea
      ref={setRefs}
      rows={minRows}
      value={value}
      onChange={(e) => {
        onChange?.(e);
        resize();
      }}
      className={cn(
        "w-full resize-none rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring",
        className,
      )}
      {...rest}
    />
  );
});
