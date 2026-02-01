export default function ValueProps() {
  return (
    <div className="grid grid-cols-3 gap-4 w-full max-w-2xl mx-auto animate-fade-up-delay-2">
      <div className="value-prop">
        <span className="value-icon">&#9889;</span>
        <p className="value-text">Top quality. Always the highest resolution available.</p>
      </div>
      <div className="value-prop">
        <span className="value-icon">&#127381;</span>
        <p className="value-text">Totally free. No limits, no sign-up, no ads.</p>
      </div>
      <div className="value-prop">
        <span className="value-icon">&#127760;</span>
        <p className="value-text">1000+ sites. YouTube, TikTok, Instagram, and more.</p>
      </div>
    </div>
  );
}
