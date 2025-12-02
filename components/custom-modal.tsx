"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils"; // optional utility for classNames

interface CustomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

interface CustomModalHeaderProps {
  children: ReactNode;
  showClose?: boolean;
  onClose?: () => void;
}

interface CustomModalBodyProps {
  children: ReactNode;
}

interface CustomModalFooterProps {
  children: ReactNode;
}

export function CustomModal({ open, onOpenChange, children, className }: CustomModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 "
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(
          "bg-white rounded-2xl shadow-lg max-w-lg w-full p-6 relative",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function CustomModalHeader({ children, showClose = true, onClose }: CustomModalHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold">{children}</h2>
      {showClose && (
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X />
        </button>
      )}
    </div>
  );
}

export function CustomModalBody({ children }: CustomModalBodyProps) {
  return <div className="space-y-4">{children}</div>;
}

export function CustomModalFooter({ children }: CustomModalFooterProps) {
  return <div className="mt-6">{children}</div>;
}
