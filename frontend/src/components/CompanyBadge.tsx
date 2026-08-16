// A small colorful "avatar" per job card — the company's initial(s) on a
// deterministic gradient (same company always gets the same color), so job
// listings feel a bit more alive than a bare title/company text row.
const PALETTES = [
  ["#5B5FEF", "#8A8DF7"],
  ["#FFB454", "#FFD08A"],
  ["#1F9D63", "#5CC996"],
  ["#D64550", "#EF848C"],
  ["#0EA5B7", "#5FD6E3"],
  ["#B9660A", "#E8A24C"],
];

function hashString(s: string) {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function CompanyBadge({ name, size = 42 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const [c1, c2] = PALETTES[hashString(name) % PALETTES.length];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "12px",
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: size * 0.36,
        flexShrink: 0,
      }}
    >
      {initials || "?"}
    </div>
  );
}
