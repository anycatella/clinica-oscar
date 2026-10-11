import type {MeasurementInput} from './types';
import {laboratoryMeasurements,reportNumber} from './laboratory-rows';
import {prepareMeasurementUnit} from './unit-normalization';
import {isStudyMeasurement} from './study-measurements';
export function studyMeasurements(text:string):MeasurementInput[]{
 const result:MeasurementInput[]=[];
 for(const line of text.split('\n')){
  const dimensions=/^\s*([^:]{2,100})\s*:\s*(\d+(?:[.,]\d+)?(?:\s*[x×]\s*\d+(?:[.,]\d+)?){1,2})\s*(mm|cm)\b/i.exec(line);
  if(dimensions){const base={indicatorName:dimensions[1].trim()} as MeasurementInput;if(!isStudyMeasurement(base))continue;dimensions[2].split(/\s*[x×]\s*/).forEach((value,index)=>result.push(prepareMeasurementUnit({indicatorName:`${base.indicatorName} · eje ${index+1}`,normalizedName:null,kind:'numeric',rawValue:value,numericValue:reportNumber(value),operator:'=',unit:dimensions[3],referenceText:line.trim(),referenceBounds:null})));continue;}
  result.push(...laboratoryMeasurements(line).filter(isStudyMeasurement));
 }
 return result;
}
