"use client";

import { useState } from "react";
import DownloadButton from "./DownloadButton";

export interface VideoFormat {
  tier: string;
  label: string;
  height: number;
  ext: string;
  filesize?: number;
}

export interface AudioFormat {
  tier: string;
  label: string;
  ext: string;
  filesize?: number;
}

export interface MediaResult {
  title: string;
  thumbnail: string;
  duration?: string;
  video_formats: VideoFormat[];
  audio_format: AudioFormat | null;
  source_url: string;
  download_base: string;
}

type MediaMode = "video" | "audio";

function formatDuration(seconds?: string): string {
  if (!seconds) return "";
  const s = parseInt(seconds, 10);
  if (isNaN(s)) return "";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const tierLabels: Record<string, string> = {
  highest: "Best",
  mid: "Medium",
  lowest: "Low",
};

export default function ResultCard({ result }: { result: MediaResult }) {
  const hasVideo = result.video_formats.length > 0;
  const hasAudio = !!result.audio_format;
  const [mode, setMode] = useState<MediaMode>(hasVideo ? "video" : "audio");
  const [selectedTier, setSelectedTier] = useState("highest");

  const downloadUrl = `${result.download_base}/download?url=${encodeURIComponent(result.source_url)}&mode=${mode}&quality=${selectedTier}&title=${encodeURIComponent(result.title)}`;

  return (
    <div className="glass-card p-6 w-full max-w-2xl mx-auto animate-fade-up hover-lift">
      {/* Thumbnail + title */}
      <div className="flex gap-4 mb-5">
        {result.thumbnail && (
          <div className="flex-shrink-0 w-40 h-24 rounded-lg overflow-hidden bg-[var(--bg-secondary)]">
            <img
              src={result.thumbnail}
              alt={result.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg leading-snug line-clamp-2 mb-1">
            {result.title}
          </h3>
          {result.duration && (
            <p className="text-sm text-[var(--text-muted)]">
              {formatDuration(result.duration)}
            </p>
          )}
        </div>
      </div>

      {/* Mode toggle */}
      {hasVideo && hasAudio && (
        <div className="flex gap-2 mb-5">
          <button
            className={`mode-tab ${mode === "video" ? "active" : ""}`}
            onClick={() => { setMode("video"); setSelectedTier("highest"); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            Video
          </button>
          <button
            className={`mode-tab ${mode === "audio" ? "active" : ""}`}
            onClick={() => { setMode("audio"); setSelectedTier("highest"); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            Audio Only
          </button>
        </div>
      )}

      {/* Quality selection */}
      {mode === "video" && hasVideo && (
        <div className="flex flex-col gap-2 mb-5">
          {result.video_formats.map((f) => (
            <button
              key={f.tier}
              className={`format-row ${selectedTier === f.tier ? "active" : ""}`}
              onClick={() => setSelectedTier(f.tier)}
            >
              <div className="flex items-center gap-3">
                <div className={`format-radio ${selectedTier === f.tier ? "checked" : ""}`} />
                <div>
                  <span className="font-medium">{f.label}</span>
                  <span className="text-[var(--text-muted)] ml-2 text-sm">.{f.ext}</span>
                </div>
                {f.tier === "highest" && (
                  <span className="best-badge">Best quality</span>
                )}
                {f.tier === "lowest" && (
                  <span className="small-badge">Smallest size</span>
                )}
              </div>
              {f.filesize && (
                <span className="text-sm text-[var(--text-muted)]">{formatSize(f.filesize)}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {mode === "audio" && hasAudio && result.audio_format && (
        <div className="flex flex-col gap-2 mb-5">
          <div className="format-row active">
            <div className="flex items-center gap-3">
              <div className="format-radio checked" />
              <div>
                <span className="font-medium">{result.audio_format.label}</span>
                <span className="text-[var(--text-muted)] ml-2 text-sm">.{result.audio_format.ext}</span>
              </div>
              <span className="best-badge">Best quality</span>
            </div>
            {result.audio_format.filesize && (
              <span className="text-sm text-[var(--text-muted)]">{formatSize(result.audio_format.filesize)}</span>
            )}
          </div>
        </div>
      )}

      {/* Download */}
      <DownloadButton url={downloadUrl} />
    </div>
  );
}
