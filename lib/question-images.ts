/**
 * Gambar hasil ekstraksi tertanam di teks soal sebagai markdown
 * `![Gambar Soal](data:image/jpeg;base64,....)`. Berkas ini memuat cara
 * membaca/menyembunyikan markdown tersebut supaya panel admin tidak mencetak
 * ratusan kilo karakter base64 sebagai teks biasa.
 */

const IMAGE_MARKDOWN_RE = /!\[[^\]]*\]\(data:image\/[a-z+]+;base64,[^)]*\)/g;
const IMAGE_MARKER_RE = /‹gambar (\d+)›/g;

export const hasImageMarkdown = (text?: string | null): boolean =>
  /!\[[^\]]*\]\(data:image\/[a-z+]+;base64,[^)]*\)/.test(text || "");

/** Semua sumber gambar yang tertanam, sesuai urutan kemunculan. */
export function imageSources(text?: string | null): string[] {
  const matches = (text || "").match(IMAGE_MARKDOWN_RE) || [];
  return matches.map((md) => md.slice(md.indexOf("(") + 1, -1));
}

/** Buang markdown gambar — dipakai bila hanya teksnya yang ditampilkan. */
export function stripImageMarkdown(text?: string | null): string {
  return (text || "").replace(IMAGE_MARKDOWN_RE, "").replace(/[ \t]+\n/g, "\n").trim();
}

/**
 * Sembunyikan markdown gambar dari kolom edit sebagai penanda pendek
 * `‹gambar 1›`, `‹gambar 2›`, … Gambar sendiri tetap ada di nilai model.
 */
export function hideImageMarkdown(text?: string | null): string {
  let index = 0;
  return (text || "").replace(IMAGE_MARKDOWN_RE, () => `‹gambar ${++index}›`);
}

/**
 * Balikkan penanda `‹gambar n›` menjadi markdown gambar aslinya (gambar ke-n
 * dari nilai model sebelumnya) setiap kali admin mengedit kolom teks.
 */
export function restoreImageMarkdown(
  edited: string,
  previous?: string | null,
): string {
  const images = (previous || "").match(IMAGE_MARKDOWN_RE) || [];
  if (images.length === 0) return edited;
  return edited.replace(IMAGE_MARKER_RE, (_, order: string) => {
    const image = images[Number(order) - 1];
    return image === undefined ? "" : image;
  });
}

/** Jumlah gambar yang tertanam pada satu nilai teks. */
export const countImages = (text?: string | null): number =>
  (text || "").match(IMAGE_MARKDOWN_RE)?.length || 0;
