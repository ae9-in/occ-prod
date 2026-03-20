"use client";

import { type MouseEvent, type ReactNode, useEffect } from "react";

type ModalShellProps = {
  children: ReactNode;
  className?: string;
  closeOnBackdrop?: boolean;
  onClose?: () => void;
};

export default function ModalShell({
  children,
  className = "",
  closeOnBackdrop = true,
  onClose,
}: ModalShellProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdrop || !onClose) return;
    if (event.target !== event.currentTarget) return;
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="flex min-h-full items-start justify-center py-6 sm:items-center">
        <div className={className}>{children}</div>
      </div>
    </div>
  );
}
