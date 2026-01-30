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
  const videoFormats = formats.filter((f) => f.type === "video");
  const audioFormats = formats.filter((f) => f.type === "audio");

  return (
    <div className="space-y-4">
      {videoFormats.length > 0 && (
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-2 font-medium">
            Video
          </p>
          <div className="flex flex-wrap gap-2">
            {videoFormats.map((f) => (
              <button
                key={f.format_id}
                className={`quality-pill ${
                  selected === f.format_id ? "active" : ""
                }`}
                onClick={() => onSelect(f.format_id)}
              >
                {f.quality} ({f.ext})
                {f.filesize ? ` \u2022 ${formatSize(f.filesize)}` : ""}
              </button>
            ))}
          </div>
        </div>
      )}
      {audioFormats.length > 0 && (
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-2 font-medium">
            Audio
          </p>
          <div className="flex flex-wrap gap-2">
            {audioFormats.map((f) => (
              <button
                key={f.format_id}
                className={`quality-pill ${
                  selected === f.format_id ? "active" : ""
                }`}
                onClick={() => onSelect(f.format_id)}
              >
                {f.quality} ({f.ext})
                {f.filesize ? ` \u2022 ${formatSize(f.filesize)}` : ""}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
