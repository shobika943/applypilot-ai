// Signature mark: a dotted flight path with a paper-plane marker at its tip —
// the literal "pilot" in ApplyPilot, and the same motif reused in the
// waypoint loading animation. Kept to a single accent color so it stays
// legible small (navbar) and large (login hero).
export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 30 C 10 26, 14 18, 20 12 C 24 8, 28 6, 34 5"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeDasharray="1 4.5"
        strokeLinecap="round"
      />
      <circle cx="4" cy="30" r="2.5" fill="var(--accent-soft)" />
      <g transform="translate(28,2) rotate(45)">
        <path d="M0 8L8 0L6 8L8 16L0 8Z" fill="var(--accent)" />
      </g>
    </svg>
  );
}
