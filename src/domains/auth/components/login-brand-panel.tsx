/**
 * Panel de marca del login (Fase de construcción progresiva - Pasos 1 y 2).
 * - Paso 1: Fondo azul oscuro limpio y uniforme.
 * - Paso 2: Silueta cartográfica vectorial con líneas blancas limpias y jerárquicas.
 * (Ruta, pines y tarjetas se añadirán en los pasos 3 y 4).
 */
export function LoginBrandPanel() {
  return (
    <aside className="relative hidden select-none overflow-hidden bg-[#091a2b] lg:flex lg:flex-col lg:justify-between p-10 xl:p-14 text-white">
      {/* 1. Fondo Azul Oscuro + Silueta de Mapa en Líneas Blancas (Pasos 1 y 2) */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <svg
          viewBox="0 0 900 1000"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
        >
          <defs>
            {/* Gradiente azul oscuro profundo y uniforme */}
            <linearGradient id="step1-dark-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0d2238" />
              <stop offset="60%" stopColor="#091a2b" />
              <stop offset="100%" stopColor="#06121e" />
            </linearGradient>

            {/* Máscara suave perimetral para que los bordes del mapa se desvanezcan sutilmente */}
            <radialGradient id="edge-fade-mask" cx="50%" cy="45%" r="65%">
              <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="85%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </radialGradient>
            <mask id="map-silhouette-mask">
              <rect width="100%" height="100%" fill="url(#edge-fade-mask)" />
            </mask>
          </defs>

          {/* PASO 1: Fondo azul oscuro base */}
          <rect width="100%" height="100%" fill="url(#step1-dark-bg)" />

          {/* PASO 2: Silueta de mapa con líneas blancas */}
          <g mask="url(#map-silhouette-mask)">
            {/* Silueta de Costa / Río en el lateral este */}
            <path
              d="M 680 -20 C 640 180, 580 320, 565 440 C 550 580, 620 720, 665 840 C 700 930, 760 1000, 830 1020 L 920 1020 L 920 -20 Z"
              fill="#061320"
              stroke="#ffffff"
              strokeWidth="1.4"
              opacity="0.3"
            />

            {/* AVENIDAS PRINCIPALES (Vías estructurantes con mayor grosor y visibilidad) */}
            <g stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.45" strokeLinecap="round">
              {/* Avenida Costanera que bordea el río */}
              <path d="M 645 -20 C 605 180, 550 320, 535 440 C 520 580, 590 720, 635 840 C 670 930, 725 1000, 785 1020" />

              {/* Autopista Central en diagonal fluida */}
              <path d="M -20 160 C 140 180, 240 260, 320 380 C 390 490, 460 620, 600 740 C 700 830, 800 880, 920 900" strokeWidth="2.4" />

              {/* Avenidas Transversales (Este - Oeste) */}
              <path d="M -20 280 L 545 280" />
              <path d="M -20 480 L 530 480" />
              <path d="M -20 700 L 600 700" />

              {/* Avenidas Longitudinales (Norte - Sur) */}
              <path d="M 120 -20 L 120 1020" />
              <path d="M 320 -20 L 320 1020" />
            </g>

            {/* ROTONDAS EN INTERSECCIONES ESTRATÉGICAS */}
            <g stroke="#ffffff" strokeWidth="1.6" fill="none" opacity="0.45">
              <circle cx="120" cy="280" r="14" />
              <circle cx="320" cy="280" r="16" />
              <circle cx="120" cy="480" r="14" />
              <circle cx="320" cy="480" r="16" />
              <circle cx="120" cy="700" r="14" />
              <circle cx="320" cy="700" r="16" />
            </g>

            {/* PUENTES CONECTORES SOBRE EL RÍO */}
            <g stroke="#ffffff" strokeWidth="2.2" opacity="0.5">
              <line x1="545" y1="280" x2="640" y2="280" />
              <line x1="530" y1="480" x2="625" y2="480" />
              <line x1="600" y1="700" x2="695" y2="700" />
            </g>

            {/* CALLES SECUNDARIAS / MANZANAS (Trazadas limpiamente entre avenidas, sin choques) */}
            <g stroke="#ffffff" strokeWidth="0.85" fill="none" opacity="0.22" strokeLinecap="square">
              {/* --- DISTRITO 1: Noroeste (Entre x: 120 y x: 320, y: 0 a 280) --- */}
              <line x1="120" y1="60" x2="320" y2="60" />
              <line x1="120" y1="115" x2="320" y2="115" />
              <line x1="120" y1="170" x2="320" y2="170" />
              <line x1="120" y1="225" x2="320" y2="225" />
              <line x1="170" y1="0" x2="170" y2="280" />
              <line x1="220" y1="0" x2="220" y2="280" />
              <line x1="270" y1="0" x2="270" y2="280" />

              {/* --- DISTRITO 2: Lejano Oeste Norte (Entre x: 0 y x: 120, y: 0 a 280) --- */}
              <line x1="0" y1="70" x2="120" y2="70" />
              <line x1="0" y1="140" x2="120" y2="140" />
              <line x1="0" y1="210" x2="120" y2="210" />
              <line x1="60" y1="0" x2="60" y2="280" />

              {/* --- DISTRITO 3: Noreste Ribera (Entre x: 320 y Costanera, y: 0 a 280) --- */}
              <line x1="320" y1="60" x2="620" y2="60" />
              <line x1="320" y1="115" x2="600" y2="115" />
              <line x1="320" y1="170" x2="575" y2="170" />
              <line x1="320" y1="225" x2="560" y2="225" />
              <line x1="380" y1="0" x2="380" y2="280" />
              <line x1="440" y1="0" x2="440" y2="280" />
              <line x1="500" y1="0" x2="500" y2="280" />

              {/* --- DISTRITO 4: Centro Oeste (Entre x: 120 y x: 320, y: 280 a 480) --- */}
              <line x1="120" y1="330" x2="320" y2="330" />
              <line x1="120" y1="380" x2="320" y2="380" />
              <line x1="120" y1="430" x2="320" y2="430" />
              <line x1="170" y1="280" x2="170" y2="480" />
              <line x1="220" y1="280" x2="220" y2="480" />
              <line x1="270" y1="280" x2="270" y2="480" />

              {/* --- DISTRITO 5: Lejano Oeste Centro (Entre x: 0 y x: 120, y: 280 a 480) --- */}
              <line x1="0" y1="345" x2="120" y2="345" />
              <line x1="0" y1="410" x2="120" y2="410" />
              <line x1="60" y1="280" x2="60" y2="480" />

              {/* --- DISTRITO 6: Centro Ribereño (Entre x: 320 y Costanera, y: 280 a 480) --- */}
              <line x1="320" y1="330" x2="540" y2="330" />
              <line x1="320" y1="380" x2="535" y2="380" />
              <line x1="320" y1="430" x2="530" y2="430" />
              <line x1="380" y1="280" x2="380" y2="480" />
              <line x1="440" y1="280" x2="440" y2="480" />
              <line x1="500" y1="280" x2="500" y2="480" />

              {/* --- DISTRITO 7: Suroeste (Entre x: 120 y x: 320, y: 480 a 700) --- */}
              <line x1="120" y1="535" x2="320" y2="535" />
              <line x1="120" y1="590" x2="320" y2="590" />
              <line x1="120" y1="645" x2="320" y2="645" />
              <line x1="170" y1="480" x2="170" y2="700" />
              <line x1="220" y1="480" x2="220" y2="700" />
              <line x1="270" y1="480" x2="270" y2="700" />

              {/* --- DISTRITO 8: Lejano Suroeste (Entre x: 0 y x: 120, y: 480 a 700) --- */}
              <line x1="0" y1="550" x2="120" y2="550" />
              <line x1="0" y1="625" x2="120" y2="625" />
              <line x1="60" y1="480" x2="60" y2="700" />

              {/* --- DISTRITO 9: Sureste Intermedio (Entre x: 320 y Costanera, y: 480 a 700) --- */}
              <line x1="320" y1="535" x2="535" y2="535" />
              <line x1="320" y1="590" x2="550" y2="590" />
              <line x1="320" y1="645" x2="575" y2="645" />
              <line x1="380" y1="480" x2="380" y2="700" />
              <line x1="450" y1="480" x2="450" y2="700" />
              <line x1="520" y1="480" x2="520" y2="700" />

              {/* --- DISTRITO 10: Sector Sur / Expansión (y: 700 a 980) --- */}
              <line x1="0" y1="765" x2="620" y2="765" />
              <line x1="0" y1="830" x2="640" y2="830" />
              <line x1="0" y1="895" x2="670" y2="895" />
              <line x1="60" y1="700" x2="60" y2="980" />
              <line x1="180" y1="700" x2="180" y2="980" />
              <line x1="250" y1="700" x2="250" y2="980" />
              <line x1="380" y1="700" x2="380" y2="980" />
              <line x1="460" y1="700" x2="460" y2="980" />
              <line x1="540" y1="700" x2="540" y2="980" />
            </g>

          </g>
        </svg>
      </div>

      {/* Capa de Contraste en tercio inferior para legibilidad del texto */}
      <div
        className="absolute inset-0 pointer-events-none z-[4] bg-gradient-to-t from-[#091a2b]/95 via-[#091a2b]/50 to-transparent via-40%"
        aria-hidden="true"
      />

      {/* Espacio reservado para los pines y ruta (Pasos 3 y 4) */}
      <div className="relative z-10 w-full h-[60%] pointer-events-none" />

      {/* Bloque de Texto Hero Inferior */}
      <div className="relative z-10 space-y-4">
        <div className="space-y-2.5">
          <h2 className="text-4xl font-extrabold tracking-tight text-white xl:text-5xl leading-[1.12]">
            Cada entrega <br />
            comienza{" "}
            <span className="text-[#4cd7d0] drop-shadow-[0_0_16px_rgba(76,215,208,0.5)]">
              aquí
            </span>
          </h2>
          <p className="max-w-md text-base text-slate-200 font-normal">
            Controla tus despachos con claridad, de principio a fin.
          </p>
        </div>

        {/* Línea decorativa turquesa */}
        <div className="h-1 w-16 rounded-full bg-gradient-to-r from-[#4cd7d0] via-[#38bdf8] to-transparent shadow-[0_0_8px_#4cd7d0]" />

        {/* Footer de claims corporativos */}
        <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold tracking-widest text-slate-300 uppercase">
          <span>RUTAS EFICIENTES</span>
          <span className="size-1 rounded-full bg-sky-400/60" />
          <span>OPERACIONES MÁS INTELIGENTES</span>
          <span className="size-1 rounded-full bg-sky-400/60" />
          <span>UN MEJOR MAÑANA</span>
        </div>
      </div>
    </aside>
  );
}





