/**
 * Consistent color selection for a title
 */
export function getFallbackColor(title: string) {
  const colors = [
    "#6366f1", // Indigo
    "#a855f7", // Purple
    "#ec4899", // Pink
    "#f43f5e", // Rose
    "#f59e0b", // Amber
    "#10b981", // Emerald
    "#06b6d4", // Cyan
    "#3b82f6", // Blue
  ];
  const hash = title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[Math.abs(hash) % colors.length];
}
