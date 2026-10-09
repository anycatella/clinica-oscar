import { describe, it, expect } from 'vitest';
import { parseReport, normalizeIndicator } from '../lib/domain/parse-report';
import { compareDates, referenceStatus, groupComparisons } from '../lib/domain/comparisons';
import { summarize, localToday, validateDate } from '../lib/domain/calendar';
import type { MeasurementRecord, DocumentRecord, SessionRecord } from '../lib/domain/types';
const measure=(value:number,date:string,extra:Partial<MeasurementRecord>={}):MeasurementRecord=>({id:`${date}-${value}`,documentId:date,medicalDate:date,indicatorName:'Glucosa',normalizedName:'glucosa',kind:'numeric',rawValue:String(value),numericValue:value,operator:'=',unit:'mg/dL',referenceText:'70–99',referenceBounds:{lower:70,upper:99,lowerInclusive:true,upperInclusive:true},reviewed:true,...extra});
describe('two-date comparisons',()=>{
 it('reports down and normal using later reference',()=>{const r=compareDates([measure(105,'2026-01-01'),measure(96,'2026-02-01')],['2026-02-01','2026-01-01'],{});expect(r[0].direction).toBe('down');expect(r[0].normal).toBe(true);expect(r[0].earlier?.numericValue).toBe(105);});
 it('reports up',()=>expect(compareDates([measure(90,'2026-01-01'),measure(105,'2026-02-01')],['2026-01-01','2026-02-01'],{})[0].direction).toBe('up'));
 it('equal outside reference is unchanged and not normal',()=>{const r=compareDates([measure(105,'2026-01-01'),measure(105,'2026-02-01')],['2026-01-01','2026-02-01'],{})[0];expect(r.direction).toBe('unchanged');expect(r.normal).toBe(false);});
 it('does not borrow an older reference',()=>{const r=compareDates([measure(90,'2026-01-01'),measure(95,'2026-02-01',{referenceText:null,referenceBounds:null})],['2026-01-01','2026-02-01'],{})[0];expect(r.currentReference).toBe(null);expect(r.normal).toBe(null);});
 it('missing date is not comparable',()=>expect(compareDates([measure(90,'2026-01-01')],['2026-01-01','2026-02-01'],{})[0].direction).toBe('not-comparable'));
 it('same-day results require explicit selection',()=>{const rows=[measure(90,'2026-01-01'),measure(95,'2026-01-01'),measure(98,'2026-02-01')];expect(compareDates(rows,['2026-01-01','2026-02-01'],{})[0].direction).toBe('selection-required');const key=groupComparisons(rows)[0].key;expect(compareDates(rows,['2026-01-01','2026-02-01'],{[`${key}:2026-01-01`]:'2026-01-01-95'})[0].direction).toBe('up');});
 it('keeps different units apart',()=>expect(groupComparisons([measure(90,'2026-01-01'),measure(5,'2026-02-01',{unit:'mmol/L'})])).toHaveLength(2));
 it('excludes unreviewed measurements',()=>expect(groupComparisons([measure(90,'2026-01-01',{reviewed:false})])).toHaveLength(0));
 it('does not compare censored values as exact',()=>expect(compareDates([measure(90,'2026-01-01'),measure(95,'2026-02-01',{operator:'<'})],['2026-01-01','2026-02-01'],{})[0].direction).toBe('not-comparable'));
 it('respects exclusive range bounds',()=>expect(referenceStatus(measure(99,'2026-01-01',{referenceBounds:{lower:70,upper:99,lowerInclusive:true,upperInclusive:false}}))).toBe('high'));
 it('does not invent reference for text findings',()=>expect(referenceStatus(measure(0,'2026-01-01',{kind:'text',numericValue:null}))).toBe('unknown'));
});
describe('reading reports',()=>{
 it('detects multiple medical dates as candidates',()=>expect(parseReport('Fecha de estudio: 10/09/2026\nImpresión: 11/09/2026').dateCandidates).toEqual(['2026-09-10','2026-09-11']));
 it('preserves decimal comma, unit and reference',()=>{const r=parseReport('Fecha: 10/09/2026\nGlucosa 105,5 mg/dL 70 - 99').measurements[0];expect(r.numericValue).toBe(105.5);expect(r.rawValue).toBe('105,5');expect(r.unit).toBe('mg/dL');expect(r.referenceBounds?.upper).toBe(99);});
 it('preserves censored result',()=>{const r=parseReport('TSH <0,5 mUI/L 0,4 - 4,0').measurements[0];expect(r.operator).toBe('<');expect(r.numericValue).toBe(.5);});
 it('does not invent data from unreadable text',()=>{const r=parseReport('???');expect(r.measurements).toEqual([]);expect(r.conclusions).toBe(null);});
 it('keeps verbatim conclusions',()=>expect(parseReport('Tomografía\nConclusiones: Hallazgo de prueba.\nControl documentado.').conclusions).toBe('Hallazgo de prueba.\nControl documentado.'));
 it('marks uncertain date for review',()=>expect(parseReport('Sin fecha').extractionConfidence.documentDate).toBe('low'));
 it('normalizes only reviewed aliases',()=>{expect(normalizeIndicator('Colesterol-HDL')).toBe('hdl');expect(normalizeIndicator('Marcador extraño')).toBe(null);});
 it('rejects impossible calendar dates',()=>expect(validateDate('2026-02-30')).toBe(false));
});
describe('chemotherapy and dashboard',()=>{
 it('uses Tucuman day at UTC midnight',()=>expect(localToday(new Date('2026-10-10T01:00:00Z'))).toBe('2026-10-09'));
 it('empty repository has null dates and zero counts',()=>expect(summarize([],[],'2026-10-09')).toEqual({latestAnalysisDate:null,latestStudyDate:null,analysisCount:0,studyCount:0,lastChemoDate:null,nextChemoDate:null}));
 it('counts by category and medical date',()=>{const docs=[{category:'analysis',medicalDate:'2026-05-01'},{category:'analysis',medicalDate:'2026-09-01'},{category:'study',medicalDate:'2026-03-01'}] as DocumentRecord[];expect(summarize(docs,[],'2026-10-09').latestAnalysisDate).toBe('2026-09-01');expect(summarize(docs,[],'2026-10-09').analysisCount).toBe(2);});
 it('does not mark past scheduled sessions complete',()=>{const sessions=[{date:'2026-10-01',status:'scheduled'},{date:'2026-10-10',status:'cancelled'},{date:'2026-10-15',status:'scheduled'},{date:'2026-09-20',status:'completed'}] as SessionRecord[];const r=summarize([],sessions,'2026-10-09');expect(r.lastChemoDate).toBe('2026-09-20');expect(r.nextChemoDate).toBe('2026-10-15');});
});
