const MAX_RESPONSE_BYTES = 64 * 1024;
const MAX_CANDIDATES = 32;

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#34;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function balancedJsonSlices(value: string): string[] {
  const slices: string[] = [];
  for (
    let start = 0;
    start < value.length && slices.length < MAX_CANDIDATES;
    start++
  ) {
    const opening = value[start];
    if (opening !== "{" && opening !== "[") continue;

    const stack = [opening];
    let inString = false;
    let escaped = false;
    for (let index = start + 1; index < value.length; index++) {
      const character = value[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') {
        inString = true;
        continue;
      }
      if (character === "{" || character === "[") {
        stack.push(character);
        continue;
      }
      if (character !== "}" && character !== "]") continue;
      const expected = character === "}" ? "{" : "[";
      if (stack.at(-1) !== expected) break;
      stack.pop();
      if (stack.length === 0) {
        slices.push(value.slice(start, index + 1));
        start = index;
        break;
      }
    }
  }
  return slices;
}

export function parseJsonResponseCandidates(text: string): unknown[] {
  if (Buffer.byteLength(text, "utf8") > MAX_RESPONSE_BYTES) return [];

  const trimmed = text.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const sources = [trimmed, unfenced, decodeHtmlEntities(trimmed)];
  const candidates = [...sources, ...sources.flatMap(balancedJsonSlices)];
  const parsed: unknown[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    try {
      parsed.push(JSON.parse(candidate));
    } catch {
      // Continue through the bounded set of supported response envelopes.
    }
  }
  return parsed;
}
