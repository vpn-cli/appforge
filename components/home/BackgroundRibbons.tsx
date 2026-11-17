"use client";

export function BackgroundRibbons() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none"
    >
      {/* Top-left soft lavender-indigo ambient glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-200/40 via-purple-200/30 to-transparent blur-3xl opacity-70 dark:from-indigo-900/20 dark:via-purple-900/15" />

      {/* Hero Right Glossy Ribbon Shapes */}
      <div className="absolute top-0 right-0 w-[620px] h-[720px] max-w-full opacity-65 dark:opacity-35 transition-opacity duration-500">
        <svg
          viewBox="0 0 620 720"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            {/* Outer Blue-Violet Wave Gradient */}
            <linearGradient
              id="ribbonGrad1"
              x1="620"
              y1="80"
              x2="180"
              y2="520"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.75" />
              <stop offset="45%" stopColor="#6366F1" stopOpacity="0.6" />
              <stop offset="85%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
            </linearGradient>

            {/* Glossy Inner Highlight Gradient */}
            <linearGradient
              id="ribbonGrad2"
              x1="580"
              y1="180"
              x2="240"
              y2="460"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#C7D2FE" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#A5B4FC" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
            </linearGradient>

            {/* Deep Violet Base Gradient */}
            <linearGradient
              id="ribbonGrad3"
              x1="620"
              y1="300"
              x2="280"
              y2="640"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#7C3AED" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
            </linearGradient>

            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="36" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Deep Underlying Ribbon Arc */}
          <path
            d="M620 180 C 480 220, 320 340, 290 480 C 265 590, 340 680, 480 720 L 620 720 Z"
            fill="url(#ribbonGrad3)"
            filter="url(#softGlow)"
          />

          {/* Primary Sweeping Wave Petal */}
          <path
            d="M620 60 C 440 120, 260 260, 220 420 C 180 570, 260 680, 440 720 C 520 660, 580 520, 620 400 Z"
            fill="url(#ribbonGrad1)"
          />

          {/* Glossy Crest Highlight Ribbon */}
          <path
            d="M620 140 C 480 180, 340 300, 300 440 C 270 540, 330 630, 440 680 C 370 580, 360 480, 410 380 C 470 270, 560 190, 620 160 Z"
            fill="url(#ribbonGrad2)"
            style={{ mixBlendMode: "overlay" }}
          />

          {/* Faint Translucent Overlay Wave */}
          <path
            d="M620 280 C 510 320, 400 410, 370 510 C 340 610, 400 680, 510 720 L 620 720 Z"
            fill="url(#ribbonGrad1)"
            opacity="0.45"
          />
        </svg>
      </div>
    </div>
  );
}
