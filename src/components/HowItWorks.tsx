"use client";

import { useState } from "react";

const steps = [
  {
    text: "Copy the URL of any video or audio you want to download",
    highlight: "copy the link",
  },
  {
    text: "Paste it into the search bar above",
    highlight: "paste",
  },
  {
    text: "Choose between Video or Audio Only",
    highlight: "Video or Audio",
  },
  {
    text: "Select your preferred quality and hit Download",
    highlight: "Download",
  },
];

export default function HowItWorks() {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-up-delay-3">
      <button
        className="how-toggle"
        onClick={() => setOpen(!open)}
      >
        <span>How it works</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`how-chevron ${open ? "open" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="how-panel animate-fade-in">
          {steps.map((step, i) => (
            <div key={i} className="how-step">
              <span className="how-number">{i + 1}</span>
              <p className="how-step-text">
                {step.text.split(step.highlight).map((part, j, arr) => (
                  <span key={j}>
                    {part}
                    {j < arr.length - 1 && (
                      <strong className="text-white">{step.highlight}</strong>
                    )}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
