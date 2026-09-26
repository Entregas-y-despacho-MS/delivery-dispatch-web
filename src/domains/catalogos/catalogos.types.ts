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
