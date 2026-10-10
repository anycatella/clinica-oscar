import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import type {DocumentRecord} from '../lib/domain/types';
import {DocumentReport} from '../components/document-report';
import {buildReportPdf} from '../lib/domain/report-pdf';
const row={indicatorName:'Glucosa',normalizedName:null,kind:'numeric' as const,rawValue:'110',numericValue:110,operator:'=' as const,unit:'mg/dL',referenceText:'70 - 99',referenceBounds:{lower:70,upper:99,lowerInclusive:true,upperInclusive:true},id:'m1',documentId:'d1',medicalDate:'2026-10-10',reviewed:true};
const record={id:'d1',title:'Análisis de prueba',category:'analysis',medicalDate:'2026-10-10',institution:'Laboratorio de prueba',measurements:[row],conclusions:null,summary:null} as DocumentRecord;
describe('automatic document report',()=>{
 it('shows every extracted result with its current reference and status',()=>{const html=renderToStaticMarkup(<DocumentReport record={record}/>);expect(html).toContain('Glucosa');expect(html).toContain('110');expect(html).toContain('70 - 99');expect(html).toContain('Alto');});
 it('exports a real PDF containing results and references',()=>{const pdf=buildReportPdf(record);const text=new TextDecoder('latin1').decode(pdf);expect(text.startsWith('%PDF-1.4')).toBe(true);expect(text).toContain('Glucosa');expect(text).toContain('70 - 99');expect(text).toContain('xref');expect(text.endsWith('%%EOF\n')).toBe(true);});
 it('opens in a PDF reader with accents and the extracted results intact',async()=>{const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');const task=getDocument({data:buildReportPdf(record),useSystemFonts:true});try{const pdf=await task.promise;const page=await pdf.getPage(1);const text=(await page.getTextContent()).items.map(item=>'str' in item?item.str:'').join(' ');expect(text).toContain('Análisis de prueba');expect(text).toContain('Glucosa');expect(text).toContain('110 mg/dL');}finally{await task.destroy();}});
 it('keeps long reports complete across pages',()=>{const pdf=buildReportPdf({...record,measurements:Array.from({length:70},(_,i)=>({...row,id:String(i),indicatorName:'Indicador '+i}))});const text=new TextDecoder('latin1').decode(pdf);expect(text).toContain('Indicador 69');expect(text).toMatch(/\/Count [2-9]/);});
});
