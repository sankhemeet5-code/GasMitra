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
        "h-10 w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none transition-[border-color,box-shadow,background-color] duration-150 ease-in-out focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/45",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
