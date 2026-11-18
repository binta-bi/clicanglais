// Illustrations vectorielles originales (aux couleurs de ClicAnglais) pour les cartes des formations
const base = 'h-full w-full'

export function IllustrationDebutant() {
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true" className={base} fill="none">
      <rect width="320" height="200" fill="#eef1f8" />
      <circle cx="268" cy="38" r="54" fill="#e8652d" opacity="0.12" />
      <circle cx="40" cy="178" r="64" fill="#2d3a6b" opacity="0.08" />
      <g className="anim-bulle"><path d="M48 42h150a14 14 0 0 1 14 14v56a14 14 0 0 1-14 14h-92l-30 24v-24H48a14 14 0 0 1-14-14V56a14 14 0 0 1 14-14Z" fill="#2d3a6b" />
      <text x="123" y="97" textAnchor="middle" fontSize="38" fontWeight="800" fill="#fff" fontFamily="system-ui, sans-serif">Hello!</text></g>
      <g className="anim-bulle anim-bulle-2"><path d="M182 118h78a12 12 0 0 1 12 12v32a12 12 0 0 1-12 12h-10v20l-24-20h-44a12 12 0 0 1-12-12v-32a12 12 0 0 1 12-12Z" fill="#e8652d" />
      <text x="221" y="156" textAnchor="middle" fontSize="26" fontWeight="800" fill="#fff" fontFamily="system-ui, sans-serif">Hi!</text></g>
      <circle className="anim-point" cx="262" cy="84" r="5" fill="#e8652d" />
      <circle className="anim-point anim-bulle-2" cx="280" cy="98" r="3.5" fill="#2d3a6b" />
      <circle cx="244" cy="70" r="3" fill="#2d3a6b" opacity="0.5" />
    </svg>
  )
}

export function IllustrationIntermediaire() {
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true" className={base} fill="none">
      <rect width="320" height="200" fill="#e7ebf7" />
      <circle cx="40" cy="30" r="48" fill="#2d3a6b" opacity="0.08" />
      <circle cx="288" cy="176" r="60" fill="#e8652d" opacity="0.14" />
      {/* livre ouvert */}
      <path d="M160 70c-22-14-62-16-96-8v96c34-8 74-6 96 8V70Z" fill="#fff" stroke="#2d3a6b" strokeWidth="3" strokeLinejoin="round" />
      <path d="M160 70c22-14 62-16 96-8v96c-34-8-74-6-96 8V70Z" fill="#fff" stroke="#2d3a6b" strokeWidth="3" strokeLinejoin="round" />
      <path d="M80 86c24-4 48-2 66 6M80 104c24-4 48-2 66 6M80 122c24-4 48-2 66 6" stroke="#9fb0d9" strokeWidth="4" strokeLinecap="round" />
      <path d="M240 86c-24-4-48-2-66 6M240 104c-24-4-48-2-66 6" stroke="#9fb0d9" strokeWidth="4" strokeLinecap="round" />
      <path className="anim-ligne" d="M200 124h30" stroke="#e8652d" strokeWidth="5" strokeLinecap="round" />
      {/* étiquettes de grammaire */}
      <g fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="13">
        <g className="anim-bulle"><rect x="26" y="28" width="68" height="26" rx="13" fill="#2d3a6b" /><text x="60" y="46" textAnchor="middle" fill="#fff">Present</text></g>
        <g className="anim-bulle anim-bulle-2"><rect x="214" y="22" width="52" height="26" rx="13" fill="#e8652d" /><text x="240" y="40" textAnchor="middle" fill="#fff">Past</text></g>
        <g className="anim-bulle anim-bulle-3"><rect x="236" y="150" width="62" height="26" rx="13" fill="#2d3a6b" /><text x="267" y="168" textAnchor="middle" fill="#fff">Future</text></g>
      </g>
    </svg>
  )
}

