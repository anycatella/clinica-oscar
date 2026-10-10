import {pdfPageText} from '../domain/pdf-text';
import {parseReport} from '../domain/parse-report';
type Reading={text:string;method:'text'|'ocr'|'manual';warnings:string[]};
function quality(text:string){const data=parseReport(text);return data.measurements.length*100+(data.medicalDateSuggestion?30:0)+(data.conclusions?30:0)+(data.categorySuggestion?10:0)+Math.min(text.trim().length/100,20);}
function needsOcr(text:string){const report=parseReport(text);return text.trim().length<30||/[�]/.test(text)||(report.categorySuggestion==='analysis'&&report.measurements.length===0);}
export async function extractDocument(file:File,onProgress:(n:number)=>void,signal?:AbortSignal):Promise<Reading>{
 const check=()=>{if(signal?.aborted)throw new DOMException('Cancelado','AbortError');};check();
 let worker:Awaited<ReturnType<typeof createOcrWorker>>|undefined;
 const recognize=async(image:File|HTMLCanvasElement)=>{
  check();worker??=await createOcrWorker();check();
  let text=(await worker.recognize(image)).data.text;
  if(needsOcr(text)){
   await worker.setParameters({tessedit_pageseg_mode:'6' as import('tesseract.js').PSM});
   try{const retry=(await worker.recognize(image)).data.text;if(quality(retry)>quality(text))text=retry;}finally{await worker.setParameters({tessedit_pageseg_mode:'3' as import('tesseract.js').PSM});}
  }
  return text;
 };
 try{
  if(file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf')){
   const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc='/pdf/pdf.worker.min.mjs';
   const loadingTask=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),cMapUrl:'/pdf/cmaps/',cMapPacked:true,standardFontDataUrl:'/pdf/standard_fonts/',wasmUrl:'/pdf/wasm/',iccUrl:'/pdf/iccs/'});
   try{
    const pdf=await loadingTask.promise;const pages:string[]=[];let usedOcr=false;const failed:number[]=[];
    for(let p=1;p<=pdf.numPages;p++){
     check();const page=await pdf.getPage(p);let pageText='';
     try{
      // A damaged text layer must not prevent reading the rendered page.
      try{pageText=pdfPageText((await page.getTextContent()).items);}catch{check();}
      if(needsOcr(pageText)){
       const viewport=page.getViewport({scale:Math.min(2.5,2500/Math.max(page.getViewport({scale:1}).width,page.getViewport({scale:1}).height))});
       const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
       try{const ctx=canvas.getContext('2d');if(!ctx)throw Error('No canvas');await page.render({canvas,canvasContext:ctx,viewport}).promise;const ocr=await recognize(canvas);if(quality(ocr)>quality(pageText)){pageText=ocr;usedOcr=true;}}
       catch(error){check();if(!pageText.trim())failed.push(p);if(error instanceof DOMException&&error.name==='AbortError')throw error;}
       finally{canvas.width=0;canvas.height=0;}
      }
      pages.push(pageText);
     }finally{page.cleanup();onProgress(p/pdf.numPages);}
    }
    return {text:pages.join('\n'),method:usedOcr?'ocr':'text',warnings:failed.length?[`No se pudo leer la página ${failed.join(', ')}. El resto del documento se completó automáticamente.`]:[]};
   }finally{await loadingTask.destroy();}
  }
  const text=await recognize(file);onProgress(1);return {text,method:'ocr',warnings:[]};
 }catch(error){check();throw new Error(file.type==='application/pdf'?'No pudimos leer este PDF. Volvé a intentar con el original sin contraseña o una foto clara del documento.':'No pudimos leer esta imagen. Volvé a intentar con una foto más clara.',{cause:error});}
 finally{await worker?.terminate();}
}
async function createOcrWorker(){const {createWorker}=await import('tesseract.js');return createWorker('spa',1,{workerPath:'/ocr/worker.min.js',workerBlobURL:false,corePath:'/ocr',langPath:'/ocr',gzip:true,cacheMethod:'none'});}
