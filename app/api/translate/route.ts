export async function POST(req: Request) {
  const { text, from, to } = await req.json();
  if (!text?.trim()) return Response.json({ translated: "" });

  const langMap: Record<string, string> = { tr: "tr-TR", en: "en-US", ru: "ru-RU" };
  const langpair = `${langMap[from] ?? from}|${langMap[to] ?? to}`;

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    const translated = data.responseData?.translatedText;
    if (translated && translated !== "QUERY LENGTH LIMIT EXCEDEED") {
      return Response.json({ translated });
    }
  } catch {}

  return Response.json({ translated: text });
}
