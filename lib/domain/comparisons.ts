import type { MeasurementRecord, ComparisonRow } from './types';
export function groupComparisons(rows:MeasurementRecord[]){
 const groups=new Map<string,{key:string;label:string;unit:string|null;rows:MeasurementRecord[]}>();
 for(const row of rows){if(!row.reviewed)continue;const name=row.normalizedName||row.indicatorName.trim().toLowerCase();const key=JSON.stringify([name,row.unit??'']);const g=groups.get(key)??{key,label:row.normalizedName?row.normalizedName.toUpperCase():row.indicatorName,unit:row.unit,rows:[]};g.rows.push(row);groups.set(key,g);}
 return [...groups.values()].map(g=>({...g,rows:g.rows.sort((a,b)=>b.medicalDate.localeCompare(a.medicalDate))})).sort((a,b)=>a.label.localeCompare(b.label,'es'));
}
export function referenceStatus(row:MeasurementRecord):'low'|'normal'|'high'|'unknown'{
 const b=row.referenceBounds,n=row.numericValue;
 if(row.kind!=='numeric'||row.operator!=='='||n===null||!b||(b.lower===null&&b.upper===null))return 'unknown';
 if(b.lower!==null&&(n<b.lower||(!b.lowerInclusive&&n===b.lower)))return 'low';
 if(b.upper!==null&&(n>b.upper||(!b.upperInclusive&&n===b.upper)))return 'high';
 return 'normal';
}
export function compareDates(rows:MeasurementRecord[],dates:[string,string],choices:Record<string,string>):ComparisonRow[]{
 if(dates[0]===dates[1])return [];const [early,late]=[...dates].sort();
 return groupComparisons(rows.filter(r=>dates.includes(r.medicalDate))).map(g=>{
 const candidates=(date:string)=>g.rows.filter(r=>r.medicalDate===date);
 const choose=(date:string)=>{const list=candidates(date);return list.length===1?list[0]:list.find(r=>r.id===choices[`${g.key}:${date}`])??null;};
 const a=choose(early),b=choose(late);const unresolved=[early,late].some(date=>candidates(date).length>1&&!choose(date));
 let direction:ComparisonRow['direction']='not-comparable';
 if(unresolved)direction='selection-required';else if(a&&b&&a.kind==='numeric'&&b.kind==='numeric'&&a.operator==='='&&b.operator==='='&&a.numericValue!==null&&b.numericValue!==null)direction=b.numericValue>a.numericValue?'up':b.numericValue<a.numericValue?'down':'unchanged';
 const status=b?referenceStatus(b):'unknown';
 return {key:g.key,label:g.label,unit:g.unit,earlier:a,later:b,direction,normal:status==='unknown'?null:status==='normal',currentReference:b?.referenceText??null,candidateIds:{[early]:candidates(early).map(r=>r.id),[late]:candidates(late).map(r=>r.id)}};
 });
}
