import * as React from "react";

export function Alert({children, className = ""}: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 ${className}`}>
            <div className="flex items-start gap-3">{children}</div>
        </div>
    );
}

export function AlertTitle({children}: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2">
            <svg className="h-5 w-5 mt-0.5 text-red-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd"
                      d="M18 10A8 8 0 11.001 9.999 8 8 0 0118 10zm-8-5a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-4.5A.75.75 0 0010 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"/>
            </svg>
            <p className="font-medium">{children}</p>
        </div>
    );
}

export function AlertDescription({children}: { children: React.ReactNode }) {
    return <p className="text-sm">{children}</p>;
}
