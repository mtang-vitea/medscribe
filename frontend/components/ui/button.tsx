import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants: Record<string, string> = {
      primary: "bg-indigo-600 text-white shadow hover:bg-indigo-700 focus:ring-indigo-600",
      secondary:
        "bg-white text-slate-900 border border-slate-300 shadow-sm hover:bg-slate-50 focus:ring-slate-400",
      ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-300",
    };
    return (
      <button ref={ref} className={`${base} ${variants[variant]} ${className}`} {...props} />
    );
  }
);
Button.displayName = "Button";
