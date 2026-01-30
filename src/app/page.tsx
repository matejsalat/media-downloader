"use client";

import { useState, useCallback } from "react";
import Background from "@/components/Background";
import Hero from "@/components/Hero";
import UrlInput from "@/components/UrlInput";
import ResultCard, { MediaResult } from "@/components/ResultCard";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MediaResult | null>(null);
  const [error, setError] = useState("");

  const handleExtract = useCallback(async (url: string) => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Extraction failed (${res.status})`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <main className="relative min-h-screen flex flex-col items-center px-4 py-8">
      <Background />

      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6">
        <Hero collapsed={!!result} />
        <UrlInput onSubmit={handleExtract} loading={loading} />

        {error && (
          <div className="glass-card p-4 w-full max-w-2xl mx-auto animate-fade-in border-[var(--error)]">
            <p className="text-[var(--error)] text-sm">{error}</p>
          </div>
        )}

        {result && <ResultCard result={result} />}
      </div>
    </main>
  );
}
