import {beforeEach,it,expect,vi} from 'vitest';
const request=vi.hoisted(()=>vi.fn());
const extract=vi.hoisted(()=>vi.fn());
vi.mock('../lib/client/api',()=>({apiFetch:request}));vi.mock('../lib/client/extract-document',()=>({extractDocument:extract}));
import {preserveAndReadUpload} from '../lib/client/preserve-upload';
beforeEach(()=>{request.mockReset();extract.mockReset();});
it('stores the original before reading and updates the detected medical date afterwards',async()=>{
 request.mockResolvedValueOnce({document:{id:'stored',version:1,medicalDate:''}}).mockImplementationOnce(async()=>({id:'stored',version:2,medicalDate:'2026-05-14'}));
 extract.mockImplementation(async()=>{expect(request).toHaveBeenCalledTimes(1);return {text:'Laboratorio\nFecha de Muestra: 14/05/26\nGlucosa 96 mg/dL 70 - 99',warnings:[]};});
 const r=await preserveAndReadUpload(new File(['%PDF-1.7'],'lab.pdf'),()=>{});
 expect(r.document.medicalDate).toBe('2026-05-14');expect(request.mock.calls[1][0]).toBe('/api/documents/stored');
});
it('keeps the original saved when reading fails or no date is found',async()=>{
 const original={id:'stored',version:1,medicalDate:''};request.mockResolvedValue({document:original});extract.mockRejectedValue(Error('PDF no legible'));
 const r=await preserveAndReadUpload(new File(['%PDF-1.7'],'lab.pdf'),()=>{});expect(r.document).toBe(original);expect(r.warnings.length).toBeGreaterThan(0);
});
it('does not pretend to save when the original upload fails',async()=>{request.mockRejectedValue(Error('Sin conexión'));await expect(preserveAndReadUpload(new File(['%PDF-1.7'],'lab.pdf'),()=>{})).rejects.toThrow('Sin conexión');expect(extract).not.toHaveBeenCalled();});
