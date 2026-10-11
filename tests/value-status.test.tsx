import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {MeasurementValue} from '../components/measurement-value';
import type {MeasurementInput} from '../lib/domain/types';
const row=(value:number,extra:Partial<MeasurementInput>={}):MeasurementInput=>({indicatorName:'Glucosa',normalizedName:null,kind:'numeric',rawValue:String(value),numericValue:value,operator:'=',unit:'mg/dL',referenceText:'70–99',referenceBounds:{lower:70,upper:99,lowerInclusive:true,upperInclusive:true},...extra});
describe('reference highlighting',()=>{
 it.each([[69,'low','Bajo'],[70,'normal','Normal'],[99,'normal','Normal'],[100,'high','Alto']])('classifies %s using the reviewed reference',(value,status,label)=>{
  const html=renderToStaticMarkup(<MeasurementValue row={row(value as number)}/>);
  expect(html).toContain(`measurement-value ${status}`);expect(html).toContain(label);
 });
 it('does not assign a normal color without a numerical reference',()=>expect(renderToStaticMarkup(<MeasurementValue row={row(90,{referenceBounds:null})}/>)).toContain('measurement-value unknown'));
 it('does not classify a censored value as an exact value',()=>expect(renderToStaticMarkup(<MeasurementValue row={row(90,{operator:'<'})}/>)).toContain('measurement-value unknown'));
 it('shows a repaired cubic-millimetre unit for an existing OCR result',()=>{
  const html=renderToStaticMarkup(<MeasurementValue row={row(4.5,{unit:'/mm?'})}/>);
  expect(html).toContain('/mm³');
  expect(html).not.toContain('/mm?');
 });
});
