import type {DocumentMetadata,DocumentRecord} from '../domain/types';
import {validateDate} from '../domain/calendar';
import {apiFetch} from './api';
export function canSaveAutomatically(metadata:DocumentMetadata,warnings:string[]){return !!metadata.title.trim()&&validateDate(metadata.medicalDate)&&warnings.length===0;}
export async function saveUpload(file:File,metadata:DocumentMetadata,existing?:DocumentRecord){
 const body=new FormData();body.set('file',file);body.set('metadata',JSON.stringify(metadata));body.set('personalUseConfirmed','true');if(existing)body.set('expectedVersion',String(existing.version));
 return apiFetch<{document:DocumentRecord;duplicate?:boolean;cleanupPending?:boolean}>(existing?`/api/documents/${existing.id}/replacement`:'/api/documents',{method:'POST',body});
}
