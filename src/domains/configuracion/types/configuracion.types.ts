/** Parámetro del sistema tal como lo devuelve GET /settings. El valor siempre llega como texto. */
export interface ParametroSistema {
  key: string;
  /** "15", "08:00", "1,2,3,4,5"… Vacío cuando Operaciones todavía no lo definió. */
  value: string;
  description: string | null;
  updatedAt: string;
}

/** Claves operativas que edita el coordinador (ST-57.1, RF-A10). La ventana express no se muestra (D-16). */
export type ClaveParametroOperativo =
  // Ventanas
  | "morning_window_start"
  | "morning_window_end"
  | "afternoon_window_start"
  | "afternoon_window_end"
  | "slot_duration_minutes"
  // Plazo
  | "service_min_operating_days"
  | "service_max_operating_days"
  | "promise_response_window_minutes"
  // Planificación
  | "plan_generation_times"
  | "plan_horizon_days"
  | "plan_working_days"
  | "plan_non_working_dates"
  | "stop_service_minutes"
  | "planning_margin_pct"
  // Día anterior
  | "route_cutoff_time"
  | "final_review_end_time"
  | "route_reminder_time"
  // Día de salida
  | "final_review_escalation_time"
  | "warehouse_prep_end_time"
  | "warehouse_prep_lead_minutes"
  // Cliente
  | "max_reschedule_attempts"
  | "reschedule_window_days"
  | "reschedule_code_expiry_minutes"
  // Entregas
  | "max_wait_time_min"
  | "max_delivery_attempts";

/** Valores del formulario: un texto por clave, igual que en el back. */
export type ParametrosOperativos = Record<ClaveParametroOperativo, string>;

/** Ventana general de reparto: no se edita aquí, pero las ventanas de mañana y tarde deben caer dentro. */
export interface VentanaGeneral {
  delivery_window_start: string;
  delivery_window_end: string;
}

/** Cómo marcar el valor actual según la descripción que guarda el back. */
export type EstadoValorParametro = "definido" | "propuesto" | "sin-definir";

/** Umbrales de alerta del supervisor (ST-67.2, RF-A16): GET y PUT /settings/alert-thresholds. */
export interface UmbralesAlerta {
  /** % mínimo de entregas a tiempo; por debajo se alerta (0 a 100). */
  slaAlertMinOnTimePct: number;
  /** Minutos sin señal GPS de un repartidor antes de alertar (1 a 1440). */
  gpsStaleAlertMinutes: number;
  /** Incidencias de un repartidor en un día antes de alertar (1 a 100). */
  driverIncidentAlertPerDay: number;
}

/** Lo que devuelve el back: los tres umbrales y la fecha del último cambio. */
export interface UmbralesAlertaGuardados extends UmbralesAlerta {
  updatedAt: string;
}

export type CampoUmbral = keyof UmbralesAlerta;
