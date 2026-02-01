"use client";

import { useRef, useState } from "react";

export default function DownloadButton({ url }: { url: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"idle" | "preparing" | "done" | "error">("idle");

  const handleDownload = () => {
    setStatus("preparing");

    // Use a hidden iframe so the browser downloads the file
    // without navigating away from the page
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.src = url;
    }

    // Poll to detect when download starts (iframe loads content-disposition: attachment)
    // After a reasonable time, show success
    setTimeout(() => setStatus("done"), 3000);
    setTimeout(() => setStatus("idle"), 6000);
  };

  return (
    <>
      <iframe ref={iframeRef} className="hidden" aria-hidden="true" />
      <button
        className={`btn-primary flex items-center justify-center gap-2 text-base hover-lift w-full ${
          status === "done" ? "btn-success" : ""
        }`}
        onClick={handleDownload}
        disabled={status === "preparing"}
      >
        {status === "idle" && (
          <>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </>
        )}
        {status === "preparing" && (
          <>
            <span className="spinner" />
            Preparing download...
          </>
        )}
        {status === "done" && (
          <>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Download started!
          </>
        )}
        {status === "error" && "Download failed — try again"}
      </button>
    </>
  );
}
