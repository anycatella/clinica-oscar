import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({page:vi.fn(),recognize:vi.fn(),terminate:vi.fn()}));
vi.mock('pdfjs-dist',()=>({GlobalWorkerOptions:{},OPS:{paintImageXObject:1,paintInlineImageXObject:2},getDocument:()=>({promise:Promise.resolve({numPages:1,getPage:mocks.page}),destroy:vi.fn()})}));
vi.mock('tesseract.js',()=>({createWorker:async()=>({recognize:mocks.recognize,terminate:mocks.terminate,setParameters:vi.fn()})}));
import {extractDocument} from '../lib/client/extract-document';
const file={type:'application/pdf',name:'laboratorio.pdf',arrayBuffer:async()=>new ArrayBuffer(0)} as File;
describe('automatic PDF recovery',()=>{
 beforeEach(()=>{vi.clearAllMocks();vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({})})});mocks.recognize.mockResolvedValue({data:{text:'Fecha: 10/10/2026\nGlucosa 96 mg/dL 70 - 99'}});});
 it('keeps usable text when inspecting image operators fails',async()=>{
  mocks.page.mockResolvedValue({getTextContent:async()=>({items:[{str:'Fecha: 10/10/2026',hasEOL:true},{str:'Glucosa 96 mg/dL 70 - 99'}]}),getOperatorList:async()=>{throw Error('unsupported image');},cleanup:vi.fn()});
  const result=await extractDocument(file,vi.fn());expect(result.text).toContain('Glucosa');expect(result.warnings).toEqual([]);expect(result.method).toBe('text');
 });
 it('reads the rendered page automatically when the PDF text layer fails',async()=>{
  mocks.page.mockResolvedValue({getTextContent:async()=>{throw Error('bad font encoding');},getOperatorList:async()=>({fnArray:[]}),getViewport:()=>({width:500,height:700}),render:()=>({promise:Promise.resolve()}),cleanup:vi.fn()});
  const result=await extractDocument(file,vi.fn());expect(result.text).toContain('Glucosa 96');expect(result.method).toBe('ocr');expect(result.warnings).toEqual([]);
 });
});
