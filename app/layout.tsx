import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Clínica Oscar · Historial médico',description:'Documentos personales, comparativas y calendario en una carpeta accesible por enlace.',manifest:'/manifest.webmanifest',robots:{index:false,follow:false},icons:{icon:'/favicon.svg',apple:'/icons/icon-192.png'},other:{'theme-color':'#164f49'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>;}
