"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function SimpleDialog({
  open,
  title,
  description,
  onClose,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="w-full rounded-t-2xl border border-slate-700 bg-slate-900 p-6 sm:max-w-md sm:rounded-xl">
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        <div className="mt-2 text-sm text-slate-300">{description}</div>
        <Button className="mt-5 w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
