import type {DocumentRecord} from './types';
import {referenceStatus} from './comparisons';
import {formatDate} from './calendar';
const labels={normal:'Normal',low:'Bajo',high:'Alto',unknown:'Sin referencia'};
const colors={normal:'0.08 0.42 0.24',low:'0.12 0.36 0.65',high:'0.72 0.32 0.05',unknown:'0.32 0.4 0.46'};
function latin(text:string){return text.replace(/[–—]/g,'-').replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/[^\x20-\xff]/g,'?');}
function escape(text:string){return latin(text).replace(/([\\()])/g,'\\$1');}
function wrap(text:string,max:number){return text.split(/\n/).flatMap(line=>{const rows:string[]=[];let current='';for(const word of line.split(/\s+/)){if(current.length+word.length+1>max&&current){rows.push(current);current='';}for(let part=0;part<word.length;part+=max){const chunk=word.slice(part,part+max);if(part>0){rows.push(current);current=chunk;}else current+=(current?' ':'')+chunk;}}if(current)rows.push(current);return rows.length?rows:[''];});}
export function buildReportPdf(record:DocumentRecord):Uint8Array{
 const pages:string[]=[];let commands='',y=756;
 const text=(value:string,x:number,size=11,bold=false,color='0.08 0.23 0.34')=>{commands+=`${color} rg BT /${bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escape(value)}) Tj ET\n`;};
 const header=()=>{y=792;text('CLÍNICA OSCAR',40,19,true);y=766;text('Informe del documento',40,12);y=744;};
 const finish=()=>{y=30;text(`Resumen automático · ${pages.length+1}`,40,9);pages.push(commands);commands='';};
 const ensure=(height:number)=>{if(y-height<70){finish();header();}};
 const paragraph=(value:string,size=11,bold=false)=>{for(const line of wrap(value,size>=16?50:90)){ensure(size+6);text(line,40,size,bold);y-=size+6;}y-=8;};
 header();paragraph(record.title,18,true);paragraph(`${(record.medicalDate?formatDate(record.medicalDate):'Fecha pendiente')} · ${record.category==='analysis'?'Análisis':'Estudio'}`);if(record.institution)paragraph(record.institution);
 if(record.measurements.length){
  const tableHeader=()=>{ensure(35);commands+=`0.93 0.96 0.98 rg 40 ${y-9} 515 26 re f\n`;text('Indicador',45,10,true);text('Resultado',235,10,true);text('Referencia',350,10,true);text('Estado',480,10,true);y-=32;};tableHeader();
  for(const m of record.measurements){const a=wrap(m.indicatorName,30),b=wrap(`${m.rawValue} ${m.unit??''}`,18),c=wrap(m.referenceText??'No informada',20),status=referenceStatus(m),d=wrap(labels[status],12);const height=Math.max(a.length,b.length,c.length,d.length)*15+12;if(y-height<70){finish();header();tableHeader();}const top=y;for(let line=0;line<Math.max(a.length,b.length,c.length,d.length);line++){y=top-line*15;if(a[line])text(a[line],45,10,true);if(b[line])text(b[line],235,10,true,colors[status]);if(c[line])text(c[line],350,10);if(d[line])text(d[line],480,10,false,colors[status]);}y=top-height;commands+=`0.82 0.88 0.92 RG 40 ${y+4} m 555 ${y+4} l S\n`;}
 }
 if(record.summary){y-=12;paragraph('Resumen del documento',12,true);paragraph(record.summary);}
 if(record.conclusions){paragraph('Conclusiones del original',12,true);paragraph(record.conclusions);}
 paragraph('Datos extraídos automáticamente. Referencias tomadas del documento. El original se conserva en Clínica Oscar.',10);
 finish();
 const objects:string[]=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];
 const pageIds:number[]=[];
 for(const content of pages){const pageId=objects.length+1,streamId=pageId+1;pageIds.push(pageId);objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`,`<< /Length ${content.length} >>\nstream\n${content}endstream`);}
 objects[1]=`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
 let pdf='%PDF-1.4\n';const offsets=[0];objects.forEach((object,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${object}\nendobj\n`;});const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(offset=>`${String(offset).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;return Uint8Array.from(pdf,c=>c.charCodeAt(0));
}
