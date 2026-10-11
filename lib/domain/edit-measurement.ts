import {canonicalUnit} from './measurement-labels';
import {reportNumber} from './laboratory-rows';
import type {MeasurementInput} from './types';
export function editMeasurement(current:MeasurementInput,changes:Partial<MeasurementInput>):MeasurementInput{
 const next={...current,...changes};
 if(changes.unit!==undefined){next.originalUnit=current.originalUnit===undefined?current.unit:current.originalUnit;next.unit=current.unit;next.normalizedUnit=changes.unit?.trim()?canonicalUnit(changes.unit)??changes.unit.trim():null;next.unitStatus=next.normalizedUnit?'confirmed':'unresolved';}
 if(changes.indicatorName!==undefined&&changes.indicatorName!==current.indicatorName)next.normalizedName=null;
 if(changes.rawValue!==undefined||changes.kind!==undefined){const parsed=/^\s*([<>]=?)?\s*(-?\d+(?:[.,]\d+)*)\s*$/.exec(next.rawValue);next.numericValue=next.kind==='numeric'&&parsed?reportNumber(parsed[2]):null;next.operator=next.kind==='numeric'&&parsed?(parsed[1]??'=') as MeasurementInput['operator']:null;}
 return next;
}
