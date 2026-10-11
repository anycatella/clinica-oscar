import type {MeasurementInput,MeasurementRecord,DocumentRecord,UnitState} from './types';
import {canonicalUnit,isReferenceLabel} from './measurement-labels';
import {isStudyMeasurement} from './study-measurements';
export function indicatorIdentity(row:MeasurementInput){return (row.normalizedName||row.indicatorName).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/\s+/g,' ').trim();}
export function unitState(row:MeasurementInput):UnitState{
 if(row.unitStatus==='confirmed'&&row.normalizedUnit?.trim())return {unitStatus:'confirmed',normalizedUnit:canonicalUnit(row.normalizedUnit)??row.normalizedUnit.trim()};
 if(row.unitStatus==='unresolved')return {unitStatus:'unresolved',normalizedUnit:null};
 const unit=canonicalUnit(row.unit);
 return {unitStatus:unit?'format':'unresolved',normalizedUnit:unit};
}
export const effectiveUnit=(row:MeasurementInput)=>unitState(row).normalizedUnit;
export function prepareMeasurementUnit<T extends MeasurementInput>(row:T):T{return {...row,originalUnit:row.originalUnit===undefined?row.unit:row.originalUnit,...unitState(row)};}
export function chartMeasurements(rows:MeasurementRecord[],unit:string|null){return unit?rows.filter(r=>effectiveUnit(r)===unit&&r.kind==='numeric'&&r.operator==='='&&r.numericValue!==null):[];}
// Suggestions rely on the same document, never on another report's unit.
export function unitProposals(row:MeasurementInput,document:Pick<DocumentRecord,'measurements'>){
 if(effectiveUnit(row))return [];
 const evidence=new Map<string,string>();
 const texts=[row.referenceText??'',...document.measurements.filter(r=>indicatorIdentity(r)===indicatorIdentity(row)).flatMap(r=>[r.unit??'',r.referenceText??''])];
 for(const text of texts){const joined=text.normalize('NFKC').replace(/[⁄∕]/g,'/').replace(/([a-zµμ])\s+\/\s*/gi,'$1/').replace(/\/\s+/g,'/');for(const token of joined.split(/\s+|[;,()]/)){const normalized=canonicalUnit(token);if(normalized)evidence.set(normalized,text);}}
 return [...evidence].map(([unit,source])=>({unit,source}));
}
export function normalizationPreview(document:DocumentRecord){return document.measurements.filter(row=>row.kind==='numeric'&&!isReferenceLabel(row.indicatorName)&&(document.category!=='study'||isStudyMeasurement(row))).map(row=>({row,state:unitState(row),original:row.originalUnit===undefined?row.unit:row.originalUnit,safe:!!canonicalUnit(row.unit)&&row.unitStatus!=='confirmed'&&row.unitStatus!=='unresolved'&&(row.normalizedUnit!==canonicalUnit(row.unit)||row.originalUnit===undefined),proposals:unitProposals(row,document)}));}
export function correctUnit<T extends MeasurementInput>(row:T,unit:string,reason:'format'|'confirmation',at=new Date().toISOString()):T{
 const before=unitState(row),normalized=canonicalUnit(unit)??unit.trim();
 const after:UnitState={normalizedUnit:normalized,unitStatus:reason==='format'?'format':'confirmed'};
 return {...row,originalUnit:row.originalUnit===undefined?row.unit:row.originalUnit,...after,unitCorrections:[...(row.unitCorrections??[]),{id:crypto.randomUUID(),at,reason,before,after}]};
}
export function revertUnitCorrection<T extends MeasurementInput>(row:T,at=new Date().toISOString()):T{
 const history=[...(row.unitCorrections??[])],index=history.map(c=>!c.revertedAt).lastIndexOf(true);
 if(index<0)return row;
 const correction=history[index];history[index]={...correction,revertedAt:at};
 return {...row,...correction.before,unitCorrections:history};
}
