import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-in-out disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent)] text-slate-950 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50",
        secondary:
          "bg-slate-100/10 text-slate-100 hover:bg-slate-100/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40",
        outline:
          "border border-slate-700 bg-transparent text-slate-100 hover:bg-slate-100/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40",
        danger:
          "bg-[var(--danger)] text-white hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/45",
        ghost:
          "bg-transparent text-slate-200 hover:border hover:border-slate-600 hover:bg-slate-100/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/35",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
