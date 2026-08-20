export function FlameDrop({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <linearGradient id="flame-drop-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff7a1a" />
          <stop offset="100%" stopColor="#d62828" />
        </linearGradient>
      </defs>
      <path
        d="M50 4 C68 32 88 54 88 74 A38 38 0 1 1 12 74 C12 54 32 32 50 4 Z"
        fill="url(#flame-drop-gradient)"
      />
    </svg>
  );
}
