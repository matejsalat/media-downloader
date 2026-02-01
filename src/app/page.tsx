"use client";

import { useState, useCallback, useRef } from "react";
import Background from "@/components/Background";
import Hero from "@/components/Hero";
import UrlInput from "@/components/UrlInput";
import ResultCard, { MediaResult } from "@/components/ResultCard";
import ValueProps from "@/components/ValueProps";
import HowItWorks from "@/components/HowItWorks";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MediaResult | null>(null);
  const [error, setError] = useState("");
  const [showNotif, setShowNotif] = useState(false);
  const hasSearched = useRef(false);

  const handleExtract = useCallback(async (url: string) => {
    setLoading(true);
    setError("");
    setResult(null);
    setShowNotif(false);
    hasSearched.current = true;

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
      setShowNotif(true);
      setTimeout(() => setShowNotif(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const showIntro = !hasSearched.current && !result && !loading;

  return (
    <main className="relative min-h-screen flex flex-col items-center px-4 py-8">
      <Background />

      {showNotif && (
        <div className="toast animate-fade-up">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Media found — ready to download!
        </div>
      )}

      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6">
        <Hero collapsed={!!result} />

        {showIntro && (
          <>
            <ValueProps />
            <HowItWorks />
          </>
        )}

        <UrlInput onSubmit={handleExtract} loading={loading} />

        {error && (
          <div className="glass-card p-4 w-full max-w-2xl mx-auto animate-fade-in border-[var(--error)]">
            <p className="text-[var(--error)] text-sm">{error}</p>
          </div>
        )}

        {result && <ResultCard result={result} />}

        {(result || error) && (
          <button
            className="btn-new-search w-full max-w-2xl animate-fade-up-delay-1"
            onClick={() => {
              setResult(null);
              setError("");
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            New Search
          </button>
        )}
      </div>
    </main>
  );
}
