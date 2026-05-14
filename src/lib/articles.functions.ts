// Server functions for managing Word document (.docx) uploads on articles.
// Converts .docx → HTML server-side using mammoth, extracts embedded images
// to the `article-assets` storage bucket, sanitizes the HTML, and persists
// the result on the articles row.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import JSZip from "jszip";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ASSETS_BUCKET = "article-assets";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// ---------- HTML sanitizer (small allowlist) ----------

const ALLOWED_TAGS = new Set([
  "p", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "sub", "sup", "code",
  "ul", "ol", "li",
  "blockquote",
  "pre",
  "a", "img",
  "table", "thead", "tbody", "tr", "td", "th",
  "figure", "figcaption", "div", "span",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title"]),
  img: new Set(["src", "alt", "title", "width", "height", "class", "style"]),
  th: new Set(["colspan", "rowspan"]),
  td: new Set(["colspan", "rowspan"]),
  figure: new Set(["class", "style"]),
};

// Only allow safe CSS properties (numeric sizing + float/margin) in img/figure style attrs
const STYLE_PROP_ALLOWLIST = new Set([
  "width", "height", "max-width", "max-height",
  "float", "clear", "display",
  "margin", "margin-left", "margin-right", "margin-top", "margin-bottom",
]);
function sanitizeStyle(value: string): string {
  return value
    .split(";")
    .map((decl) => decl.trim())
    .filter(Boolean)
    .map((decl) => {
      const idx = decl.indexOf(":");
      if (idx < 0) return "";
      const prop = decl.slice(0, idx).trim().toLowerCase();
      const val = decl.slice(idx + 1).trim();
      if (!STYLE_PROP_ALLOWLIST.has(prop)) return "";
      // disallow url(), expression(), etc.
      if (/[<>"]|url\s*\(|expression\s*\(/i.test(val)) return "";
      return `${prop}: ${val}`;
    })
    .filter(Boolean)
    .join("; ");
}

function sanitizeHtml(html: string): string {
  // Strip <script>, <style>, <iframe>, comments
  let out = html.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/<\s*(script|style|iframe|object|embed)[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  // Remove on* attributes and javascript: hrefs
  out = out.replace(/<([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*)?>/g, (_m, tag: string, attrs: string = "") => {
    const lowerTag = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(lowerTag)) return "";
    if (!attrs) return `<${lowerTag}>`;
    const allowed = ALLOWED_ATTRS[lowerTag] ?? new Set<string>();
    const cleaned: string[] = [];
    const attrRegex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let m: RegExpExecArray | null;
    while ((m = attrRegex.exec(attrs)) !== null) {
      const name = m[1].toLowerCase();
      const value = m[3] ?? m[4] ?? "";
      if (!allowed.has(name)) continue;
      if ((name === "href" || name === "src") && /^\s*javascript:/i.test(value)) continue;
      cleaned.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
    }
    return cleaned.length ? `<${lowerTag} ${cleaned.join(" ")}>` : `<${lowerTag}>`;
  });
  // Remove closing tags that aren't allowed
  out = out.replace(/<\/([a-zA-Z][a-zA-Z0-9]*)\s*>/g, (_m, tag: string) => {
    return ALLOWED_TAGS.has(tag.toLowerCase()) ? `</${tag.toLowerCase()}>` : "";
  });
  return out;
}

// ---------- helpers ----------

function extToContentType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

function contentTypeToExt(ct: string): string {
  const lower = ct.toLowerCase();
  if (lower.includes("png")) return "png";
  if (lower.includes("jpeg") || lower.includes("jpg")) return "jpg";
  if (lower.includes("gif")) return "gif";
  if (lower.includes("webp")) return "webp";
  if (lower.includes("svg")) return "svg";
  return "bin";
}

async function assertAdmin(supabase: any, userId: string) {
  // Use admin to check role (bypasses RLS recursion concerns).
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(`Role check failed: ${error.message}`);
  if (!data) throw new Error("Admin access required");
}

// ---------- uploadArticleDocx ----------

export const uploadArticleDocx = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        articleId: z.string().uuid(),
        fileName: z.string().min(1).max(255),
        // base64-encoded .docx contents
        fileBase64: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(null, context.userId);

    // Decode
    const buffer = Buffer.from(data.fileBase64, "base64");
    if (buffer.byteLength === 0) throw new Error("Empty file");
    if (buffer.byteLength > MAX_BYTES) {
      throw new Error(`File too large (max ${MAX_BYTES / 1024 / 1024} MB)`);
    }

    // Lazy-load mammoth so its imports don't run at module init in client bundles
    // (the .functions.ts file is client-importable; this keeps cold-start lean).
    const mammoth = (await import("mammoth")).default;

    const imageUploads: Promise<void>[] = [];

    const result = await mammoth.convertToHtml(
      { buffer },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          const buf = Buffer.from(await image.read("base64"), "base64");
          const ct = image.contentType || "application/octet-stream";
          // Hash content for idempotent file names
          const hashBuf = await crypto.subtle.digest("SHA-256", buf);
          const hash = Array.from(new Uint8Array(hashBuf))
            .slice(0, 16)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          const ext = contentTypeToExt(ct);
          const path = `articles/${data.articleId}/images/${hash}.${ext}`;
          imageUploads.push(
            (async () => {
              const { error } = await supabaseAdmin.storage
                .from(ASSETS_BUCKET)
                .upload(path, buf, { contentType: ct, upsert: true });
              if (error && !/already exists/i.test(error.message)) {
                throw new Error(`Image upload failed: ${error.message}`);
              }
            })(),
          );
          const { data: pub } = supabaseAdmin.storage.from(ASSETS_BUCKET).getPublicUrl(path);
          return { src: pub.publicUrl, alt: (image as unknown as { altText?: string }).altText ?? "" };
        }),
      },
    );

    await Promise.all(imageUploads);

    const cleanHtml = sanitizeHtml(result.value);

    // Upload original .docx
    const docxPath = `articles/${data.articleId}/source.docx`;
    const { error: docxErr } = await supabaseAdmin.storage
      .from(ASSETS_BUCKET)
      .upload(docxPath, buffer, {
        contentType: extToContentType(".docx") === "application/octet-stream"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : extToContentType(".docx"),
        upsert: true,
      });
    if (docxErr && !/already exists/i.test(docxErr.message)) {
      throw new Error(`Source upload failed: ${docxErr.message}`);
    }

    const uploadedAt = new Date().toISOString();

    const { error: updateErr } = await supabaseAdmin
      .from("articles")
      .update({
        source_kind: "docx",
        html: cleanHtml,
        source_file_path: docxPath,
        source_file_name: data.fileName,
        source_uploaded_at: uploadedAt,
      })
      .eq("id", data.articleId);
    if (updateErr) throw new Error(`Article update failed: ${updateErr.message}`);

    return {
      ok: true,
      uploadedAt,
      fileName: data.fileName,
      warnings: result.messages.slice(0, 20).map((m) => m.message),
    };
  });

// ---------- removeArticleDocx (revert to block editor) ----------

export const removeArticleDocx = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ articleId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(null, context.userId);

    const { error } = await supabaseAdmin
      .from("articles")
      .update({
        source_kind: "blocks",
        html: "",
        source_file_path: null,
        source_file_name: null,
        source_uploaded_at: null,
      })
      .eq("id", data.articleId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
