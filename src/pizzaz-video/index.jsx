import React, { useMemo } from "react";
import { createRoot } from "react-dom/client";

const DEFAULT_VIDEO =
  "https://cdn.coverr.co/videos/coverr-melting-cheese-pizza-2988/1080p.mp4";

function VideoPlayer() {
  const src = useMemo(() => {
    const v = typeof window !== "undefined" ? window.__PIZZAZ_VIDEO_URL__ : undefined;
    return typeof v === "string" && v.trim() ? v : DEFAULT_VIDEO;
  }, []);

  return (
    <div className="relative w-full min-h-[320px] sm:min-h-[480px] border border-black/10 dark:border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-black">
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
