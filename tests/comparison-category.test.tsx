import React from 'react';
import {it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {ComparisonView} from '../components/comparison-view';
import type {DocumentRecord} from '../lib/domain/types';
it('keeps studies out of the initial analysis table, history selector and unit review',()=>{
 const record=(category:'analysis'|'study',name:string)=>({id:category,title:name,medicalDate:'2026-10-05',category,processingStatus:'confirmed',measurements:[{id:name,documentId:category,indicatorName:name,normalizedName:null,medicalDate:'2026-10-05',reviewed:true,kind:'numeric',rawValue:'1',numericValue:1,operator:'=',unit:'mm',referenceText:null,referenceBounds:null}]} as DocumentRecord);
 const html=renderToStaticMarkup(<ComparisonView documents={[record('analysis','Glucosa'),record('study','Lesión de estudio')]} onView={()=>{}}/>);expect(html).toContain('Glucosa');expect(html).not.toContain('Lesión de estudio');
});
