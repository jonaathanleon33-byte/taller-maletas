export function LogoTaller({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="8" y="21" width="36" height="27" rx="3" />
      <path d="M22 21v-4a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v4" />
      <line x1="8" y1="32" x2="44" y2="32" />
      <rect x="23" y="29" width="6" height="6" rx="1" />
      <circle cx="46" cy="40" r="13" />
      <g transform="translate(36,30) scale(0.83)">
        <path
          d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
          strokeWidth="2.2"
        />
      </g>
    </svg>
  );
}
