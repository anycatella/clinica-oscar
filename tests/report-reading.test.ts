import {describe,it,expect} from 'vitest';
import {parseReport} from '../lib/domain/parse-report';
import {pdfPageText} from '../lib/domain/pdf-text';
describe('automatic document fields',()=>{
 it('reads laboratory columns without requiring a space before the unit',()=>{const report=parseReport('Laboratorio Ejemplo\nFecha: 10/10/2026\nGlucemia: 1,05g/L 0,70 - 1,10\nLeucocitos 6.500 /mm3 4.000 - 10.000\nHematocrito 42% 38 - 50');expect(report.measurements.map(m=>m.numericValue)).toEqual([1.05,6500,42]);expect(report.measurements[1].referenceBounds?.upper).toBe(10000);});
 it('reconnects result rows split by PDF column extraction',()=>{const report=parseReport('Laboratorio Ejemplo\nGlucosa\n96\nmg/dL\n70 - 99\nHemoglobina\n13,5\ng/dL\n12 - 16');expect(report.measurements).toHaveLength(2);expect(report.measurements[0].indicatorName).toBe('Glucosa');expect(report.measurements[1].numericValue).toBe(13.5);});
 it('reads unitless and qualitative results without inventing units',()=>{const report=parseReport('Laboratorio Ejemplo\npH 6,0 5,0 - 8,0\nProteínas: Negativo\nNitritos: No detectable');expect(report.measurements).toHaveLength(3);expect(report.measurements[0].unit).toBeNull();expect(report.measurements[1].kind).toBe('text');expect(report.measurements[1].rawValue).toBe('Negativo');});
 it('prefers the medical date over birth and print dates',()=>{const report=parseReport('Laboratorio Ejemplo\nNacimiento: 01/01/1950\nFecha de extracción: 09/10/2026\nImpresión: 10/10/2026\nGlucosa\t105,5\tmg/dL\t70 - 99');expect(report.medicalDateSuggestion).toBe('2026-10-09');expect(report.institution).toBe('Laboratorio Ejemplo');expect(report.measurements[0].numericValue).toBe(105.5);});
 it('reads report titles, conclusions and a one-sided reference',()=>{const report=parseReport('Centro Médico Ejemplo\nResonancia de abdomen\nFecha del estudio: 09/10/2026\nConclusión: Texto de prueba.');expect(report.title).toBe('Resonancia de abdomen');expect(report.categorySuggestion).toBe('study');expect(report.conclusions).toBe('Texto de prueba.');const lab=parseReport('Glucosa 105 mg/dL Menor a 100');expect(lab.measurements[0].referenceBounds?.upper).toBe(100);expect(lab.measurements[0].referenceBounds?.upperInclusive).toBe(false);});
 it('keeps numeric rows together when PDF text has no line-break hints',()=>{const item=(str:string,x:number,y:number)=>({str,transform:[1,0,0,1,x,y]});const text=pdfPageText([item('Glucosa',10,700),item('105',180,700),item('mg/dL',250,700),item('70 - 99',320,700),item('Hemoglobina',10,680),item('12',180,680),item('g/dL',250,680),item('11 - 16',320,680)]);expect(parseReport(text).measurements).toHaveLength(2);});
});

it('reads textual protocol dates and excludes birth and browser print dates',()=>{
 const report=parseReport('7/10/26, 3:08 p.m.\nFecha Nacimiento: 17 NOV 1959\nFecha Protocolo: 27 MAY 2026 09:49\nGlucosa 96 mg/dL 70 - 99');
 expect(report.medicalDateSuggestion).toBe('2026-05-27');
});
it('reads a date below its label and spaced numeric and short years',()=>{
 expect(parseReport('Fecha de extracción:\n09 / 10 / 26\nFecha impresión: 10/10/2026').medicalDateSuggestion).toBe('2026-10-09');
 expect(parseReport('Fecha del estudio: 9 de octubre de 2026').medicalDateSuggestion).toBe('2026-10-09');
});
it('preserves date field associations across PDF columns and wrapped labels',()=>{
 const item=(str:string,x:number,y:number)=>({str,transform:[1,0,0,1,x,y]});
 const report=parseReport(pdfPageText([item('Fecha',36,522),item('Nacimiento:',36,511),item('17 NOV 1959',98,517),item('Fecha',213,522),item('Protocolo:',213,511),item('27 MAY 2026 09:49',272,517)]));
 expect(report.medicalDateSuggestion).toBe('2026-05-27');
});
it('does not extract patient identifiers or reference population rows as results',()=>{
 const report=parseReport('Documento: 12345678\nAdultos: 150.000-450.000 /ul\nNiños: 150.000-500.000 /ul\nHombres....... 0,70-1,20\nNivel Alto: 240\nGlucosa 96 mg/dL 70 - 99\nCA 19.9 8,2 U/mL Menor a 37');
 expect(report.measurements.map(x=>x.indicatorName)).toEqual(['Glucosa','CA 19.9']);expect(report.measurements[1].numericValue).toBe(8.2);
});
