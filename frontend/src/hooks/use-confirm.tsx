'use client';

import { useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function useConfirm(defaultMessage?: string) {
  const resolver = useRef<(v: boolean) => void | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(defaultMessage || '该邮箱已存在，是否覆盖现有账户？');

  const confirm = (msg?: string) => {
    if (msg) setMessage(msg);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  };

  const handleCancel = () => {
    setOpen(false);
    resolver.current?.(false);
  };

  const handleConfirm = () => {
    setOpen(false);
    resolver.current?.(true);
  };

  const ConfirmDialog = (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogTitle>确认覆盖</AlertDialogTitle>
        <AlertDialogDescription>{message}</AlertDialogDescription>
        <div className="flex gap-2 justify-end">
          <AlertDialogCancel onClick={handleCancel}>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>覆盖</AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, ConfirmDialog };
}
