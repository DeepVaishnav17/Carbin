import './globals.css';
import Link from 'next/link';

export const metadata = {
    title: 'ReAtmos Next',
    description: 'Pollution Monitoring',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <nav>
                    <Link href="/">ReAtmos</Link>
                    <Link href="/earth">Earth</Link>
                </nav>
                <main style={{ padding: '1rem', height: 'calc(100vh - 60px)' }}>
                    {children}
                </main>
            </body>
        </html>
    )
}
