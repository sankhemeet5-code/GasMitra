import { cn } from "@/lib/utils";
import { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-400 transition-[border-color,box-shadow,background-color] duration-150 ease-in-out focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/45",
        className
      )}
      {...props}
    />
  );
}
