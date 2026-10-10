import {datesInText} from './report-dates';
type TextItem={str:string;transform?:number[];hasEOL?:boolean};
export function pdfPageText(items:unknown[]):string{
 const text=items.filter((item):item is TextItem=>typeof item==='object'&&item!==null&&'str' in item&&typeof item.str==='string');
 if(text.some(item=>!item.transform))return text.map(item=>item.str+(item.hasEOL?'\n':' ')).join('');
 const rows:{y:number;items:TextItem[]}[]=[];
 for(const item of text){if(!item.str.trim())continue;const y=item.transform![5];let row=rows.find(row=>Math.abs(row.y-y)<3);if(!row){row={y,items:[]};rows.push(row);}row.items.push(item);}
 const associated:string[]=[];
 for(const value of text.filter(item=>datesInText(item.str).length)){
  const [x,y]=value.transform!.slice(4);
  const labels=text.filter(item=>/^(?:fecha(?: de)?|date|nacimiento|protocolo|extracci[oó]n|toma(?: de muestra)?|realizaci[oó]n|estudio|an[aá]lisis|ingreso)\s*:?$/i.test(item.str.trim())&&item!==value&&item.transform![4]<x&&x-item.transform![4]<200&&Math.abs(item.transform![5]-y)<18);
  labels.sort((a,b)=>(x-a.transform![4])+Math.abs(a.transform![5]-y)*4-(/:$/.test(a.str)?5:0)-((x-b.transform![4])+Math.abs(b.transform![5]-y)*4-(/:$/.test(b.str)?5:0)));
  if(labels[0])associated.push(`${labels[0].str} ${value.str}`);
 }
 return rows.sort((a,b)=>b.y-a.y).map(row=>row.items.sort((a,b)=>a.transform![4]-b.transform![4]).map(item=>item.str).join('\t')).join('\n')+'\n'+associated.join('\n');
}
