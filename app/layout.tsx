import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'ETAL Connect — O encontro começa aqui',description:'Estudo visual de um aplicativo de evento para o ETAL. Identidade inspirada no NADIC, programação, minicursos, materiais e credencial. Mockup independente.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR"><body>{children}</body></html>}
