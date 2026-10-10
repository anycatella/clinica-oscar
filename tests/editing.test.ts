import {expect,it} from 'vitest';
import {editMeasurement} from '../lib/domain/edit-measurement';
import type {MeasurementInput} from '../lib/domain/types';
const m:MeasurementInput={indicatorName:'HDL',normalizedName:'hdl',kind:'text',rawValue:'100',numericValue:null,operator:null,unit:'mg/dL',referenceText:null,referenceBounds:null};
it('parses existing text when corrected to numeric',()=>{expect(editMeasurement(m,{kind:'numeric'})).toMatchObject({numericValue:100,operator:'='});});
it('requires reconfirmation when changing indicator name',()=>{expect(editMeasurement(m,{indicatorName:'Glucosa'}).normalizedName).toBeNull();});
