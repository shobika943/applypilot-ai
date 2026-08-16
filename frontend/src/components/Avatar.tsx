export type AvatarStyle = "male" | "female" | "neutral";

// Simple, friendly SVG avatars with a slow breathing animation (see .avatar-anim
// in styles.css). Style is chosen by the user at signup — never inferred from
// their name, which would be both unreliable and presumptuous.
export default function Avatar({ style = "neutral", size = 36 }: { style?: AvatarStyle; size?: number }) {
  const palette: Record<AvatarStyle, { skin: string; hair: string; top: string }> = {
    male: { skin: "#E8B594", hair: "#2B2320", top: "#5B5FEF" },
    female: { skin: "#F0C6A6", hair: "#4A2E22", top: "#E85D8A" },
    neutral: { skin: "#D9B48F", hair: "#3A3F52", top: "#12172B" },
  };
  const c = palette[style];

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="avatar-anim" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="var(--surface-2)" />
      <circle cx="20" cy="26" r="12" fill={c.top} />
      <circle cx="20" cy="16" r="8" fill={c.skin} />
      {style !== "male" && <path d="M11 13 Q20 4 29 13 Q29 18 26 15 Q20 10 14 15 Q11 18 11 13Z" fill={c.hair} />}
      {style === "male" && <path d="M12 13 Q20 6 28 13 Q28 10 20 9 Q12 10 12 13Z" fill={c.hair} />}
      {style === "female" && <path d="M11 14 Q11 26 15 28 Q13 20 14 15 Z" fill={c.hair} />}
      {style === "female" && <path d="M29 14 Q29 26 25 28 Q27 20 26 15 Z" fill={c.hair} />}
    </svg>
  );
}
