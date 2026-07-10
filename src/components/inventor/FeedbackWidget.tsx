import { useState } from "react";
import { MessageSquareWarning, X, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const ISSUE_TYPES = [
  { value: "missing_measurement", label: "Missing measurement on drawing" },
  { value: "incorrect_content", label: "Incorrect content" },
  { value: "typo", label: "Typo / wording" },
  { value: "broken_image", label: "Broken image / media" },
  { value: "bug", label: "Bug / broken feature" },
  { value: "other", label: "Other" },
];

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0].value);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setStatus("sending");
    setError(null);
    const { error } = await supabase.from("feedback_reports").insert({
      issue_type: issueType,
      description: description.trim(),
      page_url: typeof window !== "undefined" ? window.location.href : null,
      user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
    });
    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }
    setStatus("sent");
    setDescription("");
    setTimeout(() => {
      setOpen(false);
      setStatus("idle");
    }, 1600);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-blueprint px-3 py-2 text-xs font-medium text-white shadow-lg hover:bg-blueprint/90"
        title="Report an issue"
      >
        <MessageSquareWarning className="h-4 w-4" />
        Report issue
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border border-border bg-background shadow-2xl animate-in fade-in slide-in-from-bottom-2">
      <header className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <MessageSquareWarning className="h-4 w-4 text-blueprint" />
          Report an issue
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <form onSubmit={submit} className="p-3 space-y-2.5">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Issue type</label>
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {ISSUE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            What's wrong?
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. The extrude drawing is missing the 25mm depth measurement…"
            rows={4}
            maxLength={4000}
            required
            className="w-full resize-none rounded border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="text-[10px] text-muted-foreground mt-0.5">
            The current page URL is included automatically.
          </div>
        </div>
        {error && <div className="text-xs text-destructive">{error}</div>}
        <button
          type="submit"
          disabled={status === "sending" || !description.trim()}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium text-white transition",
            status === "sent" ? "bg-emerald-600" : "bg-blueprint hover:bg-blueprint/90",
            "disabled:opacity-60",
          )}
        >
          {status === "sending" && <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</>}
          {status === "sent" && <><Check className="h-3.5 w-3.5" /> Report sent — thank you!</>}
          {(status === "idle" || status === "error") && "Send report"}
        </button>
      </form>
    </div>
  );
}
