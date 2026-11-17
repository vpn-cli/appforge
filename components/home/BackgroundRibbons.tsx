"use client";

export function BackgroundRibbons() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none"
    >
      {/* 1. Top-left faint soft ambient shape */}
      <div className="absolute -top-32 -left-20 w-[420px] h-[360px] rounded-full bg-gradient-to-br from-indigo-300/35 via-purple-200/25 to-transparent blur-[70px] opacity-70 dark:from-indigo-900/25 dark:via-purple-900/15" />

      {/* 2. Hero Right Layered Glossy Ribbon Wave Shapes with Mask Fade */}
      <div
        className="absolute top-0 right-0 w-[1000px] h-[800px] max-w-full opacity-75 dark:opacity-35 transition-opacity duration-500"
        style={{
          maskImage:
            "radial-gradient(ellipse 95% 85% at 92% 8%, black 30%, rgba(0,0,0,0.65) 65%, transparent 98%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 95% 85% at 92% 8%, black 30%, rgba(0,0,0,0.65) 65%, transparent 98%)",
        }}
      >
        <svg
          viewBox="0 0 720 580"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            {/* Deep Violet Base Gradient */}
            <linearGradient
              id="deepVioletGrad"
              x1="720"
              y1="40"
              x2="220"
              y2="520"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#4338CA" stopOpacity="0.75" />
              <stop offset="35%" stopColor="#4F46E5" stopOpacity="0.60" />
              <stop offset="70%" stopColor="#6366F1" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>

            {/* Mid Luminous Blue-Violet Wave Gradient */}
            <linearGradient
              id="midLuminousGrad"
              x1="700"
              y1="20"
              x2="280"
              y2="460"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.85" />
              <stop offset="30%" stopColor="#6366F1" stopOpacity="0.70" />
              <stop offset="65%" stopColor="#4F46E5" stopOpacity="0.40" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>

            {/* Soft Lavender Translucent Overlay Gradient */}
            <linearGradient
              id="softLavenderGrad"
              x1="680"
              y1="80"
              x2="320"
              y2="500"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#C7D2FE" stopOpacity="0.75" />
              <stop offset="40%" stopColor="#A5B4FC" stopOpacity="0.50" />
              <stop offset="80%" stopColor="#818CF8" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </linearGradient>

            {/* Glossy Crest Highlight Gradient */}
            <linearGradient
              id="glossyHighlightGrad"
              x1="720"
              y1="50"
              x2="300"
              y2="380"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="25%" stopColor="#E0E7FF" stopOpacity="0.7" />
              <stop offset="65%" stopColor="#C7D2FE" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#A5B4FC" stopOpacity="0" />
            </linearGradient>

            {/* Soft Edge Glow Filter */}
            <filter id="ribbonBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="28" result="blur" />
            </filter>
            <filter id="crestGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Layer 1: Ambient deep blurred base wave */}
          <path
            d="M720 80 C 580 120, 420 220, 350 350 C 290 460, 360 530, 500 580 C 590 580, 660 530, 720 460 Z"
            fill="url(#deepVioletGrad)"
            filter="url(#ribbonBlur)"
          />

          {/* Layer 2: Sweeping primary blue-violet ribbon band */}
          <path
            d="M720 20 C 540 60, 380 170, 310 310 C 240 440, 310 530, 470 580 C 550 530, 630 430, 720 310 Z"
            fill="url(#midLuminousGrad)"
          />

          {/* Layer 3: Secondary translucent overlapping ribbon */}
          <path
            d="M720 120 C 560 160, 430 260, 380 380 C 330 480, 400 550, 540 580 C 610 520, 670 430, 720 350 Z"
            fill="url(#softLavenderGrad)"
            style={{ mixBlendMode: "screen" }}
          />

          {/* Layer 4: Glossy Crest Highlight band */}
          <path
            d="M720 50 C 550 100, 400 200, 340 330 C 290 430, 350 500, 460 550 C 390 460, 380 370, 440 300 C 510 210, 600 130, 720 90 Z"
            fill="url(#glossyHighlightGrad)"
            style={{ mixBlendMode: "overlay" }}
          />

          {/* Layer 5: Glowing highlight stroke along the wave crest */}
          <path
            d="M720 35 C 530 75, 370 185, 320 330 C 270 430, 320 500, 430 550"
            stroke="url(#glossyHighlightGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#crestGlow)"
            opacity="0.85"
          />

          {/* Layer 6: Soft second crest highlight */}
          <path
            d="M720 130 C 570 180, 450 280, 395 390 C 360 460, 420 520, 510 560"
            stroke="#C7D2FE"
            strokeWidth="1.75"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      </div>
    </div>
  );
}
