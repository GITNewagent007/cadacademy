import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Upload, Loader2, Trash2, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";
import { uploadArticleDocx, removeArticleDocx } from "@/lib/articles.functions";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const ASSETS_BUCKET = "article-assets";

export function DocxUploader({
  articleId,
  fileName,
  uploadedAt,
  filePath,
  hasContent,
}: {
  articleId: string;
  fileName: string | null;
  uploadedAt: string | null;
  filePath: string | null;
  hasContent: boolean;
}) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const upload = useServerFn(uploadArticleDocx);
  const remove = useServerFn(removeArticleDocx);

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".docx")) {
        throw new Error("Only .docx files are supported.");
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File too large (max 10 MB).");
      }
      const buf = await file.arrayBuffer();
      const fileBase64 = btoa(
        new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ""),
      );
      return upload({ data: { articleId, fileName: file.name, fileBase64 } });
    },
    onSuccess: (res) => {
      toast.success(`Uploaded ${res.fileName}`);
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const removeMut = useMutation({
    mutationFn: async () => remove({ data: { articleId } }),
    onSuccess: () => {
      toast.success("Removed Word document");
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function pickFile(file: File) {
    uploadMut.mutate(file);
  }

  const downloadUrl = filePath
    ? supabase.storage.from(ASSETS_BUCKET).getPublicUrl(filePath).data.publicUrl
    : null;

  return (
    <div className="rounded-md border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> Word document
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload a <code className="font-mono-tech">.docx</code> file. It becomes the source of truth — re-upload to update.
          </p>
        </div>
        {fileName && (
          <button
            onClick={() => removeMut.mutate()}
            disabled={removeMut.isPending}
            className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {removeMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            Remove
          </button>
        )}
      </div>

      {fileName && (
        <div className="flex items-center justify-between gap-3 rounded border border-border bg-muted/40 px-3 py-2 text-xs">
          <div className="min-w-0">
            <div className="font-mono-tech truncate">{fileName}</div>
            {uploadedAt && (
              <div className="text-muted-foreground mt-0.5">
                Uploaded {new Date(uploadedAt).toLocaleString()}
              </div>
            )}
          </div>
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={fileName}
              className="inline-flex items-center gap-1 text-blueprint hover:underline shrink-0"
            >
              <Download className="h-3 w-3" /> Download
            </a>
          )}
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) pickFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-md border-2 border-dashed p-6 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
          uploadMut.isPending && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pickFile(f);
            e.currentTarget.value = "";
          }}
        />
        {uploadMut.isPending ? (
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            Converting document…
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <div className="text-sm font-medium">
              {fileName ? "Replace document" : "Drop a .docx file or click to browse"}
            </div>
            <div className="text-[11px] text-muted-foreground">Max 10 MB · .docx only</div>
          </div>
        )}
      </div>

      {hasContent && !fileName && (
        <div className="flex items-start gap-2 rounded border border-amber-500/40 bg-amber-500/5 p-2 text-[11px] text-foreground">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
          <span>
            This article has block-based content. Uploading a .docx will replace it for visitors. The original blocks remain in the database and can be restored by removing the upload.
          </span>
        </div>
      )}
    </div>
  );
}
