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

/**
 * Generates a colorful SVG fallback image data URL.
 * Included as a utility, though StoryImage now uses a CSS div for better performance.
 */
export function getFallbackImage(title: string) {
  const color = getFallbackColor(title);
  const escapedTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  
  const svg = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="white" text-anchor="middle" dominant-baseline="middle">${escapedTitle.slice(0, 30)}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
