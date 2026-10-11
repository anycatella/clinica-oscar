import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { DocumentService } from '../lib/server/documents';
import { SqlDataService } from '../lib/server/sql-data';
import type { DocumentMetadata } from '../lib/domain/types';
function sqliteBinding(){
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec('CREATE TABLE documents(id TEXT PRIMARY KEY,sha256 TEXT NOT NULL UNIQUE,medical_date TEXT NOT NULL,category TEXT NOT NULL,state TEXT NOT NULL,version INTEGER NOT NULL,payload TEXT NOT NULL); CREATE TABLE sessions(id TEXT PRIMARY KEY,number INTEGER NOT NULL UNIQUE,date TEXT NOT NULL,payload TEXT NOT NULL);');
 const prepare=(sql:string)=>{
  let args:unknown[]=[];
  const statement={bind:(...values:unknown[])=>{args=values;return statement;},first:async()=>sqlite.prepare(sql).get(...args as never[])??null,all:async()=>({results:sqlite.prepare(sql).all(...args as never[])}),run:async()=>{const result=sqlite.prepare(sql).run(...args as never[]);return {success:true,meta:{changes:Number(result.changes)}};}};return statement;
 };
 return {prepare};
}
class MemoryFiles{
 objects=new Map<string,Uint8Array>();failPut=false;failDelete=false;
 async put(key:string,bytes:Uint8Array){if(this.failPut)throw new Error('storage failed');this.objects.set(key,bytes.slice());}
 async get(key:string){return this.objects.get(key)??null;}
 async remove(key:string){if(this.failDelete)throw new Error('cleanup failed');this.objects.delete(key);}
}
const file=(name='prueba.pdf',content='%PDF-1.7\nDocumento sintético')=>new File([content],name,{type:'application/pdf'});
const metadata:DocumentMetadata={title:'Prueba sintética',category:'analysis',medicalDate:'2026-09-10',institution:null,subcategory:'Sangre',summary:null,conclusions:null,extractionConfidence:{},measurements:[]};
let files:MemoryFiles;let service:DocumentService;
beforeEach(()=>{files=new MemoryFiles();service=new DocumentService(new SqlDataService(sqliteBinding() as never),files);});
describe('shared original documents',()=>{
 it('sameBytesDifferentNameReturnsExistingId',async()=>{const a=await service.saveDocument(file(),metadata);const b=await service.saveDocument(file('renombrado.pdf'),metadata);expect(a.document.id).toBe(b.document.id);expect(b.duplicate).toBe(true);expect((await service.listDocuments()).length).toBe(1);expect(files.objects.size).toBe(1);});
 it('concurrentDuplicatesCreateOneRecord',async()=>{const results=await Promise.allSettled([service.saveDocument(file(),metadata),service.saveDocument(file('otro.pdf'),metadata)]);expect(results.some(r=>r.status==='fulfilled')).toBe(true);expect((await service.listDocuments()).length).toBe(1);expect(files.objects.size).toBe(1);});
 it('storageFailureDoesNotConfirmUpload',async()=>{files.failPut=true;await expect(service.saveDocument(file(),metadata)).rejects.toThrow();expect(await service.listDocuments()).toEqual([]);});
 it('sameDateDifferentBytesAreAllowed',async()=>{await service.saveDocument(file(),metadata);await service.saveDocument(file('b.pdf','%PDF-1.7\nOtro documento sintético'),metadata);expect(await service.listDocuments()).toHaveLength(2);});
 it('sortsByMedicalDate',async()=>{await service.saveDocument(file(),metadata);await service.saveDocument(file('antiguo.pdf','%PDF-1.7\nAntiguo'),{...metadata,medicalDate:'2026-05-01'});expect((await service.listDocuments())[0].medicalDate).toBe('2026-09-10');});
 it('rejectsOversizedFile',async()=>{await expect(service.saveDocument(new File([new Uint8Array(25*1024*1024+1)],'big.pdf',{type:'application/pdf'}),metadata)).rejects.toThrow('25 MB');});
 it('editingPreservesOriginalHashAndBytes',async()=>{const {document:a}=await service.saveDocument(file(),metadata);const updated=await service.updateDocument(a.id,a.version,{...metadata,medicalDate:'2026-09-12'});expect(updated.sha256).toBe(a.sha256);expect(updated.medicalDate).toBe('2026-09-12');expect(new TextDecoder().decode(await service.getFile(a.id))).toBe('%PDF-1.7\nDocumento sintético');});
 it('staleVersionReturnsConflictWithoutPartialChanges',async()=>{const {document:a}=await service.saveDocument(file(),metadata);await service.updateDocument(a.id,1,{...metadata,title:'Corrected'});await expect(service.updateDocument(a.id,1,{...metadata,title:'Stale'})).rejects.toThrow('otra persona');expect((await service.listDocuments())[0].title).toBe('Corrected');});
 it('deletionRemovesResultsAndOriginal',async()=>{const {document:a}=await service.saveDocument(file(),metadata);await service.deleteDocument(a.id,a.version);expect(await service.listDocuments()).toEqual([]);expect(files.objects.size).toBe(0);});
 it('failedDeletionRemainsPending',async()=>{const {document:a}=await service.saveDocument(file(),metadata);files.failDelete=true;await expect(service.deleteDocument(a.id,1)).rejects.toThrow();expect((await service.listDocuments())[0].processingStatus).toBe('deletion-pending');expect(files.objects.size).toBe(1);});
 it('failedReplacementPreservesCurrentFile',async()=>{const {document:a}=await service.saveDocument(file(),metadata);files.failPut=true;await expect(service.replaceDocument(a.id,1,file('new.pdf','%PDF-1.7\nReemplazo'),metadata)).rejects.toThrow();expect((await service.listDocuments())[0].sha256).toBe(a.sha256);expect(files.objects.size).toBe(1);});
 it('staleReplacementReturnsConflict',async()=>{const {document:a}=await service.saveDocument(file(),metadata);await service.updateDocument(a.id,1,metadata);await expect(service.replaceDocument(a.id,1,file('new.pdf','%PDF-1.7\nReemplazo'),metadata)).rejects.toThrow('otra persona');expect(files.objects.size).toBe(1);});
});
it('replacement cleanup survives restart and retries',async()=>{const {document:a}=await service.saveDocument(file(),metadata);files.failDelete=true;const result=await service.replaceDocument(a.id,1,file('new.pdf','%PDF-1.7\nNuevo'),metadata);expect(result.cleanupPending).toBe(true);expect((await service.getDocument(a.id)).pendingFileKeys).toEqual([a.fileKey]);files.failDelete=false;await service.listDocuments();expect(files.objects.size).toBe(1);expect((await service.getDocument(a.id)).pendingFileKeys).toEqual([]);});
it('paginates in SQL with date cursor',async()=>{const data=new SqlDataService(sqliteBinding() as never);const docs=new DocumentService(data,files);const a=await docs.saveDocument(file(),metadata);await docs.saveDocument(file('b.pdf','%PDF-1.7\nB'),{...metadata,medicalDate:'2026-05-01'});expect(await data.listDocumentPage({limit:1})).toHaveLength(1);expect((await data.listDocumentPage({limit:2,before:`${a.document.medicalDate}:${a.document.id}`}))[0].medicalDate).toBe('2026-05-01');});
it('stores an original without a detected date and allows completing it later',async()=>{
 const saved=await service.saveDocument(file('sin-fecha.pdf','%PDF-1.7\nFecha no legible'),{...metadata,medicalDate:''});
 expect(await service.getFile(saved.document.id)).toBeTruthy();
 expect((await service.listDocuments())[0].medicalDate).toBe('');
 const updated=await service.updateDocument(saved.document.id,saved.document.version,metadata);
 expect(updated.medicalDate).toBe(metadata.medicalDate);
});
it('normalization preview/apply and undo retain files, results and source units',async()=>{
 const measurements=[{indicatorName:'Creatinina',normalizedName:null,kind:'numeric' as const,rawValue:'0,94',numericValue:.94,operator:'=' as const,unit:'mgj/dl',referenceText:'0,66 - 1,25 mg/dl',referenceBounds:null},{indicatorName:'VCM',normalizedName:null,kind:'numeric' as const,rawValue:'80',numericValue:80,operator:'=' as const,unit:'fl',referenceText:null,referenceBounds:null}];
 const {document}=await service.saveDocument(file(),{...metadata,measurements});
 const first=document.measurements[0],safe=document.measurements[1];
 await expect(service.normalizeUnits(document.id,document.version,[{measurementId:first.id,mode:'format'}])).rejects.toThrow();
 const normalized=await service.normalizeUnits(document.id,document.version,[{measurementId:safe.id,mode:'format'}]);
 expect(normalized.measurements.map(m=>m.id)).toEqual(document.measurements.map(m=>m.id));
 expect(normalized.measurements[0].unit).toBe('mgj/dl');expect(normalized.measurements[1].normalizedUnit).toBe('fL');
 const confirmed=await service.normalizeUnits(document.id,normalized.version,[{measurementId:first.id,mode:'confirm',unit:'mg/dL'}]);
 expect(confirmed.measurements[0].normalizedUnit).toBe('mg/dL');expect(confirmed.measurements[0].originalUnit).toBe('mgj/dl');
 await expect(service.normalizeUnits(document.id,document.version,[{measurementId:first.id,mode:'revert'}])).rejects.toThrow('otra persona');
 const reverted=await service.normalizeUnits(document.id,confirmed.version,[{measurementId:first.id,mode:'revert'}]);
 expect(reverted.measurements[0].normalizedUnit).toBeNull();expect(reverted.measurements).toHaveLength(2);expect(reverted.sha256).toBe(document.sha256);expect(await service.getFile(document.id)).toBeTruthy();
});
it('editing a confirmed unit creates reversible history and preserves result identity',async()=>{
 const input={indicatorName:'Creatinina',normalizedName:null,kind:'numeric' as const,rawValue:'0,94',numericValue:.94,operator:'=' as const,unit:'mgj/dl',referenceText:null,referenceBounds:null};
 const {document}=await service.saveDocument(file(),{...metadata,measurements:[input],conclusions:'Conclusión conservada.'});
 const old=document.measurements[0];
 const updated=await service.updateDocument(document.id,document.version,{...document,measurements:[{...old,normalizedUnit:'mg/dL',unitStatus:'confirmed'}]});
 expect(updated.measurements[0].id).toBe(old.id);expect(updated.measurements[0].unit).toBe('mgj/dl');expect(updated.measurements[0].unitCorrections).toHaveLength(1);
 const undo=await service.normalizeUnits(updated.id,updated.version,[{measurementId:old.id,mode:'revert'}]);expect(undo.measurements[0].normalizedUnit).toBeNull();expect(undo.conclusions).toBe('Conclusión conservada.');
});
