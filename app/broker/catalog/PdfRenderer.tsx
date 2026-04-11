"use client";
import { useEffect, useRef, useState } from "react";

export default function PdfRenderer({ url }: { url: string }) {
  const [pages, setPages] = useState<number>(0);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    async function load() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const pdf = await pdfjsLib.getDocument(url).promise;
        if (cancelled) return;
        setPages(pdf.numPages);

        // Render nach kurzer Pause damit canvasRefs befüllt sind
        setTimeout(async () => {
          for (let i = 1; i <= pdf.numPages; i++) {
            const canvas = canvasRefs.current[i - 1];
            if (!canvas || cancelled) continue;
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.8 });
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext("2d")!;
            await page.render({ canvasContext: ctx, viewport }).promise;
          }
        }, 50);
      } catch (e) {
        console.error("PDF render error:", e);
        if (!cancelled) setError(true);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [url]);

  if (error) return <div style={{ color: "#999", fontSize: 13 }}>PDF yüklenemedi.</div>;
  if (pages === 0) return <div style={{ color: "#999", fontSize: 13 }}>PDF yükleniyor...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: pages }, (_, i) => (
        <canvas
          key={i}
          ref={el => { canvasRefs.current[i] = el; }}
          style={{ width: "100%", borderRadius: 6, border: "1px solid #E2E8F0", display: "block" }}
        />
      ))}
    </div>
  );
}
