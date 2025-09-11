// app.tsx (Next.js 13 App Router) or pages/_app.tsx (Pages Router)
import type { AppProps } from 'next/app';
import '../app/globals.css'; // import Tailwind CSS globally

export default function App({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />;
}
