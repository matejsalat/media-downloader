"use client";

export interface FormatOption {
  format_id: string;
  ext: string;
  quality: string;
  filesize?: number;
  type: "video" | "audio";
  url: string;
}

interface QualitySelectorProps {
  formats: FormatOption[];
  selected: string;
  onSelect: (formatId: string) => void;
}

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function QualitySelector({
  formats,
  selected,
  onSelect,
}: QualitySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {formats.map((f) => (
        <button
          key={f.format_id}
          className={`quality-pill ${
            selected === f.format_id ? "active" : ""
          }`}
          onClick={() => onSelect(f.format_id)}
        >
          {f.quality}
          <span className="text-[var(--text-muted)] ml-1">
            .{f.ext}
          </span>
          {f.filesize ? (
            <span className="text-[var(--text-muted)] ml-1">
              {formatSize(f.filesize)}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
