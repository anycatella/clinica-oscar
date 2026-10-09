import type { DataService, FileStorageService } from '../services/contracts';
import type { DocumentMetadata, DocumentRecord } from '../domain/types';
import { validateMetadata } from './validation';
import { sha256 } from './access';
import { AppError } from './errors';
function fileType(bytes:Uint8Array){if(new TextDecoder().decode(bytes.slice(0,5))==='%PDF-')return 'application/pdf';if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'image/jpeg';if([137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return 'image/png';throw new AppError('Elegí un PDF, JPG o PNG válido.');}
async function fileBytes(file:File){if(!file.size||file.size>25*1024*1024)throw new AppError('El archivo debe tener contenido y pesar hasta 25 MB.');const bytes=new Uint8Array(await file.arrayBuffer());return {bytes,mime:fileType(bytes),hash:await sha256(bytes)};}
function withMeasurements(metadata:DocumentMetadata,id:string){return metadata.measurements.map(m=>({...m,id:crypto.randomUUID(),documentId:id,medicalDate:metadata.medicalDate,reviewed:true}));}
export class DocumentService{
 constructor(private data:DataService,private files:FileStorageService){}
 listDocuments(){return this.data.listDocuments();}
 async saveDocument(file:File,input:DocumentMetadata){const metadata=validateMetadata(input);const {bytes,mime,hash}=await fileBytes(file);const existing=await this.data.findByHash(hash);if(existing){if(existing.state!=='confirmed')throw new AppError('Este archivo se está procesando. Intentá nuevamente en unos segundos.',409);return {document:existing.record,duplicate:true};}
 const id=crypto.randomUUID(),now=new Date().toISOString();const record:DocumentRecord={...metadata,measurements:withMeasurements(metadata,id),id,originalName:file.name.slice(0,240),mime,size:file.size,sha256:hash,fileKey:`originals/${id}`,uploadedAt:now,updatedAt:now,version:1,reviewStatus:'confirmed',processingStatus:'confirmed'};
 if(!await this.data.claimDocument(record)){const concurrent=await this.data.findByHash(hash);if(concurrent?.state==='confirmed')return {document:concurrent.record,duplicate:true};throw new AppError('Este archivo se está cargando desde otra ventana. Reintentá en unos segundos.',409);}
 try{await this.files.put(record.fileKey,bytes,mime);await this.data.activateDocument(id);}catch(error){await this.data.removeDocument(id);await this.files.remove(record.fileKey).catch(()=>{});throw error;}
 return {document:record,duplicate:false};}
 async getDocument(id:string){const r=await this.data.findDocument(id);if(!r)throw new AppError('No encontramos este documento.',404);return r;}
 async getFile(id:string){const r=await this.getDocument(id);const bytes=await this.files.get(r.fileKey);if(!bytes)throw new AppError('El original no está disponible. Intentá nuevamente.',404);return bytes;}
 async updateDocument(id:string,version:number,input:DocumentMetadata){const metadata=validateMetadata(input);const current=await this.getDocument(id);this.checkVersion(current,version);if(current.processingStatus==='deletion-pending')throw new AppError('La eliminación de este documento está pendiente.',409);const next={...current,...metadata,measurements:withMeasurements(metadata,id),version:current.version+1,updatedAt:new Date().toISOString()};if(!await this.data.updateDocument(next,version))throw this.conflict();return next;}
 async deleteDocument(id:string,version:number){let current=await this.getDocument(id);this.checkVersion(current,version);if(current.processingStatus!=='deletion-pending'){const pending={...current,processingStatus:'deletion-pending' as const,version:version+1,updatedAt:new Date().toISOString()};if(!await this.data.updateDocument(pending,version))throw this.conflict();current=pending;}
 await this.files.remove(current.fileKey);if(!await this.data.removeDocument(id,current.version))throw this.conflict();return true;}
 async replaceDocument(id:string,version:number,file:File,input:DocumentMetadata){const metadata=validateMetadata(input);const current=await this.getDocument(id);this.checkVersion(current,version);if(current.processingStatus!=='confirmed')throw new AppError('La eliminación de este documento está pendiente.',409);const {bytes,mime,hash}=await fileBytes(file);const duplicate=await this.data.findByHash(hash);if(duplicate&&duplicate.record.id!==id)throw new AppError('Ese original ya está guardado en otro documento.',409);
 const fileKey=`originals/${id}/${crypto.randomUUID()}`;await this.files.put(fileKey,bytes,mime);
 const next:DocumentRecord={...current,...metadata,measurements:withMeasurements(metadata,id),originalName:file.name.slice(0,240),mime,size:file.size,sha256:hash,fileKey,version:version+1,updatedAt:new Date().toISOString()};
 try{if(!await this.data.updateDocument(next,version))throw this.conflict();}catch(error){await this.files.remove(fileKey).catch(()=>{});throw error;}
 try{await this.files.remove(current.fileKey);}catch{return {document:next,cleanupPending:true};}return {document:next,cleanupPending:false};}
 private checkVersion(r:DocumentRecord,version:number){if(!Number.isInteger(version)||version!==r.version)throw this.conflict();}
 private conflict(){return new AppError('El documento cambió por otra persona. Revisá la versión actual antes de guardar.',409);}
}
