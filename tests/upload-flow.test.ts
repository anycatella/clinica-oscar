import {beforeEach,describe,it,expect,vi} from 'vitest';
import type {DocumentMetadata} from '../lib/domain/types';
const request=vi.hoisted(()=>vi.fn());
vi.mock('../lib/client/api',()=>({apiFetch:request}));
import {canSaveAutomatically,saveUpload} from '../lib/client/save-upload';
const metadata:DocumentMetadata={title:'Análisis de laboratorio',medicalDate:'2026-10-10',category:'analysis',institution:'Laboratorio de prueba',subcategory:null,summary:null,conclusions:null,measurements:[],extractionConfidence:{}};
describe('simple automatic upload',()=>{
 beforeEach(()=>{request.mockReset();});
 it('saves a dated extracted document without requiring a review checkbox',async()=>{request.mockResolvedValue({document:{id:'saved'},duplicate:false});expect(canSaveAutomatically(metadata,[])).toBe(true);const result=await saveUpload(new File(['%PDF-1.7'],'prueba.pdf'),metadata);expect(result.document.id).toBe('saved');const body=request.mock.calls[0][1].body as FormData;expect(JSON.parse(String(body.get('metadata'))).medicalDate).toBe('2026-10-10');expect(body.get('personalUseConfirmed')).toBe('true');});
 it('requests the medical date rather than replacing it with today',()=>{expect(canSaveAutomatically({...metadata,medicalDate:''},[])).toBe(false);expect(canSaveAutomatically({...metadata,medicalDate:'2026-02-30'},[])).toBe(false);});
 it('preserves an unsuccessful upload for retry instead of reporting success',async()=>{request.mockRejectedValue(Error('No pudimos guardar'));await expect(saveUpload(new File(['%PDF-1.7'],'prueba.pdf'),metadata)).rejects.toThrow('No pudimos guardar');});
});
