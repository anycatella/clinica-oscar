import type {DocumentMetadata} from './types';
import {editMeasurement} from './edit-measurement';
export function reviewMetadata(current:DocumentMetadata,data:FormData):DocumentMetadata{
 const value=(name:string,fallback:string|null)=>data.has(name)?String(data.get(name)??'').trim():fallback;
 const nullable=(name:string,fallback:string|null)=>value(name,fallback)||null;
 return {...current,title:value('title',current.title)??'',medicalDate:value('medicalDate',current.medicalDate)??'',category:(value('category',current.category)??current.category) as DocumentMetadata['category'],institution:nullable('institution',current.institution),subcategory:nullable('subcategory',current.subcategory),summary:nullable('summary',current.summary),conclusions:nullable('conclusions',current.conclusions),measurements:current.measurements.map((m,i)=>{
  if(!data.has(`indicatorName-${i}`))return m;
  const lower=nullable(`lower-${i}`,m.referenceBounds?.lower?.toString()??null),upper=nullable(`upper-${i}`,m.referenceBounds?.upper?.toString()??null);
  return editMeasurement(m,{indicatorName:value(`indicatorName-${i}`,m.indicatorName)??'',rawValue:value(`rawValue-${i}`,m.rawValue)??'',kind:(value(`kind-${i}`,m.kind)??m.kind) as 'numeric'|'text',unit:nullable(`unit-${i}`,m.unit),normalizedName:nullable(`normalizedName-${i}`,m.normalizedName),referenceText:nullable(`referenceText-${i}`,m.referenceText),referenceBounds:lower===null&&upper===null?null:{lower:lower===null?null:Number(lower),upper:upper===null?null:Number(upper),lowerInclusive:data.has(`lowerInclusive-${i}`),upperInclusive:data.has(`upperInclusive-${i}`)}});
 })};
}
