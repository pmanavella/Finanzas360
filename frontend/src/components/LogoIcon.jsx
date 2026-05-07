export default function LogoIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">

      {/* ── Globe: secciones del gráfico circular ── */}
      {/* Base teal oscuro */}
      <circle cx="50" cy="60" r="38" fill="#1b7474"/>

      {/* Sección verde lima – cuadrante superior-derecho */}
      <path d="M50,60 L50,22 A38,38 0 0,1 88,60 Z" fill="#7ec63d"/>

      {/* Sección teal oscuro – inferior-izquierdo */}
      <path d="M50,60 L12,60 A38,38 0 0,0 50,98 Z" fill="#0d5252"/>

      {/* Sección teal medio – inferior-derecho */}
      <path d="M50,60 L88,60 A38,38 0 0,1 50,98 Z" fill="#228787"/>

      {/* Líneas divisorias blancas (radio del círculo exacto → no salen del globo) */}
      <line x1="50" y1="22" x2="50" y2="98" stroke="rgba(248,244,228,0.88)" strokeWidth="2.4"/>
      <line x1="12" y1="60" x2="88" y2="60" stroke="rgba(248,244,228,0.88)" strokeWidth="2.4"/>

      {/* ── Órbita: parte de atrás (encima del globo, más suave) ── */}
      <path
        d="M36,23 C48,14 66,17 76,28"
        stroke="#7ec63d" strokeWidth="3" strokeLinecap="round" opacity="0.48"
      />

      {/* ── Órbita: parte delantera (debajo del globo) ── */}
      <path
        d="M12,76 C17,90 33,98 50,93 C61,88 66,79 64,67"
        stroke="#7ec63d" strokeWidth="3.6" strokeLinecap="round"
      />

      {/* ── Flecha (continúa desde la órbita trasera hacia arriba-derecha) ── */}
      <line x1="76" y1="28" x2="87" y2="9" stroke="#7ec63d" strokeWidth="3.6" strokeLinecap="round"/>
      {/* Cabeza de flecha */}
      <polygon points="93,4 79,8 85,21" fill="#7ec63d"/>

    </svg>
  )
}
