/**
 * Parse [1], [2] etc. and split content into segments with citation refs.
 * Used by ChatMessage and any component that renders cited text.
 */
export function parseCitedContent(content: string): { text: string; ref?: number }[] {
  const re = /\[(\d+)\]/g;
  const parts: { text: string; ref?: number }[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIdx) {
      parts.push({ text: content.slice(lastIdx, m.index) });
    }
    parts.push({ text: m[0], ref: parseInt(m[1], 10) });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < content.length) {
    parts.push({ text: content.slice(lastIdx) });
  }
  return parts.length ? parts : [{ text: content }];
}
