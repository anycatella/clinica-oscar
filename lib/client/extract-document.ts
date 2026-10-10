import { pdfPageText } from '../domain/pdf-text';
export async function extractDocument(file:File,onProgress:(n:number)=>void,signal?:AbortSignal):Promise<{text:string;method:'text'|'ocr'|'manual';warnings:string[]}>{
 const warnings:string[]=[];let text='';
 const check=()=>{if(signal?.aborted)throw new DOMException('Cancelado','AbortError');};check();
 if(file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf')){
  const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc='/pdf/pdf.worker.min.mjs';
  let pdf;
  const loadingTask=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())});
  try{pdf=await loadingTask.promise;}catch{return {text:'',method:'manual',warnings:['No pudimos abrir este PDF. Podés guardar el original e ingresar los datos manualmente.']};}
  let worker:Awaited<ReturnType<typeof createOcrWorker>>|undefined;let usedOcr=false;
  try{
   for(let p=1;p<=pdf.numPages;p++){
    check();const page=await pdf.getPage(p);const content=await page.getTextContent();
    let pageText=pdfPageText(content.items);
    const operators=await page.getOperatorList();const imagePage=operators.fnArray.some(op=>op===pdfjs.OPS.paintImageXObject||op===pdfjs.OPS.paintInlineImageXObject);
    if(pageText.trim().length<15||(imagePage&&content.items.length<12)){usedOcr=true;worker??=await createOcrWorker();check();const viewport=page.getViewport({scale:1.8});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);const ctx=canvas.getContext('2d');if(!ctx)throw new Error('No canvas');await page.render({canvas,canvasContext:ctx,viewport}).promise;pageText=(await worker.recognize(canvas)).data.text;canvas.width=0;canvas.height=0;}
    text+=pageText+'\n';page.cleanup();onProgress(p/pdf.numPages);
   }
   return {text,method:usedOcr?'ocr':'text',warnings};
  }catch(error){if(signal?.aborted)throw error;return {text,method:'manual',warnings:['La lectura quedó incompleta. Revisá los datos o ingresalos manualmente.']};}finally{await worker?.terminate();await loadingTask.destroy();}
 }
 let worker;
 try{worker=await createOcrWorker();check();const result=await worker.recognize(file);onProgress(1);return {text:result.data.text,method:'ocr',warnings};}catch(error){if(signal?.aborted)throw error;return {text:'',method:'manual',warnings:['No pudimos leer la imagen. Podés ingresar los datos manualmente.']};}finally{await worker?.terminate();}
}
async function createOcrWorker(){const { createWorker }=await import('tesseract.js');return createWorker('spa',1,{workerPath:'/ocr/worker.min.js',corePath:'/ocr',langPath:'/ocr',gzip:true,cacheMethod:'none'});}
