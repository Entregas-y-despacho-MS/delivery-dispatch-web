import { useParams } from "react-router-dom";

import { SeguimientoPublicoVista } from "@/domains/seguimiento";

/** Enlace del correo: /seguimiento/:token (ST-224.2). Sin login. */
export default function SeguimientoDetallePage() {
  const { token = "" } = useParams<{ token: string }>();
  // key: otro enlace en la misma pestaña arranca de cero (sin la verificación del anterior).
  return <SeguimientoPublicoVista key={token} token={token} />;
}
