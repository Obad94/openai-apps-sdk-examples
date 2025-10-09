import React, { useMemo } from "react";
import { createRoot } from "react-dom/client";
import { useMaxHeight } from "../use-max-height";
import { useOpenAiGlobal } from "../use-openai-global";

const DEFAULT_VIDEO =
  "https://videos.openai.com/vg-assets/assets%2Ftask_01k75dw4hcfb1tmte3mjmmeba4%2Ftask_01k75dw4hcfb1tmte3mjmmeba4_genid_dd080f2b-26b2-461f-8c61-651674dc3e3a_25_10_09_21_26_340602%2Fvideos%2F00000_402619027%2Fsource.mp4?se=2025-10-10T01%3A27%3A20Z&sp=r&sv=2024-08-04&sr=b&skoid=8b872fb2-b44b-4c1d-9ff6-1d4509d19e6e&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-10-09T21%3A13%3A27Z&ske=2025-10-09T22%3A23%3A27Z&sks=b&skv=2024-08-04&sig=BSzXN7jo/Ogs7ltxo%2BUj0ay1JwBTLqhtjYxmfUiqH0c%3D&az=oaivgprodscus";

function VideoPlayer() {
  const src = useMemo(() => {
    const v = typeof window !== "undefined" ? window.__PIZZAZ_VIDEO_URL__ : undefined;
    return typeof v === "string" && v.trim() ? v : DEFAULT_VIDEO;
  }, []);

  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useOpenAiGlobal("displayMode");
  const containerHeight = typeof maxHeight === "number" && displayMode === "fullscreen"
    ? Math.max(0, maxHeight - 40) // match spacing pattern used elsewhere
    : 480; // sane default for inline mode

  return (
    <div
      className="relative w-full border border-black/10 dark:border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-black"
      style={{ maxHeight, height: containerHeight }}
    >
      <video
        style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        controls
      />
    </div>
  );
}

export default function App() {
  return <VideoPlayer />;
}

// Mount to the standard root expected by the dev server and widget HTML
const mountEl = document.getElementById("pizzaz-video-root");
if (mountEl) {
  createRoot(mountEl).render(<App />);
}
