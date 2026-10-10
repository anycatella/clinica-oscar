import type {DocumentMetadata,DocumentRecord} from '../domain/types';
import {saveUpload} from './save-upload';
import {apiFetch} from './api';
import {extractDocument} from './extract-document';
import {parseReport} from '../domain/parse-report';
export async function preserveAndReadUpload(file:File,onProgress:(value:number)=>void,signal?:AbortSignal,onPreserved?:(record:DocumentRecord)=>void){
 const base:DocumentMetadata={title:file.name.replace(/\.\w+$/,'').slice(0,180)||'Documento médico',category:'analysis',medicalDate:'',institution:null,subcategory:null,summary:null,conclusions:null,measurements:[],extractionConfidence:{documentDate:'low'}};
 const saved=await saveUpload(file,base);onPreserved?.(saved.document);
 if(saved.duplicate&&saved.document.medicalDate)return {...saved,warnings:[]};
 let metadata=base;
 try{
  const extracted=await extractDocument(file,onProgress,signal);const data=parseReport(extracted.text);
  metadata={title:data.title,category:data.categorySuggestion??'analysis',medicalDate:data.medicalDateSuggestion??'',institution:data.institution,subcategory:data.subcategory,summary:data.summary,conclusions:data.conclusions,measurements:data.measurements,extractionConfidence:data.extractionConfidence};
  const document=await apiFetch<DocumentRecord>(`/api/documents/${saved.document.id}`,{method:'PATCH',body:JSON.stringify({expectedVersion:saved.document.version,metadata})});
  return {document,duplicate:saved.duplicate,warnings:[...extracted.warnings,...(!metadata.medicalDate?['Original guardado. No se identificó una fecha médica con certeza; podés completarla desde «Editar datos».']:[])]};
 }catch(error){return {document:saved.document,duplicate:saved.duplicate,warnings:['El original quedó guardado. '+(error instanceof Error?error.message:'No pudimos completar la lectura.')+' Podés reintentar cargándolo de nuevo o completar los datos desde «Editar datos».']};}
}
