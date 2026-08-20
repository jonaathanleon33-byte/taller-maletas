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
      <rect x="10" y="20" width="44" height="32" rx="3" />
      <path d="M24 20v-4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4" />
      <line x1="10" y1="32" x2="54" y2="32" />
      <path d="M40 38a6 6 0 0 0-8 8l-6 6 3 3 6-6a6 6 0 0 0 5-11z" />
    </svg>
  );
}
