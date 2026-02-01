"use client";

import { useState, useMemo } from "react";
import QualitySelector, { FormatOption } from "./QualitySelector";
import DownloadButton from "./DownloadButton";

export interface MediaResult {
  title: string;
  thumbnail: string;
  duration?: string;
  formats: FormatOption[];
}

interface ResultCardProps {
  result: MediaResult;
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

export default function ResultCard({ result }: ResultCardProps) {
  const hasVideo = result.formats.some((f) => f.type === "video");
  const hasAudio = result.formats.some((f) => f.type === "audio");

  const [mode, setMode] = useState<MediaMode>(hasVideo ? "video" : "audio");

  const filteredFormats = useMemo(
    () => result.formats.filter((f) => f.type === mode),
    [result.formats, mode]
  );

  const [selectedFormat, setSelectedFormat] = useState(
    filteredFormats[0]?.format_id ?? ""
  );

  const handleModeChange = (newMode: MediaMode) => {
    setMode(newMode);
    const first = result.formats.find((f) => f.type === newMode);
    if (first) setSelectedFormat(first.format_id);
  };

  const currentFormat = result.formats.find(
    (f) => f.format_id === selectedFormat
  );

  const filename = currentFormat
    ? `${result.title}.${currentFormat.ext}`
    : result.title;

  return (
    <div className="glass-card p-6 w-full max-w-2xl mx-auto animate-fade-up hover-lift">
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

      {hasVideo && hasAudio && (
        <div className="flex gap-2 mb-5">
          <button
            className={`mode-tab ${mode === "video" ? "active" : ""}`}
            onClick={() => handleModeChange("video")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            Video
          </button>
          <button
            className={`mode-tab ${mode === "audio" ? "active" : ""}`}
            onClick={() => handleModeChange("audio")}
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

      {filteredFormats.length > 0 && (
        <div className="mb-5">
          <p className="text-sm text-[var(--text-muted)] mb-2 font-medium">
            Quality
          </p>
          <QualitySelector
            formats={filteredFormats}
            selected={selectedFormat}
            onSelect={setSelectedFormat}
          />
        </div>
      )}

      {currentFormat && (
        <DownloadButton url={currentFormat.url} filename={filename} />
      )}
    </div>
  );
}
