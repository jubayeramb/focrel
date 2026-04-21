type Props = {
  className?: string;
};

// Inline SVG of the Focrel glyph (same construction as the app's icon, simplified).
// Rendered inline so it ships as zero extra network bytes and inherits currentColor
// for the ring strokes where useful.
export function Wordmark({ className }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Focrel glyph"
    >
      <defs>
        <linearGradient id="wm-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2a1a55" />
          <stop offset="60%" stopColor="#17434e" />
          <stop offset="100%" stopColor="#1a5b5e" />
        </linearGradient>
        <linearGradient id="wm-ring" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#b48aef" />
          <stop offset="100%" stopColor="#2e1260" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#wm-body)" />
      <g transform="translate(32 32) rotate(-18)">
        <rect x="-20" y="-20" width="40" height="40" rx="8" fill="#7ddcd2" opacity="0.45" />
      </g>
      <g transform="translate(32 32) rotate(12)">
        <rect x="-14" y="-14" width="28" height="28" rx="6" fill="#6f8edd" opacity="0.6" />
      </g>
      <g transform="translate(32 32) rotate(-6)">
        <rect x="-9" y="-9" width="18" height="18" rx="4" fill="url(#wm-ring)" />
      </g>
      <circle cx="32" cy="32" r="2.5" fill="#ffffff" />
    </svg>
  );
}
