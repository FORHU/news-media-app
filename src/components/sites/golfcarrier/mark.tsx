import { GOLF_COLORS as C } from "./brand";

/**
 * The GolfCarrier mark (same drawing as public/icons/golfcarrier.svg): a rounded
 * fairway tile with a sand pin, lime flag, ink cup and white ball.
 */
export function GolfMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect x="0" y="0" width="64" height="64" rx="15" fill={C.fairway} />
      <path d="M0 44 Q32 36 64 44 V49 Q64 64 49 64 H15 Q0 64 0 49 Z" fill={C.fairwayStripe} />
      <ellipse cx="25" cy="47" rx="9" ry="2.8" fill={C.ink} />
      <rect x="23.4" y="11" width="3.2" height="36.5" rx="1.6" fill={C.sand} />
      <path d="M26.6 11.5 L46 18.5 L26.6 25.5 Z" fill={C.flag} />
      <circle cx="44" cy="45" r="5.2" fill={C.white} />
    </svg>
  );
}

/** Mark + "GolfCarrier" wordmark. `onDark` swaps to sand/flag for ink backgrounds. */
export function GolfWordmark({ onDark = false, size = 34 }: { onDark?: boolean; size?: number }) {
  return (
    <span className={`gc-wordmark ${onDark ? "gc-wordmark--dark" : ""}`}>
      <GolfMark size={size} />
      <span className="gc-wordmark__text">
        Golf<span className="gc-wordmark__accent">Carrier</span>
      </span>
    </span>
  );
}

/** Small pennant used as a section marker. */
export function FlagIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x="3" y="1" width="1.8" height="14" rx="0.9" fill="currentColor" />
      <path d="M4.8 1.5 L14 4.8 L4.8 8.1 Z" fill="currentColor" />
    </svg>
  );
}
