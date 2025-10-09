import React from "react";
import { createRoot } from "react-dom/client";

function VideoPlayer() {
  return (
    <div
      className="relative w-full min-h-[320px] sm:min-h-[480px] border border-black/10 dark:border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-black/90 text-white"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Placeholder video area. Replace with your own <video> element or player as needed. */}
      <div className="text-center p-6">
        <div className="mb-3 text-base opacity-80">pizzaz-video</div>
        <div className="text-sm opacity-60">
          This is a placeholder for a video experience. Add an HTML5 <code>&lt;video&gt;</code>
          element or your preferred player here.
        </div>
      </div>
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
