import type { ClaveParametroOperativo } from "./types/configuracion.types";

export interface CampoParametro {
  clave: ClaveParametroOperativo;
  etiqueta: string;
  /** Ayuda corta bajo el campo: qué controla y en qué formato va. */
  ayuda: string;
  /** "hora" usa <input type="time">, "numero" un entero con su unidad y "texto" las listas separadas por comas. */
  tipo: "hora" | "numero" | "texto";
  unidad?: string;
  ejemplo?: string;
}

export interface GrupoParametros {
  id: string;
  titulo: string;
  descripcion: string;
  campos: CampoParametro[];
}

/** Los 7 grupos de la tarjeta ST-57.1, en el mismo orden. La ventana express no se muestra (D-16). */
export const GRUPOS_PARAMETROS: GrupoParametros[] = [
  {
    id: "ventanas",
    titulo: "Ventanas de entrega",
    descripcion: "Franjas que se ofrecen al cliente. Deben caer dentro del horario general de reparto.",
    campos: [
      { clave: "morning_window_start", etiqueta: "Inicio de la mañana", ayuda: "Primera hora de la franja de la mañana.", tipo: "hora" },
      { clave: "morning_window_end", etiqueta: "Fin de la mañana", ayuda: "Debe ser posterior al inicio.", tipo: "hora" },
      { clave: "afternoon_window_start", etiqueta: "Inicio de la tarde", ayuda: "Primera hora de la franja de la tarde.", tipo: "hora" },
      { clave: "afternoon_window_end", etiqueta: "Fin de la tarde", ayuda: "Debe ser posterior al inicio.", tipo: "hora" },
      { clave: "slot_duration_minutes", etiqueta: "Duración de cada franja", ayuda: "Tamaño de los bloques que ve el cliente.", tipo: "numero", unidad: "min" },
    ],
  },
  {
    id: "plazo",
    titulo: "Plazo de servicio",
    descripcion: "Días hábiles en los que se puede prometer la entrega.",
    campos: [
      { clave: "service_min_operating_days", etiqueta: "Plazo mínimo", ayuda: "Días hábiles, de 1 a 7.", tipo: "numero", unidad: "días" },
      { clave: "service_max_operating_days", etiqueta: "Plazo máximo", ayuda: "No puede ser menor que el mínimo.", tipo: "numero", unidad: "días" },
      { clave: "promise_response_window_minutes", etiqueta: "Tiempo para responder la promesa", ayuda: "Cuánto tiene el cliente para aceptar o cambiar la fecha.", tipo: "numero", unidad: "min" },
    ],
  },
  {
    id: "planificacion",
    titulo: "Planificación",
    descripcion: "Cuándo y cómo se genera el plan automático de rutas.",
    campos: [
      { clave: "plan_generation_times", etiqueta: "Horas de generación", ayuda: "Horas separadas por comas, en hora de Bolivia.", tipo: "texto", ejemplo: "08:30, 13:30" },
      { clave: "plan_horizon_days", etiqueta: "Horizonte del plan", ayuda: "Días que abarca cada plan.", tipo: "numero", unidad: "días" },
      { clave: "plan_working_days", etiqueta: "Días laborables", ayuda: "1 es lunes y 7 domingo, separados por comas.", tipo: "texto", ejemplo: "1,2,3,4,5" },
      { clave: "plan_non_working_dates", etiqueta: "Feriados", ayuda: "Fechas AAAA-MM-DD separadas por comas. Puede quedar vacío.", tipo: "texto", ejemplo: "2026-12-25" },
      { clave: "stop_service_minutes", etiqueta: "Tiempo por parada", ayuda: "Promedio de atención en cada entrega. Sin este valor el generador no corre.", tipo: "numero", unidad: "min" },
      { clave: "planning_margin_pct", etiqueta: "Margen de planificación", ayuda: "Holgura de capacidad. Sin este valor el generador no corre.", tipo: "numero", unidad: "%" },
    ],
  },
  {
    id: "dia-anterior",
    titulo: "Día anterior a la salida",
    descripcion: "Cadena de horas: corte de rutas, luego fin de la revisión y luego recordatorio.",
    campos: [
      { clave: "route_cutoff_time", etiqueta: "Corte de rutas", ayuda: "Hasta esta hora entran pedidos al lote del día siguiente.", tipo: "hora" },
      { clave: "final_review_end_time", etiqueta: "Fin de la revisión final", ayuda: "Posterior al corte de rutas.", tipo: "hora" },
      { clave: "route_reminder_time", etiqueta: "Recordatorio de ruta", ayuda: "Posterior al fin de la revisión.", tipo: "hora" },
    ],
  },
  {
    id: "dia-salida",
    titulo: "Día de salida",
    descripcion: "Cadena de horas independiente de la del día anterior: escalamiento y luego fin de preparación.",
    campos: [
      { clave: "final_review_escalation_time", etiqueta: "Escalamiento de la revisión", ayuda: "Si el lote no se aprobó, se avisa al responsable a esta hora.", tipo: "hora" },
      { clave: "warehouse_prep_end_time", etiqueta: "Fin de preparación en Almacén", ayuda: "Posterior al escalamiento.", tipo: "hora" },
      { clave: "warehouse_prep_lead_minutes", etiqueta: "Anticipación de preparación", ayuda: "Minutos que Almacén necesita antes de la salida.", tipo: "numero", unidad: "min" },
    ],
  },
  {
    id: "cliente",
    titulo: "Cliente",
    descripcion: "Límites para que el cliente reprograme su entrega.",
    campos: [
      { clave: "max_reschedule_attempts", etiqueta: "Reprogramaciones máximas", ayuda: "Cuántas veces puede cambiar la fecha.", tipo: "numero", unidad: "veces" },
      { clave: "reschedule_window_days", etiqueta: "Ventana para reprogramar", ayuda: "Días disponibles para elegir una nueva fecha.", tipo: "numero", unidad: "días" },
      { clave: "reschedule_code_expiry_minutes", etiqueta: "Vigencia del código", ayuda: "Minutos de validez del código para reprogramar.", tipo: "numero", unidad: "min" },
    ],
  },
  {
    id: "entregas",
    titulo: "Entregas",
    descripcion: "Reglas que aplica el repartidor en cada parada.",
    campos: [
      { clave: "max_wait_time_min", etiqueta: "Espera máxima en el punto", ayuda: "Minutos que el repartidor espera al cliente.", tipo: "numero", unidad: "min" },
      { clave: "max_delivery_attempts", etiqueta: "Intentos de entrega", ayuda: "Intentos antes de dar el pedido por no entregado.", tipo: "numero", unidad: "intentos" },
    ],
  },
];
