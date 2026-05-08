export async function POST(req: Request) {
  const { text, from, to } = await req.json();
  if (!text?.trim()) return Response.json({ translated: "" });

  const langMap: Record<string, string> = { tr: "tr-TR", en: "en-US", ru: "ru-RU" };
  const langpair = `${langMap[from] ?? from}|${langMap[to] ?? to}`;

  async function translateChunk(chunk: string): Promise<string> {
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${langpair}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const data = await res.json();
      const translated = data.responseData?.translatedText;
      if (translated && !translated.includes("QUERY LENGTH LIMIT")) {
        return translated;
      }
    } catch {}
    return chunk;
  }

  // Split into chunks of max 490 chars at sentence/word boundaries
  if (text.length <= 490) {
    const result = await translateChunk(text);
    return Response.json({ translated: result });
  }

  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= 490) {
      chunks.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf(". ", 490);
    if (splitAt < 100) splitAt = remaining.lastIndexOf(" ", 490);
    if (splitAt < 1) splitAt = 490;
    else splitAt += 1;
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  const translated = (await Promise.all(chunks.map(translateChunk))).join(" ");
  return Response.json({ translated });
}
