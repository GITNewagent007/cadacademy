import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { ImageWithLayout } from "./image-extension";
import { ImagePopover } from "./ImagePopover";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Typography } from "@tiptap/extension-typography";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Code,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Image as ImageIcon,
  Video as VideoIcon,
  Table as TableIcon,
  Info,
  Lightbulb,
  AlertTriangle,
  ShieldAlert,
  Undo2,
  Redo2,
  Upload,
  Loader2,
} from "lucide-react";
import type { Block, CalloutVariant } from "@/lib/article-types";
import { blocksToDoc, docToBlocks } from "@/lib/article-doc";
import { Callout, Video } from "./extensions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function DocumentEditor({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (next: Block[]) => void;
}) {
  // Initial doc only used on first mount; subsequent changes flow editor -> blocks.
  const initialDoc = useMemo(() => blocksToDoc(blocks), []); // eslint-disable-line react-hooks/exhaustive-deps

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Typography,
      Placeholder.configure({ placeholder: "Start writing… use the toolbar above for formatting." }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      ImageWithLayout,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Callout,
      Video,
    ],
    content: initialDoc,
    editorProps: {
      attributes: {
        class:
          "prose-doc focus:outline-none min-h-[60vh] max-w-none px-8 py-10 text-[15px] leading-7 text-foreground",
      },
    },
    onUpdate: ({ editor }) => {
      const next = docToBlocks(editor.getJSON() as never);
      onChange(next);
    },
  });

  if (!editor) return null;

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <Toolbar editor={editor} />
      <div className="bg-background relative">
        <EditorContent editor={editor} />
        <ImagePopover editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `articles/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("button-icons").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("button-icons").getPublicUrl(path);
      editor.chain().focus().setImage({ src: data.publicUrl, alt: file.name }).run();
    } catch (e) {
      toast.error((e as Error).message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function insertImageByUrl() {
    const url = window.prompt("Image URL");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }
  function insertVideo() {
    const url = window.prompt("Video URL (YouTube, Vimeo, or .mp4)");
    if (!url) return;
    editor.chain().focus().insertContent({ type: "video", attrs: { url, caption: "" } }).run();
  }
  function setLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }
  function insertCallout(variant: CalloutVariant) {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "callout",
        attrs: { variant },
        content: [{ type: "paragraph" }],
      })
      .run();
  }
  function insertTable() {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5 sticky top-[49px] z-10">
      <Group>
        <TBtn onClick={() => editor.chain().focus().undo().run()} title="Undo (⌘Z)"><Undo2 className="h-3.5 w-3.5" /></TBtn>
        <TBtn onClick={() => editor.chain().focus().redo().run()} title="Redo (⌘⇧Z)"><Redo2 className="h-3.5 w-3.5" /></TBtn>
      </Group>
      <Sep />
      <Group>
        <TBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 1"><Heading1 className="h-3.5 w-3.5" /></TBtn>
        <TBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 2"><Heading2 className="h-3.5 w-3.5" /></TBtn>
        <TBtn active={editor.isActive("heading", { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} title="Heading 3"><Heading3 className="h-3.5 w-3.5" /></TBtn>
      </Group>
      <Sep />
      <Group>
        <TBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (⌘B)"><Bold className="h-3.5 w-3.5" /></TBtn>
        <TBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (⌘I)"><Italic className="h-3.5 w-3.5" /></TBtn>
        <TBtn active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline code"><Code className="h-3.5 w-3.5" /></TBtn>
        <TBtn active={editor.isActive("link")} onClick={setLink} title="Link (⌘K)"><LinkIcon className="h-3.5 w-3.5" /></TBtn>
      </Group>
      <Sep />
      <Group>
        <TBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list"><List className="h-3.5 w-3.5" /></TBtn>
        <TBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></TBtn>
        <TBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote"><Quote className="h-3.5 w-3.5" /></TBtn>
        <TBtn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block"><Code2 className="h-3.5 w-3.5" /></TBtn>
        <TBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus className="h-3.5 w-3.5" /></TBtn>
      </Group>
      <Sep />
      <Group>
        <TBtn onClick={() => fileRef.current?.click()} title="Upload image" disabled={uploading}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        </TBtn>
        <TBtn onClick={insertImageByUrl} title="Image from URL"><ImageIcon className="h-3.5 w-3.5" /></TBtn>
        <TBtn onClick={insertVideo} title="Embed video"><VideoIcon className="h-3.5 w-3.5" /></TBtn>
        <TBtn onClick={insertTable} title="Insert table"><TableIcon className="h-3.5 w-3.5" /></TBtn>
      </Group>
      <Sep />
      <Group>
        <TBtn onClick={() => insertCallout("info")} title="Info callout"><Info className="h-3.5 w-3.5 text-blue-500" /></TBtn>
        <TBtn onClick={() => insertCallout("tip")} title="Tip callout"><Lightbulb className="h-3.5 w-3.5 text-emerald-500" /></TBtn>
        <TBtn onClick={() => insertCallout("warning")} title="Warning callout"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /></TBtn>
        <TBtn onClick={() => insertCallout("danger")} title="Danger callout"><ShieldAlert className="h-3.5 w-3.5 text-destructive" /></TBtn>
      </Group>
      {editor.isActive("table") && (
        <>
          <Sep />
          <Group>
            <TBtn onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add column before">+◀</TBtn>
            <TBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add column after">▶+</TBtn>
            <TBtn onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete column">−col</TBtn>
            <TBtn onClick={() => editor.chain().focus().addRowBefore().run()} title="Add row above">+▲</TBtn>
            <TBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row below">▼+</TBtn>
            <TBtn onClick={() => editor.chain().focus().deleteRow().run()} title="Delete row">−row</TBtn>
            <TBtn onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table">×</TBtn>
          </Group>
        </>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadImage(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}
function Sep() {
  return <div className="mx-1 h-5 w-px bg-border" />;
}
function TBtn({
  children,
  onClick,
  active,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        "inline-flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-xs text-foreground hover:bg-muted disabled:opacity-50",
        active && "bg-muted text-primary",
      )}
    >
      {children}
    </button>
  );
}
