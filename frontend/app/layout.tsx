import "./globals.css";
import Image from "next/image";

export const metadata = {
    title: "Medical AI Scribe",
    description: "Paste a transcript and process it",
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
                <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
                    <a className="hover:text-slate-900" href="#">Docs</a>
                    <a className="hover:text-slate-900" href="#">Changelog</a>
                    <a className="hover:text-slate-900" href="#">Support</a>
                </nav>
            </header>
            {children}
            <footer className="mt-16 border-t border-slate-200 pt-6 text-xs text-slate-500">
                <p>
                    Built with Next.js & Tailwind. Ensure your backend allows CORS from http://localhost:3000.
                </p>
            </footer>
        </div>
        </body>
        </html>
    );
}
