"use client";

import { useState } from "react";
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
  const [selectedFormat, setSelectedFormat] = useState(
    result.formats[0]?.format_id ?? ""
  );

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

      {result.formats.length > 0 && (
        <div className="mb-5">
          <QualitySelector
            formats={result.formats}
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
