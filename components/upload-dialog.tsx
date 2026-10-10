'use client';
import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { Modal } from './modal';
import { DocumentReview } from './document-review';
import { extractDocument } from '../lib/client/extract-document';
import { preserveAndReadUpload } from '../lib/client/preserve-upload';
import { parseReport } from '../lib/domain/parse-report';
import type { DocumentRecord, DocumentMetadata, DocumentCategory } from '../lib/domain/types';
export function UploadDialog({onClose,onSaved,replacement}:{onClose:()=>void;onSaved:(message:string,document?:DocumentRecord)=>void;replacement?:DocumentRecord}){
 const [allowed,setAllowed]=useState(false),[files,setFiles]=useState<File[]>([]),[index,setIndex]=useState(0),[draft,setDraft]=useState<DocumentMetadata|null>(null),[warnings,setWarnings]=useState<string[]>([]),[progress,setProgress]=useState(0),[reading,setReading]=useState(false),[error,setError]=useState('');const controller=useRef<AbortController|null>(null);const [folder,setFolder]=useState<DocumentCategory|''>('');
 async function read(list:File[],i:number){
  const file=list[i];setError('');if(file.size>25*1024*1024){setError('El archivo pesa más de 25 MB. Elegí otro archivo.');return;}setReading(true);setDraft(null);setProgress(0);controller.current=new AbortController();
  let metadata:DocumentMetadata|null=null;
  try{
   if(!replacement){
    const result=await preserveAndReadUpload(file,setProgress,controller.current.signal,()=>onSaved('Original guardado. Completando la lectura…'),folder||undefined);
    if(controller.current.signal.aborted)return;
    onSaved(result.warnings.length?result.warnings.join(' '):result.duplicate?'El documento ya estaba guardado. Abrimos su informe.':'Documento guardado y leído automáticamente.',i+1===list.length?result.document:undefined);
    if(i+1<list.length){setIndex(i+1);await read(list,i+1);}else onClose();
   }else{
    const extracted=await extractDocument(file,setProgress,controller.current.signal);const data=parseReport(extracted.text,file.name);
    metadata={title:data.title,category:data.categorySuggestion??replacement.category,medicalDate:data.medicalDateSuggestion??'',institution:data.institution,subcategory:data.subcategory,summary:data.summary,conclusions:data.conclusions,extractionConfidence:data.extractionConfidence,measurements:data.measurements};
    setWarnings(extracted.warnings);setDraft(metadata);
   }
  }catch(e){if(!controller.current?.signal.aborted){const message=e instanceof Error?e.message:'No pudimos guardar el documento.';if(metadata){setWarnings([message+' Tus datos están conservados. Podés reintentar guardar.']);setDraft(metadata);}else setError(message);}}
  finally{setReading(false);}
 }
 function close(){controller.current?.abort();onClose();}
 if(draft&&files[index])return <DocumentReview key={files[index].name+index} initial={draft} file={files[index]} existing={replacement} replacement={!!replacement} warnings={warnings} onClose={()=>{if(index+1<files.length){setIndex(index+1);void read(files,index+1);}else close();}} onSaved={(message,document)=>{onSaved(message,index+1===files.length?document:undefined);if(index+1<files.length){setIndex(index+1);void read(files,index+1);}else close();}}/>;
 return <Modal title={replacement?'Reemplazar archivo':'Cargar documento'} onClose={close}><div className="upload-content"><ol className="upload-steps" aria-label="Pasos para guardar un documento"><li aria-current="step"><strong>1. Elegir documento</strong></li><li>2. Leer y guardar</li><li>3. Ver informe</li></ol><div className="notice"><strong>Carpeta personal de Oscar</strong><p>Los documentos se guardarán en esta carpeta. Las personas con el enlace podrán consultarlos, descargarlos y modificarlos.</p><details><summary>Privacidad y uso permitido</summary><p>Uso personal autorizado. No cargues datos sujetos a HIPAA ni documentos de terceros sin permiso. <a href="https://openai.com/policies/chatgpt-sites-terms/" target="_blank" rel="noreferrer">Condiciones del alojamiento</a></p></details></div><fieldset className="upload-folder"><legend>¿Dónde guardar el documento?</legend><label className="check-label"><input type="radio" name="upload-folder" checked={folder===''} disabled={reading} onChange={()=>setFolder('')}/>Detectar automáticamente</label><label className="check-label"><input type="radio" name="upload-folder" checked={folder==='analysis'} disabled={reading} onChange={()=>setFolder('analysis')}/>Análisis de laboratorio</label><label className="check-label"><input type="radio" name="upload-folder" checked={folder==='study'} disabled={reading} onChange={()=>setFolder('study')}/>Estudios médicos · imágenes, biopsias y otros informes</label></fieldset><label className="check-label upload-consent"><input type="checkbox" checked={allowed} disabled={reading} onChange={e=>setAllowed(e.target.checked)}/>Tengo autorización para guardar estos documentos personales de Oscar y compartirlos mediante el enlace.</label><label className={`upload-zone ${!allowed?'disabled':''}`}><UploadCloud size={40}/><strong>{reading?'Leyendo y guardando…':'Elegir documento'}</strong><span>Buscá un PDF o una foto en tu celular, tablet o computadora.</span><span>PDF, JPG y PNG · hasta 25 MB por archivo</span><input type="file" aria-label="Elegir un PDF o una foto" accept="application/pdf,image/jpeg,image/png" multiple={!replacement} disabled={!allowed||reading} onChange={e=>{const list=Array.from(e.target.files??[]);if(list.length){setFiles(list);setIndex(0);void read(list,0);}}}/></label>{reading&&<div aria-live="polite"><p>Documento {index+1} de {files.length}: {files[index]?.name}</p><p>Completamos los datos, guardamos el original y preparamos su informe. Podés corregir los datos después de la carga.</p><progress aria-label="Progreso de lectura" max={1} value={progress}/><button onClick={close}>Cerrar ventana</button></div>}{error&&<p className="error-message" role="alert">{error}</p>}<p className="muted">Primero guardamos el original y después leemos sus datos. Si no podemos identificar la fecha, el archivo queda guardado con fecha pendiente.</p></div></Modal>;
}
