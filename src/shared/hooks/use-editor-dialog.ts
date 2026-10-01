import { useState } from "react";

interface EditorDialogOptions {
  busy?: boolean;
}

/** Apertura y cierre de los formularios de creación y edición. */
export function useEditorDialog<T>({ busy = false }: EditorDialogOptions = {}) {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T>();
  const [dirty, setDirty] = useState(false);

  const openCreate = () => {
    setEditingItem(undefined);
    setDirty(false);
    setOpen(true);
  };

  const openEdit = (item: T) => {
    setEditingItem(item);
    setDirty(false);
    setOpen(true);
  };

  const finish = () => {
    setOpen(false);
    setEditingItem(undefined);
    setDirty(false);
  };

  const onOpenChange = (nextOpen: boolean) => {
    if (busy) return;
    if (nextOpen) setOpen(true);
    else finish();
  };

  return { open, editingItem, dirty, setDirty, openCreate, openEdit, onOpenChange, finish };
}
