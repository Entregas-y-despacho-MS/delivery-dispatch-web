import { CreditCard, MapPin, Package, Truck, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { formatearKilos } from "../despachos.format";
import { formatearCoordenadas, formatearFechaTurnoDetalle, formatearVentana, enlaceMapa } from "../despacho-detalle.format";
import type { DespachoDetalle } from "../types/despacho-detalle.types";

function Bloque({ titulo, icono, children }: { titulo: string; icono: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-2 rounded-lg border p-4" aria-label={titulo}>
      <h3 className="flex items-center gap-2 text-sm font-semibold">{icono}{titulo}</h3>
      <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[9rem_1fr]">{children}</dl>
    </section>
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  );
}

const vacio = <span className="text-muted-foreground">Sin dato</span>;

/** Pestaña General: datos del pedido, destino, bultos, repartidor, vehículo y etiqueta de pago. */
export function FichaGeneral({ despacho }: { despacho: DespachoDetalle }) {
  const { destination: destino, route: ruta } = despacho;
  const esRecojoProveedor = despacho.type.name === "supplier_pickup";
  const proveedor = despacho.supplierPickup;
  const coordenadas = formatearCoordenadas(destino.latitude, destino.longitude);
  const pesoTotal = despacho.packages.reduce((total, bulto) => total + bulto.grossWeightKg, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Bloque titulo={esRecojoProveedor ? "Orden de compra" : "Pedido"} icono={<CreditCard className="size-4" aria-hidden />}>
        <Dato etiqueta="Referencia">{despacho.sourceOrderRef}</Dato>
        <Dato etiqueta="Seguimiento">{despacho.trackingCode ?? vacio}</Dato>
        <Dato etiqueta="Tipo">{despacho.type.name}</Dato>
        {!esRecojoProveedor && <Dato etiqueta="Nivel de servicio">{despacho.serviceLevel?.name ?? vacio}</Dato>}
        <Dato etiqueta="Franja">{formatearVentana(despacho.scheduledWindowStart, despacho.scheduledWindowEnd)}</Dato>
        {!esRecojoProveedor && <Dato etiqueta="Política de evidencia">{despacho.evidencePolicy ?? vacio}</Dato>}
        {!esRecojoProveedor && <Dato etiqueta="Pago">{despacho.paymentStatusLabel ?? vacio}</Dato>}
      </Bloque>

      <Bloque titulo={esRecojoProveedor ? "Proveedor · punto de recojo" : "Destino"} icono={<MapPin className="size-4" aria-hidden />}>
        <Dato etiqueta="Dirección">{proveedor?.originAddress ?? destino.address}</Dato>
        <Dato etiqueta="Referencia">{proveedor?.originReference ?? destino.reference ?? vacio}</Dato>
        {!esRecojoProveedor && <Dato etiqueta="Zona">{destino.zone?.name ?? vacio}</Dato>}
        <Dato etiqueta={esRecojoProveedor ? "Contacto del proveedor" : "Contacto"}>{proveedor?.supplierContactName ?? destino.contactName ?? vacio}</Dato>
        <Dato etiqueta="Teléfono">{proveedor?.supplierContactPhone ?? destino.contactPhone ?? vacio}</Dato>
        <Dato etiqueta="Ubicación">
          {proveedor?.originLatitude !== null && proveedor?.originLatitude !== undefined && proveedor?.originLongitude !== null && proveedor?.originLongitude !== undefined
            ? <a className="underline underline-offset-4" href={enlaceMapa(proveedor.originLatitude, proveedor.originLongitude)} target="_blank" rel="noreferrer">{formatearCoordenadas(proveedor.originLatitude, proveedor.originLongitude)}</a>
            : coordenadas && destino.latitude !== null && destino.longitude !== null
              ? <a className="underline underline-offset-4" href={enlaceMapa(destino.latitude, destino.longitude)} target="_blank" rel="noreferrer">{coordenadas}</a>
              : <span className="text-muted-foreground">Sin geolocalizar</span>}
        </Dato>
        {esRecojoProveedor && <Dato etiqueta="Almacén destino">{proveedor?.destinationWarehouse ? `${proveedor.destinationWarehouse.name} · ${proveedor.destinationWarehouse.code}` : vacio}</Dato>}
      </Bloque>

      <Bloque titulo="Ruta" icono={<Truck className="size-4" aria-hidden />}>
        {ruta ? (
          <>
            <Dato etiqueta="Lote">{`#${ruta.id} · ${formatearFechaTurnoDetalle(ruta.shiftDate)}`}</Dato>
            <Dato etiqueta="Orden de visita">{ruta.sequenceOrder ?? vacio}</Dato>
            <Dato etiqueta="Repartidor">{ruta.driver?.fullName ?? <span className="text-muted-foreground">Sin asignar</span>}</Dato>
            <Dato etiqueta="Vehículo">{ruta.vehicle ? `${ruta.vehicle.plate} · ${ruta.vehicle.model}` : <span className="text-muted-foreground">Sin asignar</span>}</Dato>
          </>
        ) : (
          <Dato etiqueta="Ruta"><span className="text-muted-foreground">Todavía no está en una ruta</span></Dato>
        )}
      </Bloque>

      <Bloque titulo="Receptor" icono={<UserRound className="size-4" aria-hidden />}>
        <Dato etiqueta="Recibió">{despacho.receiver?.receiverName ?? <span className="text-muted-foreground">Nadie firmó todavía</span>}</Dato>
        {despacho.receiver?.receiverDocument && <Dato etiqueta="Documento">{despacho.receiver.receiverDocument}</Dato>}
      </Bloque>

      {esRecojoProveedor ? (
        <section className="space-y-2 rounded-lg border p-4 lg:col-span-2" aria-label="Productos esperados del proveedor">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Package className="size-4" aria-hidden />Productos del recojo</h3>
          {proveedor?.items.length ? <ul className="divide-y text-sm">{proveedor.items.map((item) => <li key={item.itemCode} className="flex flex-wrap justify-between gap-2 py-2"><span className="font-medium">{item.description || item.itemCode}<span className="ml-2 text-muted-foreground">({item.itemCode})</span></span><span className="text-muted-foreground">Esperado: {item.expectedQuantity} · Recogido: {item.receivedQuantity ?? "Pendiente"}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No hay productos esperados registrados.</p>}
          <p className="text-sm text-muted-foreground">Estimado: {proveedor?.estimatedPackages ?? 0} bultos · {formatearKilos(proveedor?.estimatedWeightKg ?? 0)} kg · {(proveedor?.estimatedVolumeM3 ?? 0).toLocaleString("es-BO")} m³</p>
        </section>
      ) : (
        <section className="space-y-2 rounded-lg border p-4 lg:col-span-2" aria-label="Bultos">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Package className="size-4" aria-hidden />{`Bultos (${despacho.packages.length}) · ${formatearKilos(pesoTotal)} kg`}</h3>
          {despacho.packages.length === 0 ? <p className="text-sm text-muted-foreground">El pedido no tiene bultos registrados.</p> : <ul className="divide-y text-sm">{despacho.packages.map((bulto) => <li key={bulto.id} className="flex flex-wrap justify-between gap-2 py-1.5"><span className="font-medium">{bulto.externalPackageId}</span><span className="text-muted-foreground">{`${bulto.lengthCm}×${bulto.widthCm}×${bulto.heightCm} cm · ${formatearKilos(bulto.grossWeightKg)} kg`}{bulto.handlingConditions.length > 0 && ` · ${bulto.handlingConditions.join(", ")}`}</span></li>)}</ul>}
        </section>
      )}
    </div>
  );
}
