import { Pencil, UserX } from "lucide-react";

import { DataTable, type Column } from "@/shared/components/common/data-table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import type { Usuario } from "../usuarios.types";

interface UsuariosTableProps {
  usuarios: Usuario[];
  loading: boolean;
  onEditar: (usuario: Usuario) => void;
  onDesactivar: (usuario: Usuario) => void;
}

/** Tabla básica de usuarios. Los filtros por rol y estado y la paginación son de la ES-20. */
export function UsuariosTable({ usuarios, loading, onEditar, onDesactivar }: UsuariosTableProps) {
  const columnas: Column<Usuario>[] = [
    { header: "Nombre", cell: "nombreCompleto" },
    { header: "Usuario", cell: "username" },
    { header: "Correo", cell: (u) => u.email ?? <span className="text-muted-foreground">—</span> },
    { header: "Rol", cell: (u) => u.rol.etiqueta },
    {
      header: "Estado",
      cell: (u) => <Badge variant={u.activo ? "default" : "secondary"}>{u.activo ? "Activo" : "Inactivo"}</Badge>,
    },
    {
      header: "Acciones",
      className: "w-28 text-right",
      cell: (u) => {
        // La cuenta root es del sistema: no se edita ni se desactiva desde esta pantalla.
        const esRoot = u.rol.nombre === "root";
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEditar(u)} disabled={esRoot} aria-label={`Editar a ${u.nombreCompleto}`}>
              <Pencil className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDesactivar(u)}
              // Una cuenta ya inactiva no tiene nada más que desactivar.
              disabled={esRoot || !u.activo}
              aria-label={`Desactivar a ${u.nombreCompleto}`}
              className="text-destructive hover:text-destructive"
            >
              <UserX className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable columns={columnas} data={usuarios} loading={loading} emptyMessage="Aún no hay usuarios registrados." />
  );
}
