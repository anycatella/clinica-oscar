import type {MeasurementInput} from './types';
export function editMeasurement(current:MeasurementInput,changes:Partial<MeasurementInput>):MeasurementInput{
 const next={...current,...changes};
 if(changes.indicatorName!==undefined&&changes.indicatorName!==current.indicatorName)next.normalizedName=null;
 if(changes.rawValue!==undefined||changes.kind!==undefined){const parsed=/^\s*([<>]=?)?\s*(-?\d+(?:[.,]\d+)?)\s*$/.exec(next.rawValue);next.numericValue=next.kind==='numeric'&&parsed?Number(parsed[2].replace(',','.')):null;next.operator=next.kind==='numeric'&&parsed?(parsed[1]??'=') as MeasurementInput['operator']:null;}
 return next;
}
