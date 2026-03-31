"use client";

export function BlockbusterLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 360 110"
      role="img"
      aria-label="Blockbuster"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="bbShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="2"
            floodColor="#000000"
            floodOpacity="0.25"
          />
        </filter>
        <mask id="ticketMask">
          <rect x="0" y="0" width="360" height="110" fill="white" rx="12" />
          {/* side notches */}
          <circle cx="18" cy="55" r="20" fill="black" />
          <circle cx="342" cy="55" r="20" fill="black" />
        </mask>
      </defs>

      {/* yellow outer */}
      <g filter="url(#bbShadow)">
        <rect
          x="4"
          y="4"
          width="352"
          height="102"
          rx="14"
          fill="#F5C400"
          mask="url(#ticketMask)"
        />
        {/* blue inner */}
        <rect
          x="26"
          y="18"
          width="308"
          height="74"
          rx="12"
          fill="#0A3D91"
          mask="url(#ticketMask)"
        />
        {/* inner outline like the reference */}
        <rect
          x="38"
          y="28"
          width="284"
          height="54"
          rx="10"
          fill="none"
          stroke="#F5C400"
          strokeWidth="3"
          opacity="0.9"
          mask="url(#ticketMask)"
        />
      </g>

      {/* wordmark */}
      <g transform="translate(66 72)">
        <text
          x="0"
          y="0"
          fill="#F5C400"
          fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
          fontWeight="900"
          fontSize="44"
          letterSpacing="1"
        >
          BLOCKBUSTER
        </text>
      </g>
    </svg>
  );
}
