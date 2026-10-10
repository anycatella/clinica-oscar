'use client';
import { useState } from 'react';
import { buildShareLink, parseSharedLink, rememberLinkKey } from '../lib/client/link-key';
export function AccessRecovery({onRecover}:{onRecover:()=>void}){
 const [link,setLink]=useState(''),[error,setError]=useState('');
 return <section className="panel access-recovery"><h2>Ingresá a la carpeta de Oscar</h2><p>Pegá el enlace completo que recibiste. Incluye la clave para consultar y guardar documentos, sin crear una cuenta.</p><form onSubmit={event=>{event.preventDefault();const key=parseSharedLink(link,window.location.origin);if(!key){setError('Este enlace está incompleto o pertenece a otra carpeta. Copiá el enlace completo desde Compartir.');return;}rememberLinkKey(key);window.history.replaceState(null,'',buildShareLink(window.location.origin,key));setError('');onRecover();}}><label>Enlace compartido<input type="url" autoComplete="off" required value={link} placeholder="Pegá aquí el enlace completo" onChange={event=>setLink(event.target.value)}/></label>{error&&<p role="alert" className="error-message">{error}</p>}<button className="primary" type="submit">Entrar a mi carpeta</button></form><p className="small muted">Conservá este enlace para abrir la carpeta en otro celular, tablet o computadora.</p></section>;
}
