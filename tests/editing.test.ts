import {expect,it} from 'vitest';
import {editMeasurement} from '../lib/domain/edit-measurement';
import type {MeasurementInput} from '../lib/domain/types';
const m:MeasurementInput={indicatorName:'HDL',normalizedName:'hdl',kind:'text',rawValue:'100',numericValue:null,operator:null,unit:'mg/dL',referenceText:null,referenceBounds:null};
it('parses existing text when corrected to numeric',()=>{expect(editMeasurement(m,{kind:'numeric'})).toMatchObject({numericValue:100,operator:'='});});
it('requires reconfirmation when changing indicator name',()=>{expect(editMeasurement(m,{indicatorName:'Glucosa'}).normalizedName).toBeNull();});
it('keeps the raw original unit when a person confirms the comparison unit',()=>{
 const next=editMeasurement({...m,unit:'mgj/dl'},{unit:'mg/dL'});
 expect(next.unit).toBe('mgj/dl');expect(next.originalUnit).toBe('mgj/dl');expect(next.normalizedUnit).toBe('mg/dL');expect(next.unitStatus).toBe('confirmed');
});
