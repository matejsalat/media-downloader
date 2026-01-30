"use client";

import { useState } from "react";

interface DownloadButtonProps {
  url: string;
  filename: string;
}

export default function DownloadButton({ url, filename }: DownloadButtonProps) {
  const [status, setStatus] = useState<"idle" | "downloading" | "done" | "error">("idle");

  const handleDownload = () => {
    setStatus("downloading");
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setStatus("done"), 1500);
    setTimeout(() => setStatus("idle"), 4000);
  };

  const colors = {
    idle: "btn-primary",
    downloading: "btn-primary opacity-75",
    done: "",
    error: "",
  };

  const doneStyle = {
    background: "var(--success)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "12px 24px",
    fontWeight: 600,
    cursor: "pointer",
  };

  const errorStyle = {
    background: "var(--error)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "12px 24px",
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <button
      className={`${colors[status]} flex items-center gap-2 text-base hover-lift`}
      style={status === "done" ? doneStyle : status === "error" ? errorStyle : undefined}
      onClick={handleDownload}
      disabled={status === "downloading"}
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
      {status === "downloading" && (
        <>
          <span className="spinner" />
          Starting download...
        </>
      )}
      {status === "done" && "Download started!"}
      {status === "error" && "Download failed"}
    </button>
  );
}
