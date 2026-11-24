export function AppForgeLogo({
  className = "",
  size = 24,
  isHovered = false,
}: {
  className?: string;
  size?: number;
  isHovered?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`group/logo ${className}`}
      aria-hidden="true"
    >
      {/* Top Diamond */}
      <path
        d="M50 15 L80 30 L50 45 L20 30 Z"
        fill="currentColor"
        className={`transition-transform duration-200 ease-out ${
          isHovered ? "-translate-y-2 opacity-90" : "group-hover/logo:-translate-y-2"
        }`}
      />
      {/* Left Diamond (Shadow Side) */}
      <path
        d="M20 35 L50 50 L50 85 L20 70 Z"
        fill="currentColor"
        className={`opacity-70 transition-transform duration-200 ease-out ${
          isHovered
            ? "-translate-x-1 translate-y-1"
            : "group-hover/logo:-translate-x-1 group-hover/logo:translate-y-1"
        }`}
      />
      {/* Right Diamond (Lit Side) */}
      <path
        d="M80 35 L50 50 L50 85 L80 70 Z"
        fill="currentColor"
        className={`opacity-50 transition-transform duration-200 ease-out ${
          isHovered
            ? "translate-x-1 translate-y-1"
            : "group-hover/logo:translate-x-1 group-hover/logo:translate-y-1"
        }`}
      />
      {/* Central Spark */}
      <circle
        cx="50"
        cy="40"
        r="4"
        fill="currentColor"
        className={`origin-center transition-all duration-200 ease-out ${
          isHovered
            ? "opacity-100 -translate-y-2 scale-125"
            : "opacity-0 scale-0 group-hover/logo:opacity-100 group-hover/logo:-translate-y-2 group-hover/logo:scale-125"
        }`}
      />
    </svg>
  );
}
