import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { useCrud } from "@/shared/hooks/use-crud";
import { parseApiError } from "@/shared/lib/api-error";
import { exportarHistorialCsv, historialDespachosService } from "../services/historial-despachos.service";
import type { DespachoHistorial, EstadoFinal, HistorialParams, OrdenHistorial } from "../types/historial.types";
import {
  escribirFiltrosHistorial,
  leerFiltrosHistorial,
  paramsHistorial,
  rangoInvertido,
  type FiltrosHistorial,
} from "../historial.url";

const DEBOUNCE_MS = 300;

/** Texto que se escribe en el input y pasa a la URL tras 300 ms sin teclear. */
function useTextoDiferido(valorUrl: string, aplicar: (valor: string) => void) {
  const [texto, setTexto] = useState(valorUrl);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(temporizador.current), []);
  return {
    texto,
    cambiar: (valor: string) => {
      setTexto(valor);
      clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => aplicar(valor.trim()), DEBOUNCE_MS);
    },
    limpiar: () => {
      clearTimeout(temporizador.current);
      setTexto("");
    },
  };
}

/**
 * Historial de despachos finalizados (ST-55.1): filtros combinables, orden y paginación en el servidor.
 * Todo vive en la URL, así que al recargar o compartir el link se abre igual. Por defecto,
 * lo cerrado más recientemente primero.
 */
export function useHistorialDespachos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = useMemo(() => leerFiltrosHistorial(searchParams), [searchParams]);

  /** Cambia filtros; salvo que se pida otra página, vuelve a la 1. `replace` no llena el historial del navegador. */
  const actualizar = (cambios: Partial<FiltrosHistorial>) => {
    setSearchParams((actuales) => escribirFiltrosHistorial({ ...leerFiltrosHistorial(actuales), pagina: 1, ...cambios }, actuales), { replace: true });
  };

  const busqueda = useTextoDiferido(filtros.buscar, (buscar) => actualizar({ buscar }));
  const placa = useTextoDiferido(filtros.placa, (valor) => actualizar({ placa: valor }));

  const invertido = rangoInvertido(filtros);
  const params = useMemo<HistorialParams>(() => paramsHistorial(filtros), [filtros]);

  const historial = useCrud<DespachoHistorial, never, never, HistorialParams>(
    historialDespachosService,
    "dispatch-history",
    { params, enabled: !invertido },
  );

  const exportar = useMutation({
    mutationFn: () => exportarHistorialCsv(params),
    onSuccess: (nombre) => toast.success(`Descargamos ${nombre}`),
    onError: (error) => toast.error(parseApiError(error).message),
  });

  /** Primer clic en otra columna: ascendente; en la misma, alterna asc/desc. */
  const toggleOrden = (orden: OrdenHistorial) => {
    const dir = filtros.orden === orden ? (filtros.dir === "asc" ? "desc" : "asc") : "asc";
    actualizar({ orden, dir });
  };

  const hayFiltros = Boolean(busqueda.texto.trim() || placa.texto.trim() || filtros.desde || filtros.hasta)
    || filtros.conductor !== "all" || filtros.estado !== "all";

  return {
    historial,
    filtros,
    rangoInvertido: invertido,
    busqueda: busqueda.texto,
    setBusqueda: busqueda.cambiar,
    placa: placa.texto,
    setPlaca: placa.cambiar,
    setDesde: (desde: string) => actualizar({ desde }),
    setHasta: (hasta: string) => actualizar({ hasta }),
    setConductor: (conductor: FiltrosHistorial["conductor"]) => actualizar({ conductor }),
    setEstado: (estado: "all" | EstadoFinal) => actualizar({ estado }),
    toggleOrden,
    setPagina: (pagina: number) => actualizar({ pagina }),
    setFilas: (filas: number) => actualizar({ filas }),
    totalPaginas: Math.max(historial.pages ?? 0, 1),
    hayFiltros,
    /** Limpia filtros y búsqueda; el orden y las filas por página se mantienen. */
    limpiarFiltros: () => {
      busqueda.limpiar();
      placa.limpiar();
      actualizar({ buscar: "", placa: "", desde: "", hasta: "", conductor: "all", estado: "all" });
    },
    exportar: () => exportar.mutate(),
    exportando: exportar.isPending,
    refrescar: () => historial.refetch(),
  };
}
