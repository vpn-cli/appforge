"use client";

export function BackgroundRibbons() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none"
    >
      {/* Soft atmospheric radial gradient behind top-right viewport */}
      <div className="absolute -top-24 right-0 w-[780px] h-[700px] rounded-full bg-gradient-to-br from-indigo-300/30 via-violet-200/20 to-transparent blur-[90px] opacity-70 dark:from-indigo-900/20 dark:via-violet-950/15" />

      {/* Single large sculpted glass ribbon in top-right */}
      <div className="absolute top-0 right-0 w-[650px] lg:w-[860px] h-[680px] opacity-70 dark:opacity-30 transition-opacity duration-500">
        <svg
          viewBox="0 0 860 680"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            {/* Soft violet-indigo translucent gradient */}
            <linearGradient
              id="glassRibbonGrad"
              x1="860"
              y1="30"
              x2="320"
              y2="640"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.35" />
              <stop offset="35%" stopColor="#818CF8" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#C7D2FE" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#EEF2FF" stopOpacity="0.0" />
            </linearGradient>

            {/* Glossy crest highlight */}
            <linearGradient
              id="crestHighlight"
              x1="860"
              y1="50"
              x2="360"
              y2="520"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
              <stop offset="40%" stopColor="#E0E7FF" stopOpacity="0.45" />
              <stop offset="80%" stopColor="#C7D2FE" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#A5B4FC" stopOpacity="0.0" />
            </linearGradient>

            {/* Edge soft glow filter */}
            <filter id="ribbonSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="32" result="blur" />
            </filter>
            <filter id="crestGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Deep ambient blur underpinning */}
          <path
            d="M860 60 C 700 110, 520 220, 430 380 C 350 510, 420 610, 580 660 C 720 660, 800 580, 860 480 Z"
            fill="url(#glassRibbonGrad)"
            filter="url(#ribbonSoftGlow)"
          />

          {/* Sweeping translucent glass ribbon body */}
          <path
            d="M860 30 C 660 80, 480 200, 390 360 C 310 500, 390 620, 560 670 C 680 610, 780 490, 860 340 Z"
            fill="url(#glassRibbonGrad)"
            style={{ mixBlendMode: "multiply" }}
            className="dark:mix-blend-screen"
          />

          {/* Crest highlight line */}
          <path
            d="M860 45 C 650 95, 470 215, 400 375 C 340 480, 410 570, 520 630"
            stroke="url(#crestHighlight)"
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#crestGlow)"
            opacity="0.75"
          />
        </svg>
      </div>
    </div>
  );
}
