import { cn } from "@/lib/utils";
import { SelectHTMLAttributes } from "react";

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none ring-teal-400 transition focus:ring-2",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
