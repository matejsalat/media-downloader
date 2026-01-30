export default function Hero({ collapsed }: { collapsed?: boolean }) {
  return (
    <div
      className={`text-center transition-all duration-500 ${
        collapsed ? "py-4" : "py-12"
      }`}
    >
      <h1
        className={`font-bold gradient-text animate-fade-up transition-all duration-500 ${
          collapsed ? "text-2xl mb-1" : "text-5xl md:text-6xl mb-4"
        }`}
      >
        MediaGrab
      </h1>
      {!collapsed && (
        <>
          <p className="text-xl md:text-2xl font-semibold gradient-tagline animate-fade-up-delay-1 mb-3">
            Download anything, anywhere
          </p>
          <p className="text-[var(--text-secondary)] max-w-md mx-auto animate-fade-up-delay-2">
            Paste a URL from YouTube, Instagram, TikTok, Twitter, and 1000+
            more sites to extract and download media.
          </p>
        </>
      )}
    </div>
  );
}
