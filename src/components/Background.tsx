export default function Background() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div
        className="orb orb-purple"
        style={{ width: 600, height: 600, top: "-10%", left: "-5%" }}
      />
      <div
        className="orb orb-blue"
        style={{ width: 500, height: 500, top: "40%", right: "-10%" }}
      />
      <div
        className="orb orb-pink"
        style={{ width: 450, height: 450, bottom: "-5%", left: "30%" }}
      />
    </div>
  );
}
