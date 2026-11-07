export default function CampusArt() {
  return (
    <svg viewBox="0 0 400 375" aria-label="Mapa esquemático do evento">
      <defs>
        <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r=".7" fill="#c6d4ca" />
        </pattern>
      </defs>
      <rect width="400" height="375" fill="#edf1e9" />
      <rect width="400" height="375" fill="url(#dots)" />
      <path d="M-20 230 420 140M160-20l60 420" stroke="#fff" strokeWidth="35" />
      <path
        d="M-20 230 420 140M160-20l60 420"
        stroke="#dfe7db"
        strokeWidth="1"
        strokeDasharray="4 6"
      />
      <g fill="#d4dfc9">
        <circle cx="62" cy="71" r="17" />
        <circle cx="76" cy="100" r="12" />
        <circle cx="326" cy="305" r="26" />
        <circle cx="345" cy="275" r="14" />
        <circle cx="74" cy="315" r="20" />
      </g>
      <g fill="#dce3ee" stroke="#b6c4dc">
        <rect
          x="100"
          y="65"
          width="75"
          height="78"
          rx="6"
          transform="rotate(-12 100 65)"
        />
        <rect
          x="45"
          y="249"
          width="106"
          height="55"
          rx="6"
          transform="rotate(-12 45 249)"
        />
        <rect
          x="236"
          y="223"
          width="70"
          height="77"
          rx="6"
          transform="rotate(-12 236 223)"
        />
      </g>
      <rect
        x="234"
        y="65"
        width="112"
        height="78"
        rx="8"
        transform="rotate(-12 234 65)"
        fill="#3b5487"
      />
      <path
        d="m197 305-16-92 105-22-15-65"
        stroke="#3b5487"
        strokeWidth="3"
        strokeDasharray="5 6"
        fill="none"
      />
      <circle cx="197" cy="305" r="17" fill="#37558c" fillOpacity=".15" />
      <circle
        cx="197"
        cy="305"
        r="7"
        fill="#37558c"
        stroke="white"
        strokeWidth="3"
      />
      <g fontFamily="sans-serif" fontSize="9" fontWeight="600" fill="#6a7c92">
        <text x="95" y="169">
          AUDITÓRIO
        </text>
        <text x="56" y="330">
          CONVIVÊNCIA
        </text>
        <text x="253" y="324">
          BLOCO 01
        </text>
      </g>
      <g>
        <rect x="240" y="38" width="97" height="25" rx="12" fill="#fff" />
        <text
          x="254"
          y="54"
          fontFamily="sans-serif"
          fontSize="9"
          fontWeight="700"
          fill="#345284"
        >
          VOCÊ VAI AQUI
        </text>
      </g>
      <text
        x="155"
        y="345"
        fill="#486586"
        fontSize="8"
        fontFamily="sans-serif"
        letterSpacing="1"
      >
        VOCÊ ESTÁ AQUI
      </text>
    </svg>
  );
}
