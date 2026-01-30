"use client";

import { useState, useCallback, ClipboardEvent } from "react";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  loading: boolean;
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function UrlInput({ onSubmit, loading }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a URL");
      return;
    }
    if (!isValidUrl(trimmed)) {
      setError("Please enter a valid URL");
      return;
    }
    setError("");
    onSubmit(trimmed);
  }, [url, onSubmit]);

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData("text");
      if (isValidUrl(pasted)) {
        setError("");
        setTimeout(() => onSubmit(pasted.trim()), 100);
      }
    },
    [onSubmit]
  );

  return (
    <div className="glass-card p-6 animate-fade-up-delay-2 w-full max-w-2xl mx-auto">
      <div className="flex gap-3">
        <input
          type="text"
          className="input-field flex-1"
          placeholder="Paste a video or media URL..."
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError("");
          }}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) handleSubmit();
          }}
          disabled={loading}
        />
        <button
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Extracting...
            </>
          ) : (
            "Extract"
          )}
        </button>
      </div>
      {error && (
        <p className="text-[var(--error)] text-sm mt-2 animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
}
