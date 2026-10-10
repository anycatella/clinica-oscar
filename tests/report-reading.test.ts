import {describe,it,expect} from 'vitest';
import {parseReport} from '../lib/domain/parse-report';
import {pdfPageText} from '../lib/domain/pdf-text';
describe('automatic document fields',()=>{
 it('prefers the medical date over birth and print dates',()=>{const report=parseReport('Laboratorio Ejemplo\nNacimiento: 01/01/1950\nFecha de extracción: 09/10/2026\nImpresión: 10/10/2026\nGlucosa\t105,5\tmg/dL\t70 - 99');expect(report.medicalDateSuggestion).toBe('2026-10-09');expect(report.institution).toBe('Laboratorio Ejemplo');expect(report.measurements[0].numericValue).toBe(105.5);});
 it('reads report titles, conclusions and a one-sided reference',()=>{const report=parseReport('Centro Médico Ejemplo\nResonancia de abdomen\nFecha del estudio: 09/10/2026\nConclusión: Texto de prueba.');expect(report.title).toBe('Resonancia de abdomen');expect(report.categorySuggestion).toBe('study');expect(report.conclusions).toBe('Texto de prueba.');const lab=parseReport('Glucosa 105 mg/dL Menor a 100');expect(lab.measurements[0].referenceBounds?.upper).toBe(100);expect(lab.measurements[0].referenceBounds?.upperInclusive).toBe(false);});
 it('keeps numeric rows together when PDF text has no line-break hints',()=>{const item=(str:string,x:number,y:number)=>({str,transform:[1,0,0,1,x,y]});const text=pdfPageText([item('Glucosa',10,700),item('105',180,700),item('mg/dL',250,700),item('70 - 99',320,700),item('Hemoglobina',10,680),item('12',180,680),item('g/dL',250,680),item('11 - 16',320,680)]);expect(parseReport(text).measurements).toHaveLength(2);});
});
