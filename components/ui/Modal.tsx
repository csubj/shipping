import * as Dialog from "@radix-ui/react-dialog";
import React from "react";
import { cn } from "@/lib/cn";

export type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function Modal({ open, onOpenChange, title, description, children, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="shipping-overlay" />
        <Dialog.Content
          className={cn(
            "shipping-modal fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px]",
            className,
          )}
        >
          {title && (
            <Dialog.Title className="text-lg font-semibold mb-1">{title}</Dialog.Title>
          )}
          {description && (
            <Dialog.Description className="text-sm text-[var(--muted)] mb-3">
              {description}
            </Dialog.Description>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
