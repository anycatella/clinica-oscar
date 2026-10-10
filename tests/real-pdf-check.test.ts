import {it,expect} from 'vitest';
import fs from 'node:fs';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {pdfPageText} from '../lib/domain/pdf-text';
import {parseReport} from '../lib/domain/parse-report';
import {validateMetadata} from '../lib/server/validation';
it.runIf(!!process.env.CLINICA_QA_PDF)('reads and validates the selected local PDF without embedding it in source',async()=>{
 const pdf=await getDocument({data:new Uint8Array(fs.readFileSync(process.env.CLINICA_QA_PDF!)),useSystemFonts:true}).promise;
 const pages:string[]=[];for(let i=1;i<=pdf.numPages;i++)pages.push(pdfPageText((await(await pdf.getPage(i)).getTextContent()).items));
 const data=parseReport(pages.join('\n'));expect(data.medicalDateSuggestion).toBe('2026-05-14');expect(data.measurements.length).toBeGreaterThan(10);
 const metadata={title:data.title,category:data.categorySuggestion??'analysis',medicalDate:data.medicalDateSuggestion??'',institution:data.institution,subcategory:data.subcategory,summary:data.summary,conclusions:data.conclusions,extractionConfidence:data.extractionConfidence,measurements:data.measurements};
 expect(()=>validateMetadata(metadata)).not.toThrow();console.log('Archivo local verificado:',pdf.numPages,'páginas;',data.measurements.length,'indicadores; fecha',data.medicalDateSuggestion);
 if(process.env.CLINICA_QA_OUTPUT)fs.writeFileSync(process.env.CLINICA_QA_OUTPUT,JSON.stringify(metadata));
});
