import * as React from "react";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>
  );
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="p-5 border-b border-slate-200/80">{children}</div>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold tracking-tight">{children}</h2>;
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-slate-600">{children}</p>;
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="p-5">{children}</div>;
}
