import mapBackground from "@/assets/login-map-background.webp";
import darkMapBackground from "@/assets/login-map-background-dark.webp";

const brandClaims = [
  "Rutas eficientes",
  "Operaciones más inteligentes",
  "Un mejor mañana",
];

export function LoginBrandPanel() {
  return (
    <aside className="relative hidden min-h-screen select-none overflow-hidden bg-[#061626] p-10 text-white lg:flex lg:flex-col lg:justify-end xl:p-14">
      <img
        src={mapBackground}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 size-full object-cover object-center transition-opacity duration-500 dark:opacity-0"
      />
      <img
        src={darkMapBackground}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 size-full object-cover object-center opacity-0 transition-opacity duration-500 dark:opacity-100"
      />

      <div
        className="absolute inset-0 bg-gradient-to-b from-[#061626]/15 via-[#061626]/20 to-[#061626]/90"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#061626]/30 via-transparent to-[#061626]/10"
        aria-hidden="true"
      />

      <span
        className="absolute left-[65%] top-[25%] z-10 size-3 rounded-full bg-white shadow-[0_0_0_8px_rgba(255,255,255,0.08),0_0_24px_8px_rgba(76,215,208,0.32)]"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-2xl space-y-5">
        <div className="space-y-3">
          <h2 className="text-5xl leading-[1.08] font-extrabold tracking-tight xl:text-6xl">
            Cada entrega
            <br />
            comienza <span className="text-[#4cd7d0]">aquí</span>
          </h2>
          <p className="max-w-xl text-lg leading-7 text-slate-100">
            Controla tus despachos con claridad, de principio a fin.
          </p>
        </div>

        <div
          className="h-1 w-24 rounded-full bg-gradient-to-r from-[#4cd7d0] via-[#38bdf8] to-transparent shadow-[0_0_12px_rgba(76,215,208,0.7)]"
          aria-hidden="true"
        />

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs font-semibold tracking-[0.12em] text-slate-300 uppercase">
          {brandClaims.map((claim, index) => (
            <li key={claim} className="flex items-center gap-4">
              {index > 0 && (
                <span className="size-1.5 rounded-full bg-brand-turquoise" aria-hidden="true" />
              )}
              <span>{claim}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
