import type {DocumentMetadata,DocumentRecord,DocumentCategory} from '../domain/types';
import {saveUpload} from './save-upload';
import {apiFetch} from './api';
import {extractDocument} from './extract-document';
import {parseReport} from '../domain/parse-report';
export async function preserveAndReadUpload(file:File,onProgress:(value:number)=>void,signal?:AbortSignal,onPreserved?:(record:DocumentRecord)=>void,selectedCategory?:DocumentCategory){
 const base:DocumentMetadata={title:file.name.replace(/\.\w+$/,'').slice(0,180)||'Documento médico',category:selectedCategory??parseReport('',file.name).categorySuggestion??'study',medicalDate:'',institution:null,subcategory:null,summary:null,conclusions:null,measurements:[],extractionConfidence:{documentDate:'low'}};
 const saved=await saveUpload(file,base);
 const hint=selectedCategory??parseReport('',file.name).categorySuggestion;
 if(saved.duplicate&&hint&&hint!==saved.document.category)saved.document=await apiFetch<DocumentRecord>(`/api/documents/${saved.document.id}`,{method:'PATCH',body:JSON.stringify({expectedVersion:saved.document.version,metadata:{...saved.document,category:hint}})});
 onPreserved?.(saved.document);
 let metadata=base;
 try{
  const extracted=await extractDocument(file,onProgress,signal);const data=parseReport(extracted.text,file.name);
  if(saved.duplicate&&saved.document.medicalDate){
   const category=selectedCategory??data.categorySuggestion??saved.document.category;
   if(category===saved.document.category)return {...saved,warnings:[]};
   const document=await apiFetch<DocumentRecord>(`/api/documents/${saved.document.id}`,{method:'PATCH',body:JSON.stringify({expectedVersion:saved.document.version,metadata:{...saved.document,category}})});
   return {document,duplicate:true,warnings:[]};
  }
  metadata={title:data.title,category:selectedCategory??data.categorySuggestion??base.category,medicalDate:data.medicalDateSuggestion??'',institution:data.institution,subcategory:data.subcategory,summary:data.summary,conclusions:data.conclusions,measurements:data.measurements,extractionConfidence:data.extractionConfidence};
  const document=await apiFetch<DocumentRecord>(`/api/documents/${saved.document.id}`,{method:'PATCH',body:JSON.stringify({expectedVersion:saved.document.version,metadata})});
  return {document,duplicate:saved.duplicate,warnings:[...extracted.warnings,...(!selectedCategory&&!data.categorySuggestion?['No se pudo identificar el tipo con certeza. El original está en Estudios; podés cambiar la carpeta desde «Editar datos».']:[]),...(!metadata.medicalDate?['Original guardado. No se identificó una fecha médica con certeza; podés completarla desde «Editar datos».']:[])]};
 }catch(error){return {document:saved.document,duplicate:saved.duplicate,warnings:['El original quedó guardado. '+(error instanceof Error?error.message:'No pudimos completar la lectura.')+' Podés reintentar cargándolo de nuevo o completar los datos desde «Editar datos».']};}
}
