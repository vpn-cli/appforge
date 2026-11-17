"use client";

export function BackgroundRibbons() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none"
    >
      {/* 1. Soft lavender radial wash in top-left */}
      <div className="absolute -top-24 -left-16 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-indigo-200/45 via-violet-100/35 to-transparent blur-[120px] dark:from-indigo-950/30 dark:via-violet-950/20" />

      {/* 2. Dark mode: Soft violet glow centered directly behind the demo panels */}
      <div className="hidden dark:block absolute top-[260px] left-1/2 -translate-x-1/2 w-[900px] h-[560px] rounded-full bg-gradient-to-br from-violet-600/20 via-indigo-600/12 to-transparent blur-[120px]" />

      {/* 3. Large 3D translucent periwinkle ribbons sweeping from top-right down behind the right panel & nav */}
      <div className="absolute top-0 right-0 w-[920px] lg:w-[1200px] h-[960px] transition-opacity duration-500">
        <svg
          viewBox="0 0 1200 960"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          preserveAspectRatio="xMaxYMin meet"
        >
          <defs>
            {/* Primary periwinkle translucent gradient */}
            <linearGradient
              id="periwinkleRibbonGrad1"
              x1="1200"
              y1="40"
              x2="450"
              y2="820"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#7C8BF5" stopOpacity="0.65" />
              <stop offset="25%" stopColor="#8B9CFE" stopOpacity="0.55" />
              <stop offset="55%" stopColor="#A5B4FC" stopOpacity="0.40" />
              <stop offset="85%" stopColor="#C7D2FE" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#E0E7FF" stopOpacity="0.0" />
            </linearGradient>

            {/* Deep violet-indigo under-ribbon gradient */}
            <linearGradient
              id="violetRibbonGrad2"
              x1="1180"
              y1="140"
              x2="560"
              y2="900"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.58" />
              <stop offset="40%" stopColor="#7C3AED" stopOpacity="0.45" />
              <stop offset="75%" stopColor="#818CF8" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#C7D2FE" stopOpacity="0.0" />
            </linearGradient>

            {/* Foreground sweeping curl gradient */}
            <linearGradient
              id="foregroundCurlGrad"
              x1="1200"
              y1="340"
              x2="680"
              y2="940"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.55" />
              <stop offset="45%" stopColor="#A5B4FC" stopOpacity="0.35" />
              <stop offset="85%" stopColor="#C7D2FE" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#EEF2FF" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing specular crest highlight */}
            <linearGradient
              id="crestHighlightGrad"
              x1="1200"
              y1="50"
              x2="490"
              y2="720"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="30%" stopColor="#F0F4FF" stopOpacity="0.85" />
              <stop offset="65%" stopColor="#C7D2FE" stopOpacity="0.40" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.0" />
            </linearGradient>

            {/* Secondary crest highlight */}
            <linearGradient
              id="crestHighlightGrad2"
              x1="1200"
              y1="200"
              x2="620"
              y2="860"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.90" />
              <stop offset="35%" stopColor="#DDD6FE" stopOpacity="0.65" />
              <stop offset="80%" stopColor="#A5B4FC" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
            </linearGradient>

            {/* Filters for volumetric depth & crest glow */}
            <filter id="ribbonDeepGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="45" result="blur" />
            </filter>
            <filter id="ribbonMediumBlur" x="-15%" y="-15%" width="130%" height="130%">
              <feGaussianBlur stdDeviation="18" result="blur" />
            </filter>
            <filter id="crestGlowFilter" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Layer 1: Ambient deep periwinkle glow foundation */}
          <path
            d="M1200 30 C 980 90, 740 230, 580 430 C 450 610, 560 780, 780 870 C 980 880, 1100 760, 1200 640 Z"
            fill="url(#periwinkleRibbonGrad1)"
            filter="url(#ribbonDeepGlow)"
            className="opacity-85 dark:opacity-45"
          />

          {/* Layer 2: Deep violet-indigo under-ribbon passing directly behind the right panel */}
          <path
            d="M1200 140 C 1010 200, 780 340, 640 530 C 520 700, 620 850, 840 910 C 1020 890, 1120 770, 1200 600 Z"
            fill="url(#violetRibbonGrad2)"
            filter="url(#ribbonMediumBlur)"
            className="opacity-80 dark:opacity-50"
          />

          {/* Layer 3: Main translucent 3D periwinkle ribbon body */}
          <path
            d="M1200 40 C 930 100, 690 260, 530 470 C 410 640, 510 810, 760 890 C 940 850, 1090 700, 1200 500 Z"
            fill="url(#periwinkleRibbonGrad1)"
            className="opacity-90 dark:opacity-40"
          />

          {/* Layer 4: Foreground sweeping wave curl */}
          <path
            d="M1200 330 C 1050 390, 870 520, 740 690 C 660 800, 750 900, 920 930 C 1060 910, 1150 820, 1200 700 Z"
            fill="url(#foregroundCurlGrad)"
            className="opacity-85 dark:opacity-45"
          />

          {/* Specular crest arc 1: High curvature ridge light */}
          <path
            d="M1200 55 C 940 115, 700 275, 545 485 C 450 620, 535 750, 715 840"
            stroke="url(#crestHighlightGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#crestGlowFilter)"
            className="opacity-95 dark:opacity-60"
          />

          {/* Specular crest arc 2: Secondary inner ridge highlight */}
          <path
            d="M1200 160 C 1020 220, 800 365, 670 555 C 585 680, 670 795, 825 875"
            stroke="url(#crestHighlightGrad2)"
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#crestGlowFilter)"
            className="opacity-85 dark:opacity-50"
          />
        </svg>
      </div>
    </div>
  );
}
