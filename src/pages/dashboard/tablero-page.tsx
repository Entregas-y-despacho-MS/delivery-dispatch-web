import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

import { TableroKanban, useDispatchEvents, useTableroKanban } from "@/domains/despachos";
import { PageHeader } from "@/shared/components/common/page-header";

function fechaLocalActual() {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
}

export default function TableroPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState(fechaLocalActual);
  const [deliveryZoneId, setDeliveryZoneId] = useState("all");
  const [driverId, setDriverId] = useState("all");
  const [dispatchTypeId, setDispatchTypeId] = useState("all");
  const [logisticaInversa, setLogisticaInversa] = useState(false);
  const { connected } = useDispatchEvents();
  const params = useMemo(() => ({
    date,
    delivery_zone_id: deliveryZoneId === "all" ? undefined : Number(deliveryZoneId),
    driver_id: driverId === "all" ? undefined : Number(driverId),
    dispatch_type_id: dispatchTypeId === "all" ? undefined : Number(dispatchTypeId),
  }), [date, deliveryZoneId, driverId, dispatchTypeId]);
  const tablero = useTableroKanban(params, connected);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operación"
        title="Tablero de despachos"
        icon={LayoutDashboard}
        description="Sigue las órdenes de la jornada y revisa los lotes antes de asignarlos."
      />
      <TableroKanban
        date={date}
        onDateChange={setDate}
        deliveryZoneId={deliveryZoneId}
        onDeliveryZoneChange={setDeliveryZoneId}
        driverId={driverId}
        onDriverChange={setDriverId}
        dispatchTypeId={dispatchTypeId}
        onDispatchTypeChange={setDispatchTypeId}
        logisticaInversa={logisticaInversa}
        onLogisticaInversaChange={setLogisticaInversa}
        columns={tablero.data?.columns ?? []}
        isLoading={tablero.isLoading}
        isError={tablero.isError}
        isFetching={tablero.isFetching}
        socketConnected={connected}
        onRetry={() => void tablero.refetch()}
        onOpenReview={(batchId) => navigate(`/app/planificacion?loteId=${batchId}`)}
      />
    </div>
  );
}
