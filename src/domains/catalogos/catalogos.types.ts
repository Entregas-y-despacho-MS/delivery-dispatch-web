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

export type NivelServicioPriority = "high" | "medium" | "low";

export interface NivelServicio {
  id: number;
  name: string;
  description: string;
  targetTimeMinutes: number;
  priority: NivelServicioPriority;
  active: boolean;
}
