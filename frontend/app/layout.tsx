import "./globals.css";
import Image from "next/image";

export const metadata = {
    title: "Medical AI Scribe",
    description: "Paste a transcript and process it",
    icons: {
        icon: "/vitea-dark.jpeg",
        shortcut: "/vitea-dark.jpeg",
        apple: "/vitea-dark.jpeg",
    },
};

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900 antialiased">
        <div className="mx-auto max-w-6xl p-4 md:p-8">
            {/* App Shell */}
            <header className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Light/Dark logo switch */}
                    <Image
                        src="/vitea-light.png"
                        alt="Vitea logo"
                        width={32}
                        height={32}
                        className="block dark:hidden rounded"
                        priority
                    />
                    <Image
                        src="/vitea-dark.jpeg"
                        alt="Vitea logo"
                        width={32}
                        height={32}
                        className="hidden dark:block rounded"
                        priority
                    />
                    <span className="text-lg font-semibold tracking-tight">Medscribe</span>
                </div>
            </header>
            {children}
        </div>
        </body>
        </html>
    );
}