export function IllustrationAvance() {
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true" className={base} fill="none">
      <rect width="320" height="200" fill="#e3e7f3" />
      <circle cx="280" cy="30" r="52" fill="#e8652d" opacity="0.14" />
      <circle cx="30" cy="170" r="66" fill="#2d3a6b" opacity="0.1" />
      {/* écran de présentation */}
      <rect x="52" y="34" width="216" height="126" rx="12" fill="#1b2347" />
      <rect x="62" y="44" width="196" height="106" rx="6" fill="#2d3a6b" />
      <rect className="anim-barre" style={{ animationDelay: '0s' }} x="82" y="116" width="26" height="24" rx="3" fill="#9fb0d9" />
      <rect className="anim-barre" style={{ animationDelay: '0.15s' }} x="120" y="100" width="26" height="40" rx="3" fill="#9fb0d9" />
      <rect className="anim-barre" style={{ animationDelay: '0.3s' }} x="158" y="84" width="26" height="56" rx="3" fill="#e8652d" />
      <rect className="anim-barre" style={{ animationDelay: '0.45s' }} x="196" y="64" width="26" height="76" rx="3" fill="#fff" />
      <path className="anim-trace" pathLength="1" d="m84 100 38-14 38-10 38-20" stroke="#e8652d" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <path d="M130 160h60l10 18H120l10-18Z" fill="#1b2347" />
      {/* médaille */}
      <circle className="anim-halo" cx="262" cy="150" r="24" fill="#e8652d" />
      <circle cx="262" cy="150" r="17" fill="none" stroke="#fff" strokeWidth="3" />
      <path d="m254 150 6 6 11-12" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Illustration de secours du héros : apprenante devant son ordinateur
export function IllustrationApprenante() {
  return (
    <svg viewBox="0 0 480 560" aria-hidden="true" className="h-full w-full" fill="none" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="fondApp" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e6dc" />
          <stop offset="1" stopColor="#dfe6f6" />
        </linearGradient>
      </defs>
      <rect width="480" height="560" fill="url(#fondApp)" />
      <circle className="anim-halo" cx="380" cy="110" r="120" fill="#e8652d" opacity="0.14" />
      <circle cx="90" cy="460" r="140" fill="#2d3a6b" opacity="0.1" />
      {/* plante */}
      <path d="M404 360c-24-40-20-80 8-110 6 38 20 70-8 110Zm0 0c26-30 56-40 76-34-16 30-44 44-76 34Z" fill="#2f8f6b" opacity="0.85" />
      <rect x="388" y="350" width="34" height="42" rx="8" fill="#c9501b" />
      {/* apprenante */}
      <g className="anim-respire"><path d="M130 420c0-62 46-102 112-102s112 40 112 102v70H130v-70Z" fill="#e8652d" />
      <path d="M200 322c10 22 80 22 90 0l-8-14h-74l-8 14Z" fill="#7a4a30" />
      <circle cx="245" cy="256" r="58" fill="#8d5a3b" />
      <path d="M186 248c-2-48 30-76 62-76 36 0 64 28 58 76-14-30-30-44-60-44s-46 14-60 44Z" fill="#241a17" />
      {/* casque audio */}
      <path d="M180 252c-4-56 30-84 66-84s70 28 66 84" stroke="#2d3a6b" strokeWidth="9" strokeLinecap="round" />
      <rect x="168" y="246" width="22" height="42" rx="10" fill="#2d3a6b" />
      <rect x="300" y="246" width="22" height="42" rx="10" fill="#2d3a6b" />
      <path d="M326 282c0 22-14 32-34 32" stroke="#2d3a6b" strokeWidth="5" strokeLinecap="round" />
      {/* sourire */}
      <path d="M224 278c12 12 32 12 44 0" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <circle className="anim-clin" cx="224" cy="252" r="4.5" fill="#241a17" />
      <circle className="anim-clin" cx="266" cy="252" r="4.5" fill="#241a17" /></g>
      {/* ordinateur */}
      <path d="M96 520h300l-22-132H118L96 520Z" fill="#1b2347" />
      <rect x="118" y="388" width="256" height="132" rx="8" fill="#2d3a6b" transform="translate(0 -6)" />
      <rect x="130" y="394" width="232" height="104" rx="4" fill="#eef1f8" />
      <rect x="146" y="408" width="136" height="76" rx="6" fill="#1b2347" />
      <path className="anim-play" d="m198 432 28 16-28 16z" fill="#fff" />
      <rect className="anim-ligne" x="294" y="408" width="54" height="8" rx="4" fill="#9fb0d9" />
      <rect className="anim-ligne" style={{ animationDelay: '0.4s' }} x="294" y="424" width="42" height="8" rx="4" fill="#9fb0d9" />
      <rect className="anim-ligne" style={{ animationDelay: '0.8s' }} x="294" y="440" width="54" height="8" rx="4" fill="#e8652d" />
      <rect x="86" y="520" width="320" height="14" rx="7" fill="#c7cfe6" />
    </svg>
  )
}
