import { useState } from "react";

/** Apertura de creación y edición para formularios cortos en dialog. */
export function useEditorDialog<T>() {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T>();

  const openCreate = () => {
    setEditingItem(undefined);
    setOpen(true);
  };

  const openEdit = (item: T) => {
    setEditingItem(item);
    setOpen(true);
  };

  const onOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setEditingItem(undefined);
  };

  return { open, editingItem, openCreate, openEdit, onOpenChange };
}
