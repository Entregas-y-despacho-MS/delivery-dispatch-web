export interface Zona {
  id: number;
  code: string;
  name: string;
  estimatedTimeMin: number;
  createdAt: string;
}

export type ZonaListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type ZonaInput = {
  code: string;
  name: string;
  estimatedTimeMin: number;
};

export interface DeliveryZonesResponse {
  data: Zona[];
  meta: {
    page: number;
    limit: number;
    pages: number;
    total: number;
  };
}

export interface NivelServicio {
  id: number;
  name: string;
  description: string | null;
  targetTimeMin: number;
  priorityLevel: number;
  active: boolean;
  createdAt: string;
}

export type NivelServicioListParams = {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
};

export type NivelServicioCreate = {
  name: string;
  description?: string;
  targetTimeMin: number;
  priorityLevel: number;
};

export type NivelServicioUpdate = Partial<Omit<NivelServicioCreate, "description">> & {
  description?: string | null;
  active?: boolean;
};

/** Motivo de incidencia en reparto (RF-A32). Backend: /incident-reasons. No tiene borrado: se desactiva. */
export interface MotivoIncidencia {
  id: number;
  code: string;
  name: string;
  /** true = la app del repartidor exige una foto de evidencia antes de reportar la incidencia. */
  requiresEvidence: boolean;
  /** false = ya no se ofrece para nuevas incidencias; las registradas no cambian. */
  active: boolean;
  createdAt: string;
}

export type MotivoIncidenciaListParams = {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
};

/** Al crear, el backend no acepta `active`: el motivo nace activo. */
export type MotivoIncidenciaCreate = {
  code: string;
  name: string;
  requiresEvidence: boolean;
};

export type MotivoIncidenciaUpdate = Partial<MotivoIncidenciaCreate> & {
  active?: boolean;
};
