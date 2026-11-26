import { useState } from "react";
import { Download, FileText, LoaderCircle, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
  avisoLimite,
  excedeLimite,
  guardarArchivo,
  mensajeErrorExportacion,
  nombreArchivoAuditoria,
  type FormatoExportacion,
} from "../auditoria.exportar";
import type { FiltrosAuditoria } from "../auditoria.reglas";
import { exportarEventosAuditoria } from "../services/auditoria.service";
import type { AuditoriaParams } from "../types/auditoria.types";

interface ExportarAuditoriaProps {
  /** Los mismos parámetros de la búsqueda visible: el archivo trae exactamente ese resultado. */
  params: AuditoriaParams;
  filtros: Pick<FiltrosAuditoria, "desde" | "hasta">;
  /** Total de la búsqueda actual; null mientras no se conoce. */
  total: number | null;
  /** Filtros inválidos o búsqueda cargando. */
  deshabilitado?: boolean;
}

/**
 * Exportar la búsqueda actual en CSV o PDF (ST-71.2, RF-A38). Manda la misma ventana, filtros y orden;
 * muestra el progreso y, si falla, explica cómo seguir sin tocar los filtros de la pantalla.
 */
export function ExportarAuditoria({ params, filtros, total, deshabilitado = false }: ExportarAuditoriaProps) {
  const [exportando, setExportando] = useState<FormatoExportacion | null>(null);
  const [progreso, setProgreso] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sinDatos = total === 0;
  const exportar = async (formato: FormatoExportacion) => {
    setError(null);
    if (total !== null && excedeLimite(total, formato)) {
      setError(avisoLimite(formato));
      return;
    }
    setExportando(formato);
    setProgreso(null);
    try {
      const archivo = await exportarEventosAuditoria(params, formato, setProgreso);
      const nombre = nombreArchivoAuditoria(filtros, formato);
      guardarArchivo(archivo, nombre);
      toast.success(`Descargado ${nombre}`);
    } catch (causa) {
      setError(mensajeErrorExportacion(causa, formato));
    } finally {
      setExportando(null);
      setProgreso(null);
    }
  };

  const boton = (formato: FormatoExportacion, icono: React.ReactNode) => {
    const activo = exportando === formato;
    return (
      <Button type="button" variant="outline" disabled={deshabilitado || sinDatos || exportando !== null}
        onClick={() => void exportar(formato)} aria-label={`Exportar en ${formato.toUpperCase()}`}>
        {activo ? <LoaderCircle className="animate-spin" aria-hidden /> : icono}
        {activo ? `Generando ${formato.toUpperCase()}${progreso !== null ? ` ${progreso} %` : "…"}` : formato.toUpperCase()}
      </Button>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">Exportar esta búsqueda:</span>
        {boton("csv", <Download aria-hidden />)}
        {boton("pdf", <FileText aria-hidden />)}
      </div>
      {exportando && <p className="sr-only" role="status">Generando el archivo {exportando.toUpperCase()}</p>}
      {error && (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
