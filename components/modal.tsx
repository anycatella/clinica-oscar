'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Modal({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}){const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[]);return <dialog ref={ref} className={`modal ${wide?'modal-wide':''}`} onCancel={event=>{event.preventDefault();onClose();}} aria-label={title}><div className="modal-header"><h2>{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar ventana"><X size={24}/></button></div>{children}</dialog>;}
